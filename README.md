# varyk-editors

Editor support for [Varyk](https://varyk.com), a language for backend
services that compiles to Rust: highlighting, comment toggling, bracket
matching, and indentation for `.vr` files in VS Code (and the editors
built on it), Zed, and JetBrains IDEs, and diagnostics and quick fixes
from `varyk lsp` in VS Code and Zed. Highlighting never depends on the
language server.

Varyk is experimental and pre-1.0: anything here may change.

## VS Code

Install **Varyk** (`varyk.varyk`) from the Visual Studio
Marketplace, or from Open VSX in VSCodium and the other editors that use
it.

Highlighting, comments, brackets, and indentation work in every folder.
Diagnostics and quick fixes come from `varyk lsp`, which needs `varyk`
0.9 or later: when the extension starts, it runs `varyk lsp --help`, and
when that fails it shows one message ("Varyk diagnostics need varyk 0.9
or later on your PATH, or set varyk.path") and highlights as usual.

- `varyk.path` (default `varyk`) is the command that starts the server,
  run as `<varyk.path> lsp`. Set it when `varyk` is not on your `PATH`;
  changing it restarts the server.
- In Restricted Mode, a folder VS Code does not trust, the extension
  highlights but runs nothing, not even a `varyk.path` set by the
  folder's own settings. Diagnostics start once you trust the folder.

To run the extension from a checkout:

```sh
cd vscode
npm ci
code --extensionDevelopmentPath="$PWD"
```

## Zed

Install **Varyk** from Zed's extensions panel. It highlights with the
Tree-sitter grammar of
[tree-sitter-varyk](https://github.com/Varyk-Lang/tree-sitter-varyk) and
gives the outline panel, comment toggling, brackets, and indentation.

Diagnostics and quick fixes need `varyk` 0.9 or later on the path Zed
sees for the project; there is no setting. When `varyk` is missing or
too old, highlighting stays and the reason is in Zed's log
(`zed: open log`).

To run the extension from a checkout, use "zed: install dev extension"
and choose the `zed/` folder (Zed builds it, which needs Rust installed
with rustup).

## JetBrains

JetBrains IDEs read the VS Code extension's folder as a TextMate bundle:
in Settings, open Editor, then TextMate Bundles, click add, and choose
the `vscode/` folder of a checkout of this repository. That gives
highlighting, `//` comment toggling, and bracket matching for `.vr`
files. There are no diagnostics in JetBrains IDEs yet; they need a
plugin on the IDE's own language server API.

## Other editors

Any editor that speaks the Language Server Protocol over stdio can run
`varyk lsp` (with `varyk` 0.9 or later) for `.vr` files. The TextMate
grammar is
[`textmate/varyk.tmLanguage.json`](textmate/varyk.tmLanguage.json), and
the Tree-sitter grammar is
[tree-sitter-varyk](https://github.com/Varyk-Lang/tree-sitter-varyk).

## How the grammars stay current

The compiler is the authority on Varyk's syntax; the grammars only
colour what it accepts. The TextMate grammar's keywords are the
compiler's keyword list exactly, pinned in
[`textmate/keywords.txt`](textmate/keywords.txt) and checked on every
pull request; a nightly check compares that list with the compiler's
lexer and goes red when the compiler moves. A change to what the
compiler accepts comes with pull requests here and to tree-sitter-varyk
(the rule in Varyk's
[AGENTS.md](https://github.com/Varyk-Lang/varyk/blob/main/AGENTS.md)).
The website's grammar, `varyk.com/syntaxes/varyk.json`, is a copy of
this one.

## More

- The design:
  [`docs/specs/2026-10-11-varyk-editors-design.md`](docs/specs/2026-10-11-varyk-editors-design.md),
  the language server's
  [spec](https://github.com/Varyk-Lang/varyk/blob/main/docs/specs/2026-10-11-language-server-design.md),
  and the Tree-sitter grammar's
  [spec](https://github.com/Varyk-Lang/tree-sitter-varyk/blob/main/docs/specs/2026-10-11-tree-sitter-varyk-design.md)
- Building, testing, and releasing: [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Licensed under either of [MIT](LICENSE-MIT) or
[Apache-2.0](LICENSE-APACHE), at your option. The name "Varyk" and its
logo are trademarks and are not covered by those licenses; see
[TRADEMARKS.md](TRADEMARKS.md).
