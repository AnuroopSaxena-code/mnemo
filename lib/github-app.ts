import jwt from "jsonwebtoken";

function getJwt(): string {
  const appId = process.env.GITHUB_APP_ID;
  const privateKeyRaw = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKeyRaw) {
    throw new Error("Missing GitHub App credentials (GITHUB_APP_ID or GITHUB_PRIVATE_KEY).");
  }

  // Handle literal newlines (\n) inside single-line env string definitions
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // Backdate 1 minute for clock drift
    exp: now + 540, // 9 minutes expiration
    iss: appId
  };

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

export async function getInstallationToken(installationId: string): Promise<string> {
  const jwtToken = getJwt();
  const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${jwtToken}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mnemo-app"
    }
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to exchange GitHub installation token: ${res.status} ${errorBody}`);
  }

  const data = await res.json();
  return data.token;
}

export async function postPRComment(
  owner: string,
  repo: string,
  pullNumber: number,
  commentBody: string,
  installationId: string
): Promise<void> {
  const token = await getInstallationToken(installationId);
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${pullNumber}/comments`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mnemo-app",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body: commentBody })
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Failed to post GitHub comment to PR #${pullNumber}: ${res.status} ${errorBody}`);
  }
}

export async function fetchPRHistory(
  owner: string,
  repo: string,
  installationId: string
): Promise<Array<{ title: string; body: string; number: number; comments: string[] }>> {
  const token = await getInstallationToken(installationId);
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=50`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mnemo-app"
    }
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to fetch PR history from ${owner}/${repo}: ${res.status} ${errorBody}`);
  }

  const prs: any[] = await res.json();
  const mergedPrs = prs.filter((pr) => pr.merged_at !== null);

  const results = [];
  for (const pr of mergedPrs) {
    // Fetch top comments for this PR (which acts as an issue on GitHub)
    const commentsUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${pr.number}/comments?per_page=10`;
    let comments: string[] = [];
    try {
      const commRes = await fetch(commentsUrl, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "mnemo-app"
        }
      });
      if (commRes.ok) {
        const commData: any[] = await commRes.json();
        comments = commData.map((c) => c.body || "");
      }
    } catch (err) {
      console.warn(`Failed to fetch comments for PR #${pr.number}:`, err);
    }

    results.push({
      number: pr.number,
      title: pr.title || "",
      body: pr.body || "",
      comments
    });
  }

  return results;
}

export async function fetchADRFiles(
  owner: string,
  repo: string,
  installationId: string
): Promise<Array<{ path: string; content: string }>> {
  const token = await getInstallationToken(installationId);
  const adrPaths = ["doc/adr", "docs/decisions", "docs/adr"];
  const results: Array<{ path: string; content: string }> = [];

  for (const path of adrPaths) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "mnemo-app"
        }
      });

      if (!res.ok) continue; // Try next path if this one doesn't exist

      const items: any = await res.json();
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        if (item.type === "file" && item.name.endsWith(".md")) {
          // Fetch file content
          const fileRes = await fetch(item.url, {
            headers: {
              "Authorization": `token ${token}`,
              "Accept": "application/vnd.github.raw+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "User-Agent": "mnemo-app"
            }
          });
          if (fileRes.ok) {
            const content = await fileRes.text();
            results.push({ path: item.path, content });
          }
        }
      }
      break; // Successfully found one of the ADR directories, stop looking at other path options
    } catch (err) {
      console.warn(`Error scanning path ${path} for ADRs:`, err);
    }
  }

  return results;
}
