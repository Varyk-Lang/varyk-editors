// Checks that the TextMate grammar's four keyword patterns hold exactly the
// words of textmate/keywords.txt, the compiler's KEYWORDS as of the last sync.
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const grammarFile = new URL("textmate/varyk.tmLanguage.json", root);
const listFile = new URL("textmate/keywords.txt", root);
const entries = ["keywords-control", "keywords-other", "language-variables", "booleans"];

const grammar = JSON.parse(readFileSync(grammarFile, "utf8"));
const expected = readFileSync(listFile, "utf8").split("\n").map((w) => w.trim()).filter(Boolean);

const problems = [];
const found = [];
for (const key of entries) {
  const match = grammar.repository?.[key]?.match;
  const words = typeof match === "string" ? match.match(/^\\b\(([a-z|]+)\)\\b$/) : null;
  if (!words) {
    problems.push(`repository entry "${key}" is not a plain \\b(a|b|...)\\b alternation`);
    continue;
  }
  found.push(...words[1].split("|"));
}

const twice = found.filter((w, i) => found.indexOf(w) !== i);
const missing = expected.filter((w) => !found.includes(w));
const extra = found.filter((w) => !expected.includes(w));
if (twice.length) problems.push(`in the grammar more than once: ${[...new Set(twice)].join(" ")}`);
if (missing.length) problems.push(`in keywords.txt but not the grammar: ${missing.join(" ")}`);
if (extra.length) problems.push(`in the grammar but not keywords.txt: ${extra.join(" ")}`);

if (problems.length) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
console.log(`keywords match: ${found.length} words`);
