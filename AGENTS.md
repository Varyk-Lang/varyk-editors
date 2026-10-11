# Working on varyk-editors

This file is for anyone, human or AI agent, making changes to this
repository. [CONTRIBUTING.md](CONTRIBUTING.md) has the details; this is
the short list of rules.

## What this is

varyk-editors gives `.vr` files highlighting, comment toggling, bracket
matching, and indentation in VS Code (and the editors built on it), Zed,
and JetBrains IDEs, and diagnostics and quick fixes from `varyk lsp` in
VS Code and Zed. `textmate/` holds the TextMate grammar, its tests, and
its pinned keyword list; `vscode/` the VS Code extension, whose folder
JetBrains also reads as a TextMate bundle; `zed/` the Zed extension, on
the Tree-sitter grammar of
[`Varyk-Lang/tree-sitter-varyk`](https://github.com/Varyk-Lang/tree-sitter-varyk);
`scripts/` the keyword checks. The design is
[`docs/specs/2026-10-11-varyk-editors-design.md`](docs/specs/2026-10-11-varyk-editors-design.md);
read it before changing what the extensions do.

## The gate

CI's `grammar`, `vscode`, and `zed` jobs are the required checks; run
what CONTRIBUTING.md lists ("Build and test") before every pull request
and keep those job names. The nightly `drift` workflow is not required:
a red run means the compiler's keywords moved and this repository has
to follow.

## Rules

- **The compiler is the authority on syntax.** Nothing here validates
  Varyk. The grammars only colour what the compiler accepts; when they
  disagree, the grammar is wrong.
- **The keywords are the lexer's.** The TextMate grammar's keywords are
  the `KEYWORDS` array of the compiler's
  `crates/varyk-syntax/src/lexer.rs`, exactly, no more and no fewer;
  `textmate/keywords.txt` is updated with them in the same change.
- **The website copies the grammar.** `varyk.com`'s
  `syntaxes/varyk.json` is a copy of `textmate/varyk.tmLanguage.json`,
  so a grammar change here comes with a pull request to `varyk.com`
  copying it.
- **`vscode/syntaxes/` is a copy.** Edit `textmate/varyk.tmLanguage.json`
  and copy it to `vscode/syntaxes/varyk.tmLanguage.json`; CI fails when
  the two differ.
- **The Zed grammar pin and `highlights.scm` move together.**
  `zed/extension.toml` pins a commit of tree-sitter-varyk, and
  `zed/languages/varyk/highlights.scm` is that commit's
  `queries/highlights.scm`, recopied whenever the pin moves. Once
  tree-sitter-varyk has a release, the pin is the full SHA of its latest
  release tag's commit, never a branch head.
- **Commits.** Conventional prefixes (`feat:`, `fix:`, `docs:`, ...),
  no `<` or `>` in subjects or `BREAKING CHANGE:` footers, and no
  attribution lines (no `Co-Authored-By`, no "Generated with").
- **Docs move with the code.** README.md, CONTRIBUTING.md,
  `vscode/README.md`, and `docs/specs/` are updated in the same change
  whenever what they describe changes: versions, install, usage,
  settings, behaviour, links. Check them against the change before every
  pull request.
