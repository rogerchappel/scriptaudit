import path from "node:path";
import { findFilesByExtension, readText, toPosixRelative } from "../files.js";
import type { CommandSource } from "../types.js";

const COMMAND_PREFIX = /^(?:\$\s*)?(?:npm|pnpm|yarn|node|npx|bash|sh|make|just|task|deno|bun|tsx|curl|wget|docker(?:-compose)?|git|gh|rm|sudo|chmod|chown|vercel|flyctl|netlify|changeset)\b/;

export async function discoverMarkdownCommands(root: string): Promise<CommandSource[]> {
  const files = await findFilesByExtension(root, ".md");
  const commands: CommandSource[] = [];

  for (const filePath of files) {
    const text = await readText(filePath);
    if (!text) {
      continue;
    }
    const relativeFile = toPosixRelative(root, filePath);
    commands.push(...extractCodeBlockCommands(relativeFile, text));
  }

  return commands;
}

function extractCodeBlockCommands(relativeFile: string, text: string): CommandSource[] {
  const commands: CommandSource[] = [];
  const lines = text.split(/\r?\n/);
  let fenceMarker = "";
  let language = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (fenceMarker) {
      const closingFence = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line);
      if (closingFence && closingFence[1][0] === fenceMarker[0] && closingFence[1].length >= fenceMarker.length) {
        fenceMarker = "";
        language = "";
        continue;
      }
    } else {
      const openingFence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      const info = openingFence?.[2].trim() ?? "";
      if (openingFence && (openingFence[1][0] !== "`" || !info.includes("`"))) {
        fenceMarker = openingFence[1];
        language = (info.split(/\s+/, 1)[0] ?? "").toLowerCase();
        continue;
      }
    }

    if (!fenceMarker || (language && !["bash", "sh", "shell", "console", "zsh"].includes(language))) {
      continue;
    }

    const command = line.trim().replace(/^\$\s*/, "");
    if (!COMMAND_PREFIX.test(command)) {
      continue;
    }

    const basename = path.basename(relativeFile, ".md").toLowerCase();
    commands.push({
      id: `${relativeFile}#code-${index + 1}`,
      name: `${basename}:line-${index + 1}`,
      command,
      kind: "markdown",
      location: {
        file: relativeFile,
        line: index + 1
      }
    });
  }

  return commands;
}
