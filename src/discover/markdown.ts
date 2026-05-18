import path from "node:path";
import { findFiles, readText, toPosixRelative } from "../files.js";
import type { CommandSource } from "../types.js";

const MARKDOWN_NAMES = new Set(["README.md", "CONTRIBUTING.md", "SECURITY.md", "TASKS.md", "ORCHESTRATION.md"]);
const COMMAND_PREFIX = /^(?:\$\s*)?(npm|pnpm|yarn|node|npx|bash|sh|make|just|task|deno|bun|tsx)\b/;

export async function discoverMarkdownCommands(root: string): Promise<CommandSource[]> {
  const files = await findFiles(root, MARKDOWN_NAMES);
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
  let inFence = false;
  let language = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = /^```\s*([A-Za-z0-9_-]*)/.exec(line);
    if (fence) {
      inFence = !inFence;
      language = inFence ? fence[1].toLowerCase() : "";
      continue;
    }

    if (!inFence || (language && !["bash", "sh", "shell", "console", "zsh"].includes(language))) {
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
