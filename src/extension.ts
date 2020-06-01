"use strict";

import * as vscode from "vscode";
import { MemFS } from "./fileSystemProvider";
import { initGithubFS } from "./githubFsProvider";
import { loadKeyString, login, logout } from "./loginService";
import { setContext } from "./util/global";

export function activate(context: vscode.ExtensionContext) {

    setContext(context);
    loadKeyString();
    const githubFs = new MemFS();
    // tslint:disable-next-line: max-line-length
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider("github", githubFs, { isCaseSensitive: true }));

    context.subscriptions.push(vscode.commands.registerCommand("remote-github.login", (_) => {
        login();
    }));

    context.subscriptions.push(vscode.commands.registerCommand("remote-github.logout", (_) => {
        logout();
    }));

    context.subscriptions.push(vscode.commands.registerCommand("remote-github.init", (_) => {
        initGithubFS(githubFs);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("remote-github.mount", (_) => {
        vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse("github:/"), name: "Github" });
    }));
}
