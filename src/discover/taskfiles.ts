import { findFiles, readText, toPosixRelative } from "../files.js";
import type { CommandSource } from "../types.js";
import { parse } from "yaml";

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
    const match = /^([A-Za-z0-9_-]+)(?:\s+[^:=\s][^:]*)?:\s*(?:#.*)?$/.exec(lines[index]);
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
  let document: unknown;
  try {
    document = parse(text);
  } catch {
    return commands;
  }
  if (!isRecord(document) || !isRecord(document.tasks)) {
    return commands;
  }
  for (const [name, task] of Object.entries(document.tasks)) {
    if (!isRecord(task)) {
      continue;
    }
    const body = taskCommands(task.cmds);
    if (body) {
      commands.push({
        id: `${file}#${name}`,
        name,
        command: body,
        kind: "taskfile",
        location: { file, line: taskLine(text, name) }
      });
    }
  }
  return commands;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function taskCommands(value: unknown): string {
  const entries = Array.isArray(value) ? value : [value];
  return entries
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (isRecord(entry) && typeof entry.cmd === "string") return entry.cmd.trim();
      return "";
    })
    .filter(Boolean)
    .join(" && ");
}

function taskLine(text: string, taskName: string): number | undefined {
  const lines = text.split(/\r?\n/);
  const escapedName = taskName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^\\s{2,}${escapedName}:\\s*(?:#.*)?$`);
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : undefined;
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
