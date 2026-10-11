# varyk-editors implementation plan

Spec: `docs/specs/2026-10-11-varyk-editors-design.md` ("editors §n"). Linked
specs: `Varyk-Lang/varyk` `docs/specs/2026-10-11-language-server-design.md`
("server §n") and `Varyk-Lang/tree-sitter-varyk`
`docs/specs/2026-10-11-tree-sitter-varyk-design.md` ("tree-sitter §n").

## Overview

This repository is empty but for its spec. The plan builds what editors §2
lists: one TextMate grammar for Varyk with inline-assertion tests and a
pinned keyword list; a VS Code extension (plain CommonJS, one runtime
dependency, no bundler) that highlights `.vr` files everywhere and starts
`varyk lsp` in trusted folders when the installed `varyk` has it; a Zed
extension on the Tree-sitter grammar with a few lines of Rust that starts
`varyk lsp`; JetBrains through the TextMate Bundles plugin reading `vscode/`;
CI, a nightly keyword drift check, the commit-message check, and a
release-please release that publishes the VS Code extension to the
Marketplace and Open VSX.

Highlighting never depends on the server, and nothing here validates Varyk:
the compiler is the authority on syntax, and the grammar only follows its
keyword list. The website's grammar (`varyk.com/syntaxes/varyk.json`) is
replaced by a copy of the new one in a separate pull request to `varyk.com`
(Task 9). A follow-up pull request here (Task 10) moves the Zed grammar pin
to tree-sitter-varyk's first release once it exists.

## Context

Line numbers are approximate.

- editors spec: decisions §1.1 (lines 21-35); repository layout and
  `AGENTS.md` rules §2 (37-56); grammar table and repository keys §3
  (58-93); VS Code §4 (95-145); Zed §5 (147-186); JetBrains §6 (188-197);
  CI, drift, definition of done §7 (199-235); release §8 (237-268); website
  §9 (270-276).
- server spec: the command and stdio-only protocol §2 (46-58); the
  grammars rule §8 (244-269); 0.9.0 as the first `varyk` with `lsp` §10
  (327-339). Not implemented yet: no `crates/varyk/src/lsp.rs` on the
  compiler's `editor-support` branch (`/Users/vlad/projects/varyk/varyk-editor-support`).
- tree-sitter spec: capture names §3 (91-110); repository and ABI 14 §4
  (112-135); release as tag only §6 (178-186). The repository
  (`/Users/vlad/projects/varyk/tree-sitter-varyk`, branch `editor-support`)
  holds only its spec and plan in one commit that is amended as reviews
  go, so no SHA is recorded here: Task 4 pins the head of that branch as
  pushed when Task 4 runs. No grammar, no release yet.
- Compiler keywords: `KEYWORDS` in
  `varyk-editor-support/crates/varyk-syntax/src/lexer.rs:12-39`, 26 words,
  exactly the four groups of editors §3 (control 10, other 11, `self crate
  super`, `true false`).
- Compiler built-in type names: `BUILTIN_TYPE_NAMES` in
  `varyk-editor-support/crates/varyk/src/types.rs:55-58` (`bool`,
  `i8`…`u64`, `usize`, `f32`, `f64`, `string`, `Option`, `Result`, `Vec`,
  `HashMap`, `Error`, `Shared`, `Time`, `Uuid`, `Bytes`); the §3 type row
  is that list plus `Task`, which the compiler resolves separately
  (`resolve/mod.rs:978`, `docs/language.md:297`), so the plan-time check
  of §3 passes with no change.
- `varyk-editor-support/docs/language.md`: comments and keywords
  (270-306), literals and escapes (619-633), operators and precedence
  (657-707), `{}` and doubled `{{ }}` in `println!`/`format!` (1179-1198),
  attributes `#[name]`/`#[name(value)]` (1625-1650).
