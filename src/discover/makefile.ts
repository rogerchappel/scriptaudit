import { findFiles, readText, toPosixRelative } from "../files.js";
import type { CommandSource } from "../types.js";

const MAKEFILE_NAMES = new Set(["Makefile", "makefile", "GNUmakefile"]);

export async function discoverMakeTargets(root: string): Promise<CommandSource[]> {
  const files = await findFiles(root, MAKEFILE_NAMES);
  const commands: CommandSource[] = [];

  for (const filePath of files) {
    const text = await readText(filePath);
    if (!text) {
      continue;
    }
    const relativeFile = toPosixRelative(root, filePath);
    const lines = text.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const match = /^(?!\t|\s)([A-Za-z0-9_.-]+):(?:\s|$)/.exec(line);
      if (!match || match[1].startsWith(".")) {
        continue;
      }

      const body: string[] = [];
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        if (!lines[cursor].startsWith("\t")) {
          break;
        }
        body.push(lines[cursor].trim());
      }

      if (body.length > 0) {
        commands.push({
          id: `${relativeFile}#${match[1]}`,
          name: match[1],
          command: body.join(" && "),
          kind: "makefile",
          location: {
            file: relativeFile,
            line: index + 1
          }
        });
      }
    }
  }

  return commands;
}
