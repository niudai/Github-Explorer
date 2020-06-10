import * as vscode from "vscode";
import { request } from "./util/request";
import { Output } from "./util/logger";
import { GithubRepo } from "./type/github";
import { isAuthenticated } from "./loginService";

enum RepoType {
    private = "private",
    public = "public"
}

export async function createRepo() {
    if (!(await isAuthenticated())) {
        Output('Please Sign in first!', 'info');
        await vscode.commands.executeCommand('remote-github.login');
        return;
    }
    const repoName: string | undefined = (await vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt: "Please Type in Repository Name:",
        placeHolder: "",
    }))?.trim();

    if (!repoName) return;

    const description: string | undefined = (await vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt: "Please Type in Repository Description:",
        placeHolder: "",
    }))?.trim();

    const repoType: string | undefined = (await vscode.window.showQuickPick<vscode.QuickPickItem>(
        [ 
            {
                label: RepoType.public,
                picked: true
            }, 
            {
                label: RepoType.private
            }
        ], 
        {
            ignoreFocusOut: true,
            placeHolder: "create public or private repo:",

        }))?.label;
    if (!repoType) return;

    var postResp: GithubRepo;
    postResp = (await request('https://api.github.com/user/repos', {
        method: "POST",
        data: {
            "name": repoName,
            "description": description,
            "homepage": "https://github.com",
            "private": repoType != RepoType.public,
            "has_issues": true,
            "has_projects": true,
            "has_wiki": true
        }
    })).data;    

    if (postResp) {
        vscode.window.showInformationMessage(`Repo ${postResp?.full_name} is created!`, { modal: true },
        "see it"
        ).then(async (r) => {
            let folders: vscode.WorkspaceFolder[] | undefined= vscode.workspace.workspaceFolders;
            let folderToSync: vscode.WorkspaceFolder | undefined;
            if (folders && folders.length > 1) {
                folderToSync = (await vscode.window.showQuickPick<vscode.QuickPickItem & { folder: vscode.WorkspaceFolder }>(
                    folders.map(f => ({ label: f.name, folder: f })), {
                        ignoreFocusOut: true,
                        placeHolder: 'pick folder to sync'
                    }
                ))?.folder;    
            } else {
                folderToSync = folders? folders[0] : undefined;
            }
            if (!folderToSync) return;
            let terminal = vscode.window.createTerminal('Remote-Github');
            terminal.sendText(`git init`);
            terminal.sendText(`git remote add origin ${postResp.html_url}`);
            terminal.sendText(`git push -u origin master`);
            terminal.show();
            r ? vscode.env.openExternal(vscode.Uri.parse(postResp.html_url)) : undefined
        });
    }

}