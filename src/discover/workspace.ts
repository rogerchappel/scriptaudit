import path from "node:path";
import { parseDocument, isMap, isSeq, isScalar } from "yaml";
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

  const document = parseDocument(text);
  if (!isMap(document.contents)) return [];
  const packagesNode = document.contents.get("packages", true);
  if (!isSeq(packagesNode)) return [];
  const packages = packagesNode.items
    .filter(isScalar)
    .map((item) => item.value)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

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
