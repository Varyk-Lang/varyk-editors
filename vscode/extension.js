"use strict";

// Highlighting comes from the grammar this extension contributes and works
// everywhere. This file only starts `varyk lsp`, and only in a trusted
// folder: `varyk.path` may come from the folder's own settings.

const { execFile } = require("child_process");
const vscode = require("vscode");
const { LanguageClient } = require("vscode-languageclient/node");

let client;
// Starts and stops run one after another, so a quick change of `varyk.path`
// never leaves two servers running.
let queue = Promise.resolve();

function varykPath() {
  return vscode.workspace.getConfiguration("varyk").get("path", "varyk");
}

// The first workspace folder: the probe and the server both run there, so a
// relative `varyk.path` names the same file for both.
function folderPath() {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.scheme === "file" ? folder.uri.fsPath : undefined;
}

// True when `<varyk.path> lsp --help` succeeds: false for a `varyk` older
// than 0.9.0, true for a local build before its release. No shell.
function hasLsp(command, cwd) {
  return new Promise((resolve) => {
    execFile(command, ["lsp", "--help"], { cwd }, (error) => resolve(!error));
  });
}

async function start() {
  const command = varykPath();
  const cwd = folderPath();
  if (!(await hasLsp(command, cwd))) {
    vscode.window.showInformationMessage(
      "Varyk diagnostics need varyk 0.9 or later on your PATH, or set varyk.path",
    );
    return;
  }
  // `transport` stays unset: that is stdio already, and setting it would
  // append `--stdio`, which `varyk lsp` refuses.
  client = new LanguageClient(
    "varyk",
    "Varyk",
    { command, args: ["lsp"], options: { cwd } },
    { documentSelector: [{ scheme: "file", language: "varyk" }] },
  );
  await client.start();
}

async function stop() {
  const running = client;
  client = undefined;
  if (running) {
    await running.stop();
  }
}

function enqueue(step) {
  queue = queue.then(step).catch((error) => {
    console.error("varyk:", error);
  });
  return queue;
}

function activate(context) {
  if (vscode.workspace.isTrusted) {
    enqueue(start);
  } else {
    context.subscriptions.push(
      vscode.workspace.onDidGrantWorkspaceTrust(() => enqueue(start)),
    );
  }
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("varyk.path")) {
        return;
      }
      enqueue(stop);
      // An untrusted folder's settings must never run a command.
      if (vscode.workspace.isTrusted) {
        enqueue(start);
      }
    }),
  );
}

function deactivate() {
  return enqueue(stop);
}

module.exports = { activate, deactivate };
