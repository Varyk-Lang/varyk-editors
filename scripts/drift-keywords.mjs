// Checks that textmate/keywords.txt still holds the words of the compiler's
// KEYWORDS array. Usage: node scripts/drift-keywords.mjs path/to/lexer.rs
import { readFileSync } from "node:fs";

const lexerPath = process.argv[2];
if (!lexerPath) {
  console.error("usage: node scripts/drift-keywords.mjs path/to/lexer.rs");
  process.exit(2);
}

const lexer = readFileSync(lexerPath, "utf8");
const start = lexer.indexOf("pub const KEYWORDS");
const open = start === -1 ? -1 : lexer.indexOf("&[", start);
// The array's closing bracket: the first "];" after its opening, so the
// RESERVED_KEYWORDS array that follows is never read.
const close = open === -1 ? -1 : lexer.indexOf("];", open);
if (close === -1) {
  console.error(`no KEYWORDS array found in ${lexerPath}`);
  process.exit(1);
}
const compiler = [...lexer.slice(open, close).matchAll(/\("([a-z_]+)"/g)].map((m) => m[1]);

const listFile = new URL("../textmate/keywords.txt", import.meta.url);
const pinned = readFileSync(listFile, "utf8").split("\n").map((w) => w.trim()).filter(Boolean);

const added = compiler.filter((w) => !pinned.includes(w));
const removed = pinned.filter((w) => !compiler.includes(w));
if (added.length || removed.length) {
  if (added.length) console.error(`added to the compiler's KEYWORDS: ${added.join(" ")}`);
  if (removed.length) console.error(`removed from the compiler's KEYWORDS: ${removed.join(" ")}`);
  console.error("update textmate/keywords.txt and the grammar's keyword patterns to match");
  process.exit(1);
}
console.log(`keywords in sync with the compiler: ${compiler.length} words`);
