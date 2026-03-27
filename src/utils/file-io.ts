import { access, readFile as fsReadFile } from "node:fs/promises";
import path from "node:path";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(path.resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

export async function readFile(filePath: string): Promise<string> {
  return fsReadFile(path.resolve(filePath), "utf8");
}

export async function readFileIfExists(filePath: string): Promise<string | null> {
  if (await fileExists(filePath)) {
    return readFile(filePath);
  }
  return null;
}
