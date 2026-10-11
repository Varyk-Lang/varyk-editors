# Varyk for Visual Studio Code

Support for [Varyk](https://varyk.com), a language for backend services
that compiles to Rust, in `.vr` files:

- highlighting, comment toggling, bracket matching, and indentation, in
  every folder;
- diagnostics and quick fixes from `varyk lsp`, the language server built
  into the compiler, in trusted folders.

Varyk is experimental and pre-1.0: anything here may change.

## Requirements

Highlighting needs nothing else. Diagnostics need `varyk` 0.9 or later:
when the extension starts, it runs `varyk lsp --help`, and when that
fails it shows one message ("Varyk diagnostics need varyk 0.9 or later on
your PATH, or set varyk.path") and leaves highlighting as it is.

The server checks a file's program when the file is opened and when it is
saved; unsaved edits are not checked.

## Settings

- `varyk.path` (default `varyk`): the command that starts the server, run
  as `<varyk.path> lsp`. Set it when `varyk` is not on your `PATH`.
  Changing it restarts the server.

## Restricted Mode

In a folder VS Code does not trust, the extension highlights as usual but
runs nothing: no server starts, and a `varyk.path` set by the folder's own
settings is never run. Diagnostics start once you trust the folder.

## Links

- Source, issues, and other editors:
  [Varyk-Lang/varyk-editors](https://github.com/Varyk-Lang/varyk-editors)
- The language: [varyk.com](https://varyk.com) and
  [Varyk-Lang/varyk](https://github.com/Varyk-Lang/varyk)
- Licensed under MIT or Apache-2.0, at your option. "Varyk" and its logo
  are trademarks; see
  [TRADEMARKS.md](https://github.com/Varyk-Lang/varyk-editors/blob/main/TRADEMARKS.md).
