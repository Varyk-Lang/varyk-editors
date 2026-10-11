//! The Zed extension for Varyk: it starts `varyk lsp` for `.vr` files.

use zed_extension_api::{self as zed, LanguageServerId, Result, Worktree};

struct VarykExtension;

impl zed::Extension for VarykExtension {
    fn new() -> Self {
        VarykExtension
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        worktree: &Worktree,
    ) -> Result<zed::Command> {
        let Some(command) = worktree.which("varyk") else {
            return Err(
                "`varyk` is not on the path; diagnostics need varyk 0.9 or later installed"
                    .to_string(),
            );
        };
        Ok(zed::Command {
            command,
            args: vec!["lsp".to_string()],
            env: worktree.shell_env(),
        })
    }
}

zed::register_extension!(VarykExtension);
