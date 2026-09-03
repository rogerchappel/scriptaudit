import path from "node:path";
import { findFiles, readJson, toPosixRelative } from "../files.js";
import type { CommandSource } from "../types.js";

interface PackageJson {
  name?: string;
  scripts?: unknown;
}

export async function discoverPackageScripts(root: string): Promise<CommandSource[]> {
  const packageFiles = await findFiles(root, new Set(["package.json"]));
  const commands: CommandSource[] = [];

  for (const filePath of packageFiles) {
    const manifest = await readJson<PackageJson>(filePath);
    if (!manifest?.scripts) {
      continue;
    }

    const relativeFile = toPosixRelative(root, filePath);
    if (!isRecord(manifest.scripts)) {
      throw new Error(`Invalid package scripts in ${relativeFile}: scripts must be an object of string values.`);
    }
    for (const [name, command] of Object.entries(manifest.scripts).sort()) {
      if (typeof command !== "string") {
        throw new Error(`Invalid package script in ${relativeFile} at scripts.${name}: expected a string.`);
      }
      commands.push({
        id: `${relativeFile}#scripts.${name}`,
        name,
        command,
        kind: "package-json",
        workspace: manifest.name ?? path.basename(path.dirname(filePath)),
        location: {
          file: relativeFile
        }
      });
    }
  }

  return commands;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
