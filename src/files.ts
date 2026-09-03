import { promises as fs } from "node:fs";
import path from "node:path";

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function readJson<T>(filePath: string): Promise<T | null> {
  const content = await readText(filePath);
  if (content === null) {
    return null;
  }
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error(`Invalid JSON in ${filePath}.`);
  }
}

export async function findFiles(root: string, names: Set<string>): Promise<string[]> {
  const found: string[] = [];
  await walk(root, found, names);
  return found.sort((left, right) => left.localeCompare(right));
}

export async function findFilesByExtension(root: string, extension: string): Promise<string[]> {
  const found: string[] = [];
  await walkByExtension(root, found, extension);
  return found.sort((left, right) => left.localeCompare(right));
}

async function walk(dir: string, found: string[], names: Set<string>): Promise<void> {
  let entries: Array<import("node:fs").Dirent>;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, found, names);
    } else if (entry.isFile() && names.has(entry.name)) {
      found.push(fullPath);
    }
  }
}

async function walkByExtension(dir: string, found: string[], extension: string): Promise<void> {
  let entries: Array<import("node:fs").Dirent>;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkByExtension(fullPath, found, extension);
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      found.push(fullPath);
    }
  }
}

export function toPosixRelative(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}
