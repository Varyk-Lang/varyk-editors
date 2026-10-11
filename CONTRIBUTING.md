# Contributing

varyk-editors holds the TextMate grammar for Varyk and the VS Code and
Zed extensions built on it and on the Tree-sitter grammar. Varyk is
experimental and pre-1.0: anything may change, and a new feature or a
breaking change bumps the minor version. Contributions are welcome;
small, focused pull requests are the easiest to review. The project has
one maintainer, so reviews are best effort and a pull request may wait a
while; a reminder after two weeks is welcome.

The design is in [`docs/specs/`](docs/specs/). A change to what the
extensions offer starts as an issue, here or in Varyk's
[Discussions](https://github.com/Varyk-Lang/varyk/discussions).

## Build and test

You need Node 22 or later (vsce and ovsx require it) and Rust from
rustup with the `wasm32-wasip2` target (`rustup target add
wasm32-wasip2`, once). These are CI's three required jobs, run from the
root of a checkout:

```sh
# grammar: the copy in vscode/syntaxes/ matches textmate/, the grammar
# tests in textmate/tests/ pass, and the keywords are textmate/keywords.txt
(cd vscode && npm ci && npm run check)

# vscode: the extension packages (needs CHANGELOG.md at the root)
(cd vscode && npx vsce package && rm varyk-*.vsix)

# zed
(cd zed && cargo fmt --check \
  && cargo clippy --target wasm32-wasip2 -- -D warnings \
  && cargo build --target wasm32-wasip2)
```

The `Drift` workflow, not a required check, compares
`textmate/keywords.txt` with the compiler's lexer; run it against a
checkout of the compiler with
`node scripts/drift-keywords.mjs ../varyk/crates/varyk-syntax/src/lexer.rs`.

A grammar change edits `textmate/varyk.tmLanguage.json`, adds an
assertion to `textmate/tests/`, and copies the grammar to
`vscode/syntaxes/varyk.tmLanguage.json`.

## Where things are

- `textmate/varyk.tmLanguage.json` is the TextMate grammar, used by the
  VS Code extension, by JetBrains through the `vscode/` folder, and,
  copied, by the website. `textmate/tests/` holds its tests, `.vr` files
  with inline scope assertions; `textmate/keywords.txt` is the
  compiler's keyword list as of the last sync.
- `vscode/` is the VS Code extension: `package.json`,
  `language-configuration.json`, `extension.js` (which starts
  `varyk lsp`), and `syntaxes/varyk.tmLanguage.json`, a committed copy of
  the grammar.
- `zed/` is the Zed extension: `extension.toml` (with the pinned
  tree-sitter-varyk commit), `src/lib.rs` (which starts `varyk lsp`), and
  the queries in `languages/varyk/`.
- `scripts/` holds the keyword checks: `check-keywords.mjs` compares the
  grammar with `textmate/keywords.txt`, and `drift-keywords.mjs` compares
  `textmate/keywords.txt` with the compiler's lexer.
- `.github/workflows/` holds CI (`ci.yml`), the keyword drift check
  (`drift.yml`), the commit-message check, and the release
  (`release.yml`, with `release-please-config.json` and
  `.release-please-manifest.json` at the root).
- `docs/specs/` holds the design and `docs/plans/` the plans it was built
  from.

## Commit messages and releases

Releases are cut by
[release-please](https://github.com/googleapis/release-please) from the
commit history on `main`, so every commit that lands on `main` carries a
conventional prefix. A pull request with one concern is squash-merged
with a conventional title; a pull request with several concerns is
rebase-merged with one conventional commit per concern.

| Prefix | Use it for | Effect on the release |
|---|---|---|
| `feat:` | a new capability | bumps the version, listed in the changelog |
| `fix:` | a bug fix | bumps the version, listed in the changelog |
| `docs:` | documentation only | no bump, not listed |
| `test:` | tests only | no bump, not listed |
| `ci:` | workflows and release automation | no bump, not listed |
| `chore:` | maintenance, dependencies, manifests | no bump, not listed |
| `refactor:` | code change with no behavior change | no bump, not listed |

A `!` after the prefix (`feat!:`) marks a breaking change. Before 1.0,
`feat` and a breaking change bump the minor version and `fix` bumps the
patch version.

Keep `<` and `>` out of commit subjects and `BREAKING CHANGE:` footers:
write `Option of T`, not `Option<T>`. release-please copies them into
the release pull request and reads that body as HTML, where an unclosed
`<T>` hides what follows it. The `Commit messages` check enforces this
on every pull request.

The VS Code and Zed extensions share one version, so a grammar change
releases both. release-please opens a release pull request on `main`
with the version bump and `CHANGELOG.md`. Merging that pull request is
the release decision: it creates the tag `vX.Y.Z` and the GitHub
release, and the `publish` job of `.github/workflows/release.yml` then
packages one `.vsix` and uploads it to the Visual Studio Marketplace and
Open VSX with no further approval. The publishing credentials belong to
the `release` environment, which only workflow runs from protected
branches (`main`) may use. The `tags` job fails a run whose released
version has no tag.

The Marketplace takes no personal access token: the job signs in to
Microsoft Entra ID with a federated credential (`azure/login` over OIDC)
and runs `vsce publish --azure-credential`. It moves to
`vsce publish --oidc` once Microsoft's publishing docs cover the
trusted-publishing policy that needs. Open VSX takes `ovsx publish` with
the `OVSX_PAT` secret. Both publish with `--skip-duplicate`, so a run that
failed after one registry had taken the version can be rerun.

The Zed registry is updated by hand after each release: a pull request
to `zed-industries/extensions` that bumps the `varyk-editors` submodule
to the release commit and sets the `varyk` entry's `version` in
`extensions.toml` to the version in `zed/extension.toml` at that commit.
The first such pull request adds the submodule by its HTTPS URL and an
entry with `path = "zed"`, and waits for a release whose
`zed/extension.toml` pins tree-sitter-varyk's release commit.

### One-time setup

The owner does these once, before the first release:

- create the `release` environment and limit it to protected branches
  (`main`), so no other branch can use its credentials;
- create the `varyk` publisher on the Visual Studio Marketplace (its
  id cannot change later);
- create an Entra ID app registration with a federated credential for
  this repository's `release` environment, add that identity to the
  `varyk` publisher as a Contributor (without it the sign-in works
  and the upload is refused), and set the `release` environment's
  variables `AZURE_CLIENT_ID` and `AZURE_TENANT_ID` to its ids;
- sign the Open VSX publisher agreement, create the `varyk`
  namespace, and claim it with an issue on `EclipseFdn/open-vsx.org` (an
  unclaimed namespace shows an "unverified" warning);
- add an Open VSX access token as the `release` environment's secret
  `OVSX_PAT`;
- open the first Zed registry pull request, as above.

## Licensing of contributions

Unless you explicitly state otherwise, any contribution intentionally
submitted for inclusion in varyk-editors by you, as defined in the
Apache-2.0 license, shall be dual licensed under MIT or Apache-2.0,
without any additional terms or conditions. The name "Varyk" and its
logo are trademarks and are not covered by those licenses; see
[TRADEMARKS.md](TRADEMARKS.md).

## Reporting bugs

Open an issue with the smallest `.vr` file that shows the problem, the
editor and its version, the extension's version, and what you saw. For
security problems, see the security policy shared by every Varyk-Lang
repository:
<https://github.com/Varyk-Lang/varyk-editors/security/policy>.
