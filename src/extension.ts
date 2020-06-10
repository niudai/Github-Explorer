'use strict';

import * as vscode from 'vscode';
import { MemFS } from './fileSystemProvider';
import { initGithubFS } from './githubFsProvider';
import { setContext } from './util/global';
import { login, loadKeyString, logout } from './loginService';
import { SettingEnum } from './const/ENUM';
import * as path from 'path'; 
import * as fs from 'fs';
import { showReleaseNote } from './release-notes';
import { createRepo } from './createRepo';

export function activate(context: vscode.ExtensionContext) {

    setContext(context);

    // show release note
    showReleaseNote();

    loadKeyString();
    const githubFs = new MemFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('github', githubFs, { isCaseSensitive: true }));

    context.subscriptions.push(vscode.commands.registerCommand('remote-github.login', _ => {
        login()
    }))

    context.subscriptions.push(vscode.commands.registerCommand('remote-github.logout', _ => {
        logout()
    }))

    context.subscriptions.push(vscode.commands.registerCommand('remote-github.init', _ => {
        initGithubFS(githubFs);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('remote-github.createRepo', _ => {
        createRepo();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('remote-github.mount', _ => {
        var mountPoint: string | undefined= vscode.workspace.getConfiguration('remote-github').get(SettingEnum.mountPoint);
        if (mountPoint && mountPoint.length > 0) {
            if(!fs.existsSync(path.join(mountPoint, 'github'))) {
                fs.mkdirSync(path.join(mountPoint, 'github'));
            };
            vscode.workspace.updateWorkspaceFolders(0, 0, {  uri: vscode.Uri.file(path.join(mountPoint, 'github')), name: 'Github' });
        } else {
            vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('github:/'), name: "Github" });
        }
    }));
}