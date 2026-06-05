import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET || "default_session_secret_for_cookies";

export function createSession(userId: string, workspaceId: string): string {
  return jwt.sign({ userId, workspaceId }, SECRET, { expiresIn: "7d" });
}

export function getSession(cookieHeader: string | null): { userId: string; workspaceId: string } | null {
  if (!cookieHeader) return null;
  const token = cookieHeader.split("; ").find(c => c.startsWith("session="))?.split("=")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as { userId: string; workspaceId: string };
  } catch {
    return null;
  }
}
