import { discoverMakeTargets } from "./makefile.js";
import { discoverMarkdownCommands } from "./markdown.js";
import { discoverPackageScripts } from "./package-json.js";
import { discoverTaskFiles } from "./taskfiles.js";
import { discoverWorkspaceHints } from "./workspace.js";
import type { CommandSource } from "../types.js";

export async function discoverCommands(root: string): Promise<CommandSource[]> {
  const groups = await Promise.all([
    discoverPackageScripts(root),
    discoverMakeTargets(root),
    discoverMarkdownCommands(root),
    discoverTaskFiles(root),
    discoverWorkspaceHints(root)
  ]);

  return groups
    .flat()
    .sort((left, right) => left.id.localeCompare(right.id));
}
