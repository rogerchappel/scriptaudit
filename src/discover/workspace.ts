import path from "node:path";
import { exists, readText } from "../files.js";
import type { CommandSource } from "../types.js";

export async function discoverWorkspaceHints(root: string): Promise<CommandSource[]> {
  const workspaceFile = path.join(root, "pnpm-workspace.yaml");
  if (!(await exists(workspaceFile))) {
    return [];
  }

  const text = await readText(workspaceFile);
  if (!text) {
    return [];
  }

  const packages: string[] = [];
  let packagesIndent: number | undefined;
  for (const line of text.split(/\r?\n/)) {
    const key = /^(\s*)packages\s*:\s*(?:#.*)?$/.exec(line);
    if (key) {
      packagesIndent = key[1].length;
      continue;
    }
    if (packagesIndent === undefined || !line.trim() || /^\s*#/.test(line)) continue;

    const indent = /^\s*/.exec(line)?.[0].length ?? 0;
    if (indent <= packagesIndent) {
      packagesIndent = undefined;
      continue;
    }
    const item = /^\s*-\s+(?:'([^']*)'|"([^"]*)"|([^#]*?))\s*(?:#.*)?$/.exec(line);
    const value = (item?.[1] ?? item?.[2] ?? item?.[3])?.trim();
    if (value) packages.push(value);
  }

  return packages.map((workspace, index) => ({
    id: `pnpm-workspace.yaml#package-${index + 1}`,
    name: `workspace:${workspace}`,
    command: `pnpm --filter ${workspace} run`,
    kind: "npm-workspace",
    workspace,
    location: {
      file: "pnpm-workspace.yaml"
    }
  }));
}
