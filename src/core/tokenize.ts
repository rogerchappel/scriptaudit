export interface CommandTokens {
  words: string[];
  tools: string[];
}

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

export function tokenizeCommand(command: string): CommandTokens {
  const words: string[] = [];
  let current = "";
  let quote: "'" | '"' | undefined;
  let escaped = false;
  let substitutionDepth = 0;

  const flush = (): void => {
    if (current) words.push(current);
    current = "";
  };

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    const next = command[index + 1];
    if (escaped) { current += character; escaped = false; continue; }
    if (character === "\\" && quote !== "'") { escaped = true; current += character; continue; }
    if (character === "$" && next === "(") { substitutionDepth += 1; current += "$("; index += 1; continue; }
    if (character === ")" && substitutionDepth > 0) { substitutionDepth -= 1; current += character; continue; }
    if (quote) {
      if (character === quote && substitutionDepth === 0) { quote = undefined; current += character; continue; }
      if (substitutionDepth > 0 && /[;&|()]/.test(character)) {
        flush();
        if ((character === "&" || character === "|") && next === character) index += 1;
        continue;
      }
      if (substitutionDepth > 0 && /\s/.test(character)) flush();
      else current += character;
      continue;
    }
    if (character === "'" || character === '"') { quote = character; current += character; continue; }
    if (/[;&|()]/.test(character) && (substitutionDepth > 0 || substitutionDepth === 0)) {
      if (substitutionDepth > 0 || character !== "(" && character !== ")") {
        flush();
        if ((character === "&" || character === "|") && next === character) index += 1;
        continue;
      }
    }
    if (/\s/.test(character)) { flush(); continue; }
    current += character;
  }
  flush();

  const toolNames = [
    "npm", "pnpm", "yarn", "npx", "node", "tsx", "tsc", "vitest", "jest", "mocha",
    "eslint", "prettier", "bash", "sh", "curl", "wget", "git", "gh", "docker", "make", "tee"
  ];
  const searchable = command.replace(/(['"])(?![^\n]*\$\()[^'"\n]*\1/g, " ");
  const tools = toolNames.filter((tool) => new RegExp(`(?:^|[\\s;&|()])${tool}(?=$|[\\s;&|()])`).test(searchable));
  const initial = words[0]?.replace(/^['"]|['"]$/g, "");
  if (initial && !initial.startsWith("$") && !ASSIGNMENT.test(initial)) tools.unshift(initial.split("/").pop() ?? initial);

  return { words, tools: [...new Set(tools)] };
}
