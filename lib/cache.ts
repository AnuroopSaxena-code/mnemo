import fs from "fs/promises";
import path from "path";

const cacheDir = path.join(process.cwd(), ".mnemo-cache");

async function ensureCacheDir() {
  await fs.mkdir(cacheDir, { recursive: true });
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(cacheDir, `${key}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T) {
  if (process.env.VERCEL) return; // Skip cache files write on Vercel
  await ensureCacheDir();
  await fs.writeFile(path.join(cacheDir, `${key}.json`), JSON.stringify(value, null, 2));
}