- Conventions from `/Users/vlad/projects/varyk/varyk-http`: `AGENTS.md`
  (short rule list, commits, docs move with the code); `CONTRIBUTING.md`
  (build and test, commit prefix table 98-125, release and the `release`
  environment 127-132, licensing 134-141, bug reports 143-149);
  `.github/workflows/ci.yml`; `.github/workflows/commit-messages.yml`
  (1-48, copied verbatim); `.github/workflows/release-please.yml`
  (release-please job 12-21, `tags` job 23-44 with the `0.0.0` "nothing
  released yet" case, publish job in `environment: release` 46-66);
  `release-please-config.json` (`bump-minor-pre-major`,
  `include-component-in-tag: false`); `.release-please-manifest.json`;
  `LICENSE-MIT` (copyright "Vladislav Mickevic and Varyk contributors") and
  `LICENSE-APACHE`. varyk-http has no `TRADEMARKS.md`; the one to copy is
  the compiler's (`varyk-editor-support/TRADEMARKS.md`).
- Brand: `varyk.com/docs/brand/png/varyk-mark-256.png` (the default mark,
  rendered PNG; vsce refuses SVG icons); `docs/brand/README.md` says export,
  never redraw.
- Website: `varyk.com/syntaxes/varyk.json` (1-14, the minimal grammar);
  `config.toml:14-20` (`extra_grammars`, class output with the stylesheet
  unlinked, a comment calling it "the small Varyk grammar");
  `AGENTS.md:28` and `README.md:12` (the "minimal grammar" lines); gate
  `./scripts/build.sh` and `npx wrangler deploy --dry-run`.
- Versions current on 2026-10-11: `vscode-languageclient` 10.1.2
  (`engines.vscode` `^1.91.0`), `@vscode/vsce` 4.0.0 (Node 22+), `ovsx`
  1.2.0 (Node 22+), `vscode-tmgrammar-test` 0.1.3, `zed_extension_api`
  0.7.0.

## Development Approach

- **Testing posture.** The grammar is test-first: write the assertion file
  for a §3 row, see it fail, then add the pattern. `vscode-tmgrammar-test`
  is the only automated grammar test and also catches invalid JSON and
  regexes that do not compile. The two Node scripts are checked by running
  them against the real grammar and lexer and against a deliberately
  edited temporary copy (a word added and one removed) to see the failure
  message; no test framework. `extension.js` and the Zed Rust get no unit
  tests (the spec asks for none); they are covered by `vsce package`,
  `cargo build`/`clippy`, and the manual definition of done (Task 8).
- **Patterns to follow.** Workflows follow varyk-http's
  `.github/workflows/` (pinned major actions, `permissions: contents:
  read` by default, a `release` environment for publishing);
  `commit-messages.yml` and the `tags` job are copied, adjusted only where
  named. `AGENTS.md`/`CONTRIBUTING.md` follow varyk-http's shape and tone.
  The grammar's scope names are those of editors §3 exactly; Zed capture
  renames follow Zed's documented list (zed.dev/docs/extensions/languages).
- **The Tree-sitter pin.** tree-sitter-varyk has no release. Task 4 pins
  the full SHA of the head of its `editor-support` branch once that branch
  holds the grammar and `queries/highlights.scm` and is pushed (Zed fetches
  the commit from GitHub; until it is pushed, a local `file://`
  repository URL works for "zed: install dev extension" but is never
  committed). That pin is good only for development: tree-sitter-varyk's
  pull request is squash-merged, so the branch head never lands on `main`
  and may stop being fetchable once the branch is deleted. Task 10, a
  follow-up pull request after tree-sitter-varyk's first release, moves
  the pin to the full SHA of the commit its `v0.1.0` tag points at, with
  `highlights.scm` recopied; `AGENTS.md` records the rule, and the first
  Zed registry pull request waits for that. CI does not fetch the grammar,
  so this pull request does not block on the release; only Task 4's
  queries and the Zed part of Task 8 wait for the grammar to exist.
- **Shell-free.** `extension.js` runs `varyk` with `execFile`-style
  argument lists (no shell), never a string command; no `unwrap`/`expect`
  in the Zed Rust (the owner's rule).
- **Not needed.** No TypeScript, bundler, or test harness for the VS Code
  extension (§1.1, §4); no snippets, commands, tasks, themes, or status bar
  item (§4); no version check in Zed (§5); no drift check for the type list
  (§3); no JetBrains code (§6); no automation of the Zed registry pull
  request (§5, §8); no `version.txt` for release-please `simple`; no
  release-please `extra-files` entry for `zed/Cargo.toml` (Zed reads only
  `extension.toml`'s version, so the crate has no version field and
  `publish = false`).

## Tasks

### Task 1: Scaffold the repository

**Files:** Create `LICENSE-MIT`, `LICENSE-APACHE`, `TRADEMARKS.md`,
`AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `CHANGELOG.md`, `.gitignore`

- [ ] copy `LICENSE-MIT` and `LICENSE-APACHE` from varyk-http unchanged
- [ ] copy the compiler's `TRADEMARKS.md` unchanged
- [ ] write `AGENTS.md` following varyk-http's: what this is (editors §1, §2 layout); the rules of editors §2 (the compiler is the authority on syntax; the grammar's keywords are the lexer's `KEYWORDS` exactly and `textmate/keywords.txt` is updated with them; a grammar change comes with a pull request to `varyk.com` copying it; the gate is CI's `grammar`, `vscode`, and `zed` jobs, drift is not required); `vscode/syntaxes/` is a copy, edit `textmate/` and copy; the Zed grammar pin and `highlights.scm` move together, and the pin moves to tree-sitter-varyk's release commit once it has one; commits as in varyk-http's rule (prefixes, no `<`/`>`, no attribution lines); docs move with the code
- [ ] write `CONTRIBUTING.md` following varyk-http's: purpose and pre-1.0 note; a "Build and test" heading left for Task 7; "Where things are" per editors §2; the commit prefix table and the `<`/`>` rule; releases (one version for both extensions, tag `vX.Y.Z`, publish job in the `release` environment, Zed registry by hand); licensing paragraph pointing at `TRADEMARKS.md`; bug reports with the smallest `.vr` file and the editor and version
- [ ] write a `README.md` skeleton: one paragraph of what this is, the experimental notice, and per-editor headings filled in Task 7
- [ ] write `CHANGELOG.md` as a `# Changelog` heading only, so `vscode:prepublish` has a file to copy before release-please's first release writes it
- [ ] write `.gitignore` for `node_modules/`, `*.vsix`, `vscode/LICENSE`, `vscode/CHANGELOG.md` (prepublish copies), `zed/target/`, `zed/grammars/`, `zed/extension.wasm` (what a Zed dev install writes)

Gate: `git status --short` lists only these files, and each rule of editors §2's `AGENTS.md` paragraph is in `AGENTS.md`.

### Task 2: Write the TextMate grammar, its tests, and the keyword check

**Files:** Create `textmate/varyk.tmLanguage.json`, `textmate/tests/comments-strings.vr`, `textmate/tests/keywords.vr`, `textmate/tests/names.vr`, `textmate/tests/numbers-operators.vr`, `textmate/keywords.txt`, `scripts/check-keywords.mjs`

- [ ] write `textmate/keywords.txt`: the 26 words of `KEYWORDS` (lexer.rs:12-39), one per line, in the lexer's order
- [ ] write the test files first, each starting with the `// SYNTAX TEST "source.varyk"` header (the tool requires the comment token before it) and asserting every row of editors §3: comment; string with each escape `\n \t \\ \" \0`; `{}` and `{name}` as placeholders and `{{`/`}}` asserted as not a placeholder (negative assertion); `#[test]` and `#[rename("key")]` with the string inside still a string; `1_000`, `2.5`, and `0..n` where `0` is a number and `..` an operator; booleans; every control and other keyword; `self crate super`; `println!`; `add(` as a function and `Some(`/`Circle(` not; every type of the §3 type row; `Some None Ok Err`; a capitalised user type; `::`, `=>`, `->`, and the operators of language.md 657-707
- [ ] write `textmate/varyk.tmLanguage.json` with `name` `varyk`, `scopeName` `source.varyk`, `fileTypes` `["vr"]`, top-level `patterns` that include `repository` entries in the order of editors §3's table
- [ ] put the keywords in four `repository` entries as plain `\b(a|b|…)\b` alternations: `keywords-control`, `keywords-other`, `language-variables` (`self crate super`), `booleans` (`true false`)
- [ ] keep the type list as one plain alternation of the §3 type row: `BUILTIN_TYPE_NAMES` (types.rs:55-58) plus `Task`
- [ ] write `scripts/check-keywords.mjs` (Node, no dependencies): read the four entries' `match` alternations, fail when their words, taken together, are not exactly `textmate/keywords.txt` or a word appears twice, naming missing and extra words; resolve both files from the script's own location (`import.meta.url`), since Task 3's `check` runs it from `vscode/`
- [ ] check the script's failure by running it once with a temporarily edited `keywords.txt` (one word added, one removed), then restore it

Gate: `npx --yes vscode-tmgrammar-test@0.1.3 -g textmate/varyk.tmLanguage.json 'textmate/tests/*.vr' && node scripts/check-keywords.mjs`

### Task 3: Build the VS Code extension

**Files:** Create `vscode/package.json`, `vscode/package-lock.json`, `vscode/language-configuration.json`, `vscode/extension.js`, `vscode/syntaxes/varyk.tmLanguage.json`, `vscode/.vscodeignore`, `vscode/icon.png`, `vscode/README.md`

- [ ] write `package.json` per editors §4: `name` `varyk`, `displayName` `Varyk`, `publisher` `varyk`, `version` `0.0.0` (release-please's start), `license` `MIT OR Apache-2.0`, `repository`, `icon`, `main` `./extension.js`, `engines.vscode` `^1.91.0`, no `activationEvents`, `categories` `Programming Languages`
- [ ] add `contributes.languages` (`varyk`, `.vr`, alias `Varyk`, `language-configuration.json`), `contributes.grammars` (`source.varyk` at `./syntaxes/varyk.tmLanguage.json`), and `contributes.configuration` with the one setting `varyk.path` (default `"varyk"`, a description saying it is the command that starts the server)
- [ ] add `capabilities.untrustedWorkspaces` `{ "supported": "limited", "description": … }` saying highlighting works and diagnostics wait for trust
- [ ] add `dependencies` `vscode-languageclient` `^10.1.2`; `devDependencies` `@vscode/vsce` `^4.0.0`, `ovsx` `^1.2.0` (Task 6's publish, pinned by the lock file), `vscode-tmgrammar-test` `^0.1.3`; scripts `test:grammar` (the Task 2 grammar test run from `vscode/` against `../textmate/`), `check` (`cmp` of the grammar copy first, since run from `vscode/` the test tool also loads the grammar `package.json` contributes and that copy wins for `source.varyk`; then `test:grammar` and `node ../scripts/check-keywords.mjs`), and `vscode:prepublish` copying `../CHANGELOG.md` and concatenating `../LICENSE-MIT` and `../LICENSE-APACHE` into `LICENSE`
- [ ] run `npm install` once to create `package-lock.json` and commit it
- [ ] write `language-configuration.json` per §4: `//` line comment; brackets `{}` `[]` `()`; auto-closing and surrounding pairs for those and `"` (the quote `notIn` string and comment); `indentationRules` that indent after a line ending in `{` and outdent a line starting with `}`
- [ ] write `extension.js` (CommonJS) per §4: activation in a trusted folder, or on `onDidGrantWorkspaceTrust`; probe `<varyk.path> lsp --help` without a shell; on failure show the one information message of §4 and stop; else start a `LanguageClient` over stdio with `transport` unset and the document selector `{ scheme: "file", language: "varyk" }`; on a change to `varyk.path`, stop any client and, only if the folder is trusted, probe again (an untrusted folder's own settings must never run a command); `deactivate` stops the client
- [ ] copy `textmate/varyk.tmLanguage.json` to `vscode/syntaxes/` byte for byte
- [ ] copy `varyk.com/docs/brand/png/varyk-mark-256.png` to `vscode/icon.png`
- [ ] write `.vscodeignore` keeping out `*.vsix`, the lock file, tests, and anything not needed at run time
- [ ] write `vscode/README.md`, the Marketplace page: what it does, the `varyk` 0.9 requirement for diagnostics, the `varyk.path` setting, restricted mode behaviour, links to the repository and `TRADEMARKS.md` as absolute GitHub URLs (vsce rewrites relative links against the repository root, not `vscode/`)
- [ ] run `npx vsce package` (which runs `vscode:prepublish`; `vsce ls` does not) and list the `.vsix` with `unzip -l`: the license and changelog (vsce stores them as `extension/LICENSE.txt` and `extension/changelog.md`), the extension's files, and `vscode-languageclient`'s tree are in it, nothing else

Gate: `cd vscode && npm ci && npm run check && npx vsce package` (from a tree where `CHANGELOG.md` exists at the root; delete the `.vsix` afterwards)

### Task 4: Build the Zed extension

**Files:** Create `zed/extension.toml`, `zed/Cargo.toml`, `zed/Cargo.lock`, `zed/src/lib.rs`, `zed/languages/varyk/config.toml`, `zed/languages/varyk/highlights.scm`, `zed/languages/varyk/brackets.scm`, `zed/languages/varyk/indents.scm`, `zed/languages/varyk/outline.scm`, `zed/languages/varyk/overrides.scm`, `zed/LICENSE-MIT`, `zed/LICENSE-APACHE`

- [ ] confirm tree-sitter-varyk's `editor-support` branch holds `grammar.js`, the generated `src/`, and `queries/highlights.scm` and is pushed; record the full SHA of its head; until it does, write the rest and leave `[grammars.varyk]`, the `.scm` files, and the dev-install check waiting
- [ ] write `extension.toml` per editors §5: `id` `varyk`, `name` `Varyk`, `version` `0.0.0`, `schema_version` 1, `authors`, `description`, `repository`; `[grammars.varyk]` with the tree-sitter-varyk HTTPS URL and `rev` the recorded SHA; `[language_servers.varyk]` with `name = "Varyk"` and `languages = ["Varyk"]`
- [ ] write `Cargo.toml`: a `cdylib`, edition 2021, no version field, `publish = false`, dependency `zed_extension_api` `0.7`
- [ ] write `src/lib.rs` following the `zed::Extension` + `register_extension!` pattern: `language_server_command` returns `worktree.which("varyk")` with the argument `lsp` and the worktree's shell environment, or an error naming the missing `varyk` and the 0.9 requirement; no version check, no `unwrap`
- [ ] write `config.toml` per §5: name, grammar, `path_suffixes`, `line_comments`, `tab_size`, and `brackets` for `{}` `[]` `()` and `""` with `not_in = ["string", "comment"]`
- [ ] copy `queries/highlights.scm` from the pinned commit, renaming captures Zed names differently (`@variable.builtin` to `@variable.special`; keep names Zed resolves by prefix)
- [ ] write `brackets.scm`, `indents.scm` (indent inside `{}`, `()`, `[]`), `outline.scm` (`fn`, `struct`, `enum`, `impl`, `mod` with `@name`, `@context` on the keyword, `@item`), and `overrides.scm` (the string and comment nodes as `@string` and `@comment`), using the node names of the grammar at the pin
- [ ] copy the two license files into `zed/`
- [ ] run `cargo build` once to create `Cargo.lock` and commit it
- [ ] install with "zed: install dev extension" on `zed/`, open an example from the compiler's `examples/`, and check highlighting, the outline panel, comment toggling, and indentation (the server part waits for Task 8)

Gate: `cd zed && cargo fmt --check && cargo clippy --target wasm32-wasip2 -- -D warnings && cargo build --target wasm32-wasip2` (after `rustup target add wasm32-wasip2`, once)

### Task 5: Add CI, drift, and commit-message workflows

**Files:** Create `.github/workflows/ci.yml`, `.github/workflows/drift.yml`, `.github/workflows/commit-messages.yml`, `scripts/drift-keywords.mjs`

- [ ] write `ci.yml` (on pull requests and pushes to `main`, `contents: read`) with job `grammar` (Node 22, `npm ci` in `vscode/`, `npm run check`: grammar tests, keyword check, and the byte-for-byte copy check), job `vscode` (Node 22, `npm ci`, `npx vsce package`), and job `zed` (stable Rust with the `wasm32-wasip2` target, rustfmt, clippy; the Task 4 gate in `zed/`)
- [ ] write `scripts/drift-keywords.mjs` (Node, no dependencies): given a path to `lexer.rs`, read the quoted words of the `KEYWORDS` array, stopping at its closing bracket (`RESERVED_KEYWORDS` follows in the same shape), and fail when they differ from `textmate/keywords.txt`, naming added and removed words
- [ ] write `drift.yml` per editors §7: on a nightly schedule, `workflow_dispatch`, and pull requests; fetch `crates/varyk-syntax/src/lexer.rs` from `Varyk-Lang/varyk` at `main` over HTTPS and run the script on it; a comment saying it is not a required check and a red run means the compiler moved
- [ ] copy varyk-http's `commit-messages.yml` unchanged
- [ ] run the drift script against `varyk-editor-support/crates/varyk-syntax/src/lexer.rs` (passes) and against a copy with one keyword added (fails naming it)

Gate: `node scripts/drift-keywords.mjs ../varyk-editor-support/crates/varyk-syntax/src/lexer.rs` passes, `actionlint` passes on the workflows when installed, and the Task 3 and Task 4 gates still pass

### Task 6: Configure release-please and the release workflow

**Files:** Create `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release.yml`; Modify `CONTRIBUTING.md`

- [ ] write `release-please-config.json` following varyk-http's: `release-type` `simple`, one package `.`, `include-component-in-tag` false, `bump-minor-pre-major` true, `bump-patch-for-minor-pre-major` false, `extra-files` `vscode/package.json` (`json`, `$.version`) and `zed/extension.toml` (`toml`, `$.version`)
- [ ] write `.release-please-manifest.json` at `0.0.0`, so the first `feat:` releases 0.1.0 (editors §8)
- [ ] write `release.yml` copying varyk-http's `release-please` and `tags` jobs unchanged in substance
- [ ] add the `publish` job: runs when a release was created, `environment: release`, `permissions: contents: read, id-token: write`; Node 22; `npm ci` and `vsce package` in `vscode/` to one `.vsix`; `azure/login` over OIDC with client and tenant ids from the environment and no subscription (`allow-no-subscriptions: true`, without which the login fails); `vsce publish --azure-credential` with that `.vsix`; `ovsx publish` with the same `.vsix` and the `OVSX_PAT` secret; a comment on the move to `vsce publish --oidc` from editors §8
- [ ] add the manual Zed registry step and the owner's one-time setup of editors §8 (Marketplace publisher, federated credential for the `release` environment as a Contributor, Open VSX agreement, namespace and its claim, `OVSX_PAT`, ids as environment values) to `CONTRIBUTING.md`'s release section

Gate: `jq . release-please-config.json .release-please-manifest.json` succeeds, `actionlint` passes when installed, and `version` paths in the two extra files match the config

### Task 7: Write the README per editor and finish CONTRIBUTING

**Files:** Modify `README.md`, `CONTRIBUTING.md`

- [ ] fill `README.md`: VS Code (install from the Marketplace or Open VSX; what needs `varyk` 0.9 or later; `varyk.path`; restricted mode; run from a checkout with `npm ci` in `vscode/` then `code --extensionDevelopmentPath`), Zed (install from the extensions panel; dev install from `zed/`; diagnostics need `varyk` on the path, failures in Zed's log), JetBrains (Settings, Editor, TextMate Bundles, add the `vscode/` folder of a checkout; highlighting, comments, brackets; no diagnostics yet, editors §6), any other LSP editor runs `varyk lsp`; how the grammars stay current (editors §7, server §8); links to the specs, `CONTRIBUTING.md`, `TRADEMARKS.md`, licenses
- [ ] fill `CONTRIBUTING.md`'s "Build and test" with the gates of Tasks 2-5 as CI runs them, and the Node 22 and `wasm32-wasip2` prerequisites
- [ ] read every document against the finished tree (paths, job names, versions, setting name, message text)

Gate: `cd vscode && npx vsce package` still succeeds (vsce reads `vscode/README.md`), and every relative link in the two READMEs resolves

### Task 8: Check the definition of done by hand

**Files:** none (fix in the file at fault if a check fails)

- [ ] build `varyk` with `varyk lsp` from the compiler's `editor-support` branch (server §9) and put it first on `PATH`; until that branch has `lsp`, this task waits
- [ ] in a scratch directory, write a two-file single-file program: `main.vr` with `mod m;` calling a function of `m.vr` declared without `pub`
- [ ] VS Code with the extension run from `vscode/`: the diagnostic shows on open, its quick fix inserts `pub` in `m.vr`, saving clears it; an untrusted folder highlights and starts no server until trusted; `varyk.path` set to a `varyk` without `lsp` shows the one message; changing `varyk.path` back restarts the server
- [ ] Zed with the dev extension from `zed/`: the same diagnostic and quick fix; with `varyk` off the path, highlighting stays and the log names the missing command
- [ ] a JetBrains IDE given `vscode/` as a TextMate bundle highlights a `.vr` file, toggles `//` comments, and matches brackets
- [ ] CI is green on the pull request

Gate: every check above passes, and CI's `grammar`, `vscode`, and `zed` jobs are green

### Task 9: Replace the website's grammar (separate pull request in varyk.com)

**Files:** Modify `varyk.com/syntaxes/varyk.json`, `varyk.com/AGENTS.md`, `varyk.com/README.md`, `varyk.com/config.toml` (comment only)

- [ ] branch from varyk.com's `main` (not the branch checked out there now)
- [ ] replace `syntaxes/varyk.json` with a byte-for-byte copy of `textmate/varyk.tmLanguage.json` from varyk-editors, keeping the file name (editors §9)
- [ ] change the `AGENTS.md:28` and `README.md:12` lines to say the file is a copy of `textmate/varyk.tmLanguage.json` from `Varyk-Lang/varyk-editors`, refreshed by copying, never edited here
- [ ] change the `config.toml` comment that calls it "the small Varyk grammar" to match
- [ ] check a built page with a ` ```varyk ` block still carries `data-lang="varyk"`
- [ ] open it as its own pull request after the varyk-editors grammar is final, citing the source commit in the description

Gate: `./scripts/build.sh && npx wrangler deploy --dry-run` in varyk.com, and `grep -rl 'data-lang="varyk"' public/` finds the learn pages

### Task 10: Move the Zed pin to tree-sitter-varyk's release (follow-up pull request)

tree-sitter-varyk tagged `v0.1.0` before this repository's first pull request merged, so the pin moved in that pull request instead; the grammar and queries at the tag are those of the commit pinned before, so `highlights.scm` did not change.

**Files:** Modify `zed/extension.toml`, `zed/languages/varyk/highlights.scm`, and any of `brackets.scm`, `indents.scm`, `outline.scm`, `overrides.scm` whose node names changed

- [ ] wait until tree-sitter-varyk's pull request is squash-merged and release-please has tagged `v0.1.0`; this does not block the pull request of Tasks 1-8
- [ ] branch from varyk-editors' `main` and set `[grammars.varyk]` `rev` to the full SHA the `v0.1.0` tag points at (`git ls-remote` on the HTTPS URL, the peeled `^{}` entry if the tag is annotated)
- [ ] recopy `queries/highlights.scm` at that commit with Zed's capture renames, and check the other query files against the grammar's node names there
- [ ] reinstall the dev extension on `zed/` and repeat Task 4's highlighting, outline, comment, and indentation checks
- [ ] title it `fix:` so release-please releases it, and open the first Zed registry pull request (editors §5, §8) only from a varyk-editors release that carries this pin

Gate: the Task 4 gate passes, and `git ls-remote` of tree-sitter-varyk shows `v0.1.0` at the pinned SHA
