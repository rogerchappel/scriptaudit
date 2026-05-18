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

  const packages = text
    .split(/\r?\n/)
    .map((line) => /^\s*-\s+['"]?([^'"]+)['"]?\s*$/.exec(line)?.[1])
    .filter((value): value is string => Boolean(value));

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
