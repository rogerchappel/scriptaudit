import { promises as fs } from "node:fs";
import path from "node:path";

const OSS_CLI_CONFIG = {
  knownSafe: ["test", "check", "build", "smoke", "validate"],
  blocked: ["deploy", "publish"],
  rules: [
    {
      match: "clean",
      risk: "caution",
      reason: "Cleanup commands may delete generated files; inspect before running."
    }
  ]
};

export async function initConfig(root: string, preset: string): Promise<string> {
  if (preset !== "oss-cli") {
    throw new Error(`Unsupported preset: ${preset}`);
  }

  const target = path.join(root, "scriptaudit.config.json");
  await fs.writeFile(target, `${JSON.stringify(OSS_CLI_CONFIG, null, 2)}\n`, { flag: "wx" });
  return target;
}
