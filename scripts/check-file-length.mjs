// Fails if any source file exceeds the line limit.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const LIMIT = 500;
const EXT = /\.(ts|tsx|js|jsx|mjs|css)$/;
const failures = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXT.test(name)) {
      const lines = readFileSync(p, "utf8").split("\n").length;
      if (lines > LIMIT) failures.push(`${p}: ${lines} lines`);
    }
  }
}

walk("src");
walk("scripts");
if (failures.length) {
  console.error(`Files over ${LIMIT} lines:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`All source files are within ${LIMIT} lines.`);
