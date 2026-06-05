import crypto from "crypto";

export function verifyGitHubSignature(secret: string | undefined, body: string, signature: string | null) {
  if (!secret) return true;
  if (!signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function extractGitHubComment(payload: any) {
  const comment = payload.comment?.body || payload.review?.body || "";
  const repo = payload.repository?.full_name || "unknown/repo";
  const author = payload.comment?.user?.login || payload.review?.user?.login || payload.sender?.login || "unknown";
  const title = payload.pull_request?.title || payload.issue?.title || "GitHub discussion";
  const url = payload.comment?.html_url || payload.review?.html_url || payload.pull_request?.html_url || payload.issue?.html_url;
  return {
    comment,
    source: `${repo}: ${title} by @${author}`,
    url
  };
}
