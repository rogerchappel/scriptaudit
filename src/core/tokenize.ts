export interface CommandTokens {
  words: string[];
  tools: string[];
}

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

export function tokenizeCommand(command: string): CommandTokens {
  const words = command
    .replace(/[;&|()]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  const tools = words
    .filter((word) => !word.startsWith("-") && !ASSIGNMENT.test(word))
    .filter((word, index) => index === 0 || ["&&", "||", ";", "|"].includes(words[index - 1]) || looksLikeTool(word))
    .map((word) => word.split("/").pop() ?? word);

  return {
    words,
    tools: [...new Set(tools)]
  };
}

function looksLikeTool(word: string): boolean {
  return [
    "npm",
    "pnpm",
    "yarn",
    "npx",
    "node",
    "tsx",
    "tsc",
    "vitest",
    "jest",
    "mocha",
    "eslint",
    "prettier",
    "bash",
    "sh",
    "curl",
    "wget",
    "git",
    "gh",
    "docker",
    "make"
  ].includes(word);
}
