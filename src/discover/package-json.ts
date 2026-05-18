import path from "node:path";
import { findFiles, readJson, toPosixRelative } from "../files.js";
import type { CommandSource } from "../types.js";

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
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
    for (const [name, command] of Object.entries(manifest.scripts).sort()) {
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
