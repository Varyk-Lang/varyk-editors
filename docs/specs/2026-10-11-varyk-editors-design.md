# varyk-editors: Varyk in VS Code, Zed, and JetBrains

Date: 2026-10-11.

**Status.** Implemented, not yet released. `varyk-editors` holds the
TextMate grammar for Varyk and the editor extensions built on it and on
`Varyk-Lang/tree-sitter-varyk`
(`docs/specs/2026-10-11-tree-sitter-varyk-design.md` there, "tree-sitter
§n"). The extensions start `varyk lsp`, the language server built into
the compiler (`Varyk-Lang/varyk`,
`docs/specs/2026-10-11-language-server-design.md`, "server §n"), whose
section 8 holds the rule that keeps these grammars current. Varyk is
experimental and pre-1.0: anything here may change.

## 1. Summary and scope

Highlighting, comment toggling, bracket matching, and indentation for
`.vr` files in VS Code (and the editors built on it), Zed, and JetBrains
IDEs; diagnostics and quick fixes from `varyk lsp` in VS Code and Zed.

### 1.1 Decisions

- **One repository for the grammar and every extension**, so a grammar
  change and the extensions that ship it are one pull request and one
  release. The Tree-sitter grammar is the exception: editors fetch
  grammars by repository, so it has its own.
- **One TextMate grammar for three users**: the VS Code extension,
  JetBrains (which reads the VS Code extension's folder), and the website,
  which copies it.
- **Highlighting never depends on the server.** Without `varyk` on the
  path, or with one too old for `lsp`, an extension highlights as usual
  and says why diagnostics are off (VS Code once, in a message; Zed in
  its log).
- **No build step.** The VS Code extension is plain JavaScript with one
  dependency and no bundler; the Zed extension is a few lines of Rust.

## 2. Repository

```text
textmate/varyk.tmLanguage.json   the TextMate grammar (section 3)
textmate/tests/                  its tests (section 7)
textmate/keywords.txt            its pinned keyword list (section 7)
vscode/                          the VS Code extension (section 4)
zed/                             the Zed extension (section 5)
scripts/                         drift checks (section 7)
README.md                        install and use, per editor; JetBrains (section 6)
AGENTS.md CONTRIBUTING.md CHANGELOG.md LICENSE-MIT LICENSE-APACHE TRADEMARKS.md
.github/workflows/               ci, drift, commit-messages, release
release-please-config.json .release-please-manifest.json
docs/specs/ docs/plans/
```

`AGENTS.md` states the rules: the compiler is the authority on syntax;
the TextMate grammar's keywords are the lexer's `KEYWORDS` exactly; the
website copies `textmate/varyk.tmLanguage.json`, so a change here comes
with a pull request to `varyk.com`; the gate is section 7's CI.

## 3. The TextMate grammar

`textmate/varyk.tmLanguage.json`, `name` `varyk` (as the website's
grammar has, whose ` ```varyk ` code blocks must keep highlighting),
`scopeName` `source.varyk`, file
type `vr`. It replaces the website's `syntaxes/varyk.json`, which lacks
almost half of the keywords. Patterns, in order:

| Pattern | Scope |
|---|---|
| `//` to end of line | `comment.line.double-slash.varyk` |
| `"…"` with escapes `\n \t \\ \" \0` | `string.quoted.double.varyk`, `constant.character.escape.varyk` |
| `{}` and `{…}` inside a string; a doubled `{{` or `}}`, which prints one brace, is matched first and left plain | `constant.other.placeholder.varyk` |
| `#[name]`, `#[name(…)]` | `meta.attribute.varyk` |
| integers with `_`, floats with digits on both sides | `constant.numeric.varyk` |
| `true`, `false` | `constant.language.boolean.varyk` |
| `if else match while for in break continue return await` | `keyword.control.varyk` |
| `fn struct enum impl mod use let mut pub async as` | `keyword.other.varyk` |
| `self crate super` | `variable.language.varyk` |
| `name!` | `entity.name.function.macro.varyk` |
| a name starting in lower case followed by `(` (so `Some(` and a tuple variant's `Circle(` fall to the rows below) | `entity.name.function.varyk` |
| primitive and standard types (`i8`…`u64`, `usize`, `f32`, `f64`, `bool`, `string`, `Option`, `Result`, `Vec`, `HashMap`, `Error`, `Shared`, `Task`, `Time`, `Uuid`, `Bytes`) | `support.type.varyk` |
| `Some None Ok Err` | `support.constant.varyk` |
| other capitalised names | `entity.name.type.varyk` |
| `::`, operators, `=>`, `->` | `punctuation.separator.varyk`, `keyword.operator.varyk` |

The keywords live in two patterns of the grammar's `repository`
(`keywords-control`, `keywords-other`) plus `self crate super` and
`true false`, written as plain alternations (`\b(if|else|…)\b`) so the
drift check (section 7) can read them. A declared name needs no pattern
of its own: the keyword before it matches first, and the rows for a name
followed by `(` and for a capitalised name already give a function's and
a type's name their scopes. The type list is checked against
the compiler's built-in names at plan time and kept as a plain
alternation too; it has no drift check, since a missing type only loses a
colour.

## 4. VS Code

`vscode/`, extension name `varyk`, display name "Varyk", publisher
`varyk` on the Visual Studio Marketplace and Open VSX:

- `package.json`: `contributes.languages` registers `varyk` for `.vr` with
  `language-configuration.json`; `contributes.grammars` points at
  `syntaxes/varyk.tmLanguage.json`; `contributes.configuration` has one
  setting, `varyk.path` (default `"varyk"`), the command that starts the
  server. `engines.vscode` is `^1.91.0`, what `vscode-languageclient` 10
  needs; no `activationEvents`, since VS Code activates an extension for
  the languages it contributes. `capabilities.untrustedWorkspaces` is
  `{ "supported": "limited", "description": … }`: VS Code disables an
  extension marked `false` whole in a folder it does not trust, grammar
  included, so this one stays on there and highlights, but starts no
  server until the folder is trusted; neither a `varyk.path` set by the
  folder's own settings nor the checker's `cargo metadata` runs in an
  untrusted folder.
- `language-configuration.json`: `//` line comments; brackets `{}`, `[]`,
  `()`; auto-closing and surrounding pairs for those and `"`; indent on
  `{` and outdent on `}`.
- `extension.js`, CommonJS, no TypeScript: on activation in a trusted
  folder (in an untrusted one, on `onDidGrantWorkspaceTrust`), runs
  `<varyk.path> lsp --help`, which fails on a `varyk` without the command
  (older than 0.9.0, server §10) and, unlike comparing `--version`, passes
  on a local build of the compiler before its release; when it fails,
  shows one information message ("Varyk diagnostics need
  varyk 0.9 or later on your PATH, or set varyk.path") and stops; else
  starts `<varyk.path> lsp` with `vscode-languageclient` over stdio for
  `{ scheme: "file", language: "varyk" }`; when `varyk.path` changes, it
  stops any running server and does all this again. The server options leave `transport` unset, which
  is stdio already: setting `TransportKind.stdio` makes the client append
  `--stdio`, which `varyk lsp` refuses.
- `syntaxes/varyk.tmLanguage.json` is a committed copy of
  `../textmate/varyk.tmLanguage.json`, so the `vscode/` folder works as
  checked out, which JetBrains needs (section 6); CI fails when the two
  differ (section 7), so there is still one source.
- `vscode-languageclient` 10 is the one runtime dependency; `vsce
  package` includes it from `node_modules` and leaves dev dependencies
  out, so there is no bundler. `package-lock.json` is committed and
  keeps the version it was made with, since release-please does not bump
  it and neither `npm ci` nor vsce reads the version there;
  `.vscodeignore` keeps tests and sources of the repository out of the
  package.
- `README.md` (the Marketplace page) and an icon, committed; and
  `CHANGELOG.md` and the two license texts in one `LICENSE` file (the
  name vsce looks for), which the `vscode:prepublish` script copies from
  the root and `vsce package` runs first.

Not included: snippets, commands, tasks, a debugger, themes, a status bar
item.

## 5. Zed

`zed/`, extension id `varyk`, name "Varyk":

- `extension.toml`: `id`, `name`, `version`, `schema_version`, `authors`,
  `description`, `repository`; `[grammars.varyk]` with the
  `tree-sitter-varyk` repository and the commit of its latest release tag
  (tree-sitter §6), as a full SHA; `[language_servers.varyk]` with `name = "Varyk"` and
  `languages = ["Varyk"]`.
- `languages/varyk/config.toml`: `name = "Varyk"`, `grammar = "varyk"`,
  `path_suffixes = ["vr"]`, `line_comments = ["// "]`, `tab_size = 4`,
  `brackets` for `{}`, `[]`, `()`, and `""` (no auto-close inside strings
  and comments, `not_in = ["string", "comment"]`, which needs the
  `overrides.scm` below).
- `languages/varyk/highlights.scm`: tree-sitter's `queries/highlights.scm`
  (tree-sitter §3) at the pinned commit, with any capture Zed names
  differently renamed, copied again whenever the pin moves;
  `brackets.scm`; `indents.scm` (indent inside `{}`, `()`, `[]`);
  `outline.scm` (`fn`, `struct`, `enum`, `impl`, `mod` with their names,
  for the outline panel and breadcrumbs); `overrides.scm` (the string and
  comment nodes captured as `@string` and `@comment`, the scopes `not_in`
  names).
- `Cargo.toml` and `src/lib.rs`: a `cdylib` on `zed_extension_api` 0.7
  whose
  `language_server_command` finds `varyk` with `worktree.which("varyk")`
  and returns it with the argument `lsp`; when `varyk` is not on the path
  it returns an error saying so, which Zed shows in its log, and
  highlighting is unaffected. The extension does not check the version:
  an old `varyk` fails on `lsp` with clap's own message, which Zed logs.
- `LICENSE-MIT` and `LICENSE-APACHE` copies in `zed/`: Zed's registry
  requires a license file at the root of the extension's directory, not
  only the repository's.

Tried locally with "zed: install dev extension" on `zed/`. Published by a
pull request to `zed-industries/extensions` that adds this repository as
a submodule (by its HTTPS URL) and an `extensions.toml` entry with
`path = "zed"` and the version, which must equal `extension.toml`'s at the
submodule's commit; later releases bump the submodule and the version the
same way. That pull request is opened by hand
for now (section 8).

## 6. JetBrains

No code. The TextMate Bundles plugin ships enabled in every JetBrains
IDE and reads a VS Code extension's folder: `contributes.languages`,
`contributes.grammars`, and the language configuration's comments,
brackets, pairs, and indentation rules. The README explains: Settings,
Editor, TextMate Bundles, add, and choose the `vscode/` folder of a
checkout. That gives highlighting, comments, and brackets; no
diagnostics, which need a JetBrains plugin on the IDE's LSP API, open to
every IntelliJ IDEA user since 2025.3 (section 10).

## 7. Testing and CI

`.github/workflows/ci.yml`, on every pull request and push to `main`:

- grammar tests: `vscode-tmgrammar-test` on `textmate/tests/*.vr`, files
  with inline scope assertions for each row of section 3's table, which
  also fail on invalid JSON or a regex that does not compile;
- `scripts/check-keywords.mjs` against a pinned copy of the keyword list
  (`textmate/keywords.txt`, the lexer's `KEYWORDS` as of the last sync):
  the four alternations of section 3 (control, other, `self crate
  super`, `true false`) together hold exactly those words;
- `vscode/syntaxes/varyk.tmLanguage.json` is byte for byte
  `textmate/varyk.tmLanguage.json`;
- VS Code: on Node 22, `npm ci` and `vsce package` succeed (`@vscode/vsce`
  and `vscode-tmgrammar-test` are dev dependencies of `vscode/`);
- Zed: `cargo build --target wasm32-wasip2` of `zed/` succeeds, and
  `cargo fmt --check` and `cargo clippy -- -D warnings` pass there.

`.github/workflows/commit-messages.yml` is `varyk-http`'s, copied.

`.github/workflows/drift.yml`, every night, on demand, and on every pull
request (not a required check):

- fetch `crates/varyk-syntax/src/lexer.rs` from `Varyk-Lang/varyk` at
  `main`, read the words of its `KEYWORDS` array, and fail when they differ
  from `textmate/keywords.txt`, naming the added and removed words.

The TextMate grammar has no parse to drift from: it matches words, not
structure, so its keyword list is the one thing the compiler can make
stale. A new literal or comment form would also need a grammar change;
the rule in the compiler's `AGENTS.md` (server §8) covers that, and the
Tree-sitter drift check (tree-sitter §5) catches it within a day.

Done when CI passes and, against a local build of `varyk` with `lsp`
(server §9), the VS Code extension run from `vscode/` and the Zed dev
extension each show a diagnostic and apply its quick fix, and a JetBrains
IDE given `vscode/` as a TextMate bundle highlights a `.vr` file.

## 8. Release

release-please, type `simple`, one component for the whole repository,
tags `vX.Y.Z`, `CHANGELOG.md` at the root, extra files
`vscode/package.json` (`json`, `$.version`) and `zed/extension.toml`
(`toml`, `$.version`),
starting at 0.1.0. The two extensions share a version, so a grammar change
releases both. The `tags` check from `varyk-http`'s release workflow fails
a run whose released version has no tag.

A release publishes the VS Code extension to the Marketplace and Open
VSX from one `.vsix`, in a `release` environment as `varyk-http` keeps its
crates.io token. The Marketplace takes no personal access token: Azure
DevOps retires global PATs on 2026-12-01, so the job signs in with a
federated Entra ID credential (`azure/login` over OIDC, `permissions:
id-token: write`) and runs `vsce publish --azure-credential`, and moves
to `vsce publish --oidc` (shipped in vsce 4.0.0 but hidden from its help)
once Microsoft's publishing docs cover the trusted-publishing policy it
needs. Open VSX takes
`ovsx publish --trusted-publishing`: the job's OIDC token is traded for a
short-lived one, for the trusted publisher registered on the `varyk`
namespace (this workflow in the `release` environment). 0.1.0 still
published with a stored `OVSX_PAT` secret. Both publish with
`--skip-duplicate`, so a run that failed after one registry had taken the
version can be rerun. vsce needs Node 22 or later. The Zed registry is updated by hand with a
pull request to `zed-industries/extensions`, until releases are frequent
enough to automate it.

The owner creates the `varyk` publisher on the Marketplace (its id
cannot change later) and the federated credential the job signs in with
(for the `release` environment), and adds that identity to the publisher
as a member that may publish (Contributor), without which the sign-in
works and the upload is refused;
signs the Open VSX publisher agreement, creates the `varyk`
namespace, and claims it with an issue on `EclipseFdn/open-vsx.org` (an
unclaimed namespace shows an "unverified" warning); registers the workflow
and the `release` environment as the namespace's trusted publisher; and
opens the first registry pull request for Zed.

## 9. Documentation elsewhere

- `Varyk-Lang/varyk`: README and `docs/language.md` (server §8).
- `Varyk-Lang/varyk.com`: `syntaxes/varyk.json` replaced by a copy of
  `textmate/varyk.tmLanguage.json` under the same name, and the lines of
  that repository's `AGENTS.md` and `README.md` that call it a minimal
  grammar saying where it now comes from.

## 10. Not in this version

A JetBrains plugin (with the server); Neovim and Helix setup; snippets,
commands, and tasks; automating the Zed registry pull request; semantic
highlighting from the server.

## 11. Decisions

- 2026-10-11: one repository for the TextMate grammar, the VS Code
  extension, and the Zed extension; JetBrains through TextMate bundles;
  one shared version through release-please; publishing to the
  Marketplace and Open VSX on release, the Zed registry by hand.
