import { findFiles, readText, toPosixRelative } from "../files.js";
import type { CommandSource } from "../types.js";

const TASK_FILES = new Set(["justfile", "Justfile", "Taskfile.yml", "Taskfile.yaml"]);

export async function discoverTaskFiles(root: string): Promise<CommandSource[]> {
  const files = await findFiles(root, TASK_FILES);
  const commands: CommandSource[] = [];

  for (const filePath of files) {
    const text = await readText(filePath);
    if (!text) {
      continue;
    }
    const relativeFile = toPosixRelative(root, filePath);
    if (relativeFile.toLowerCase().endsWith("justfile")) {
      commands.push(...discoverJustfile(relativeFile, text));
    } else {
      commands.push(...discoverTaskfile(relativeFile, text));
    }
  }

  return commands;
}

function discoverJustfile(file: string, text: string): CommandSource[] {
  const commands: CommandSource[] = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^([A-Za-z0-9_-]+):/.exec(lines[index]);
    if (!match) {
      continue;
    }
    const body = collectIndented(lines, index + 1);
    if (body) {
      commands.push({
        id: `${file}#${match[1]}`,
        name: match[1],
        command: body,
        kind: "justfile",
        location: { file, line: index + 1 }
      });
    }
  }
  return commands;
}

function discoverTaskfile(file: string, text: string): CommandSource[] {
  const commands: CommandSource[] = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^\s{2}([A-Za-z0-9_-]+):\s*$/.exec(lines[index]);
    if (!match) {
      continue;
    }
    const body = collectCommands(lines, index + 1);
    if (body) {
      commands.push({
        id: `${file}#${match[1]}`,
        name: match[1],
        command: body,
        kind: "taskfile",
        location: { file, line: index + 1 }
      });
    }
  }
  return commands;
}

function collectIndented(lines: string[], start: number): string {
  const body: string[] = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      break;
    }
    const command = line.trim();
    if (command && !command.startsWith("#")) {
      body.push(command);
    }
  }
  return body.join(" && ");
}

function collectCommands(lines: string[], start: number): string {
  const body: string[] = [];
  for (let index = start; index < lines.length; index += 1) {
    if (/^\s{2}[A-Za-z0-9_-]+:\s*$/.test(lines[index])) {
      break;
    }
    const match = /^\s*-\s+(.+)$/.exec(lines[index]);
    if (match) {
      const command = /^(?:cmd\s*:\s*)(.+)$/.exec(match[1].trim())?.[1] ?? match[1].trim();
      body.push(command);
    }
  }
  return body.join(" && ");
}
