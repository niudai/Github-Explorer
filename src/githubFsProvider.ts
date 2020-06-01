/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable: max-line-length

import * as vscode from "vscode";
import { SettingEnum } from "./const/ENUM";
import { MemFS } from "./fileSystemProvider";
import { GithubBlob, GithubCommit, GithubLimits, GithubRef, GithubTag, GithubTree, Tree } from "./type/github";
import { Output } from "./util/logger";
import { request } from "./util/request";

// used to cache user query history
const memoryRepoUrlList: string[] = [];

async function delay(ms: number) {
    // return await for better async stack trace support in case of errors.
    return await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getLimits(): Promise<GithubLimits> {
    return (await request("https://api.github.com/rate_limit")).data;
}

// todo: change defaultHeader into defaultHeader()
export async function initGithubFS(memFs: MemFS) {

    const queryUrl: string | undefined = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt: "type in url like \"https://github.com/golang/go\" or just \"golang/go\". \n",
        value: memoryRepoUrlList[memoryRepoUrlList.length - 1],
    });
    if (!queryUrl) {
        return;
    }
    memoryRepoUrlList.push(queryUrl);

    const mainReg = /(https:\/\/github.com\/)?([^\s]+)/i;
    const branchReg = /-b[\s]+([^\s]+)/;
    const tagReg = /-t[\s]+([^\s]+)/;
    const matchArr = queryUrl.match(mainReg);
    let repoPath: string;
    let tmpPath = "github:/";
    let branch: string;
    let tag: string;
    if (matchArr && matchArr.length > 2) {
        // repoPath is like 'microsoft/vscode'
        repoPath = matchArr[2];

        { // polish queryUrl
            if (repoPath.endsWith(".git")) {
                repoPath = repoPath.slice(0, repoPath.length - 4);
            }
            if (repoPath.endsWith("/")) {
                repoPath = repoPath.slice(0, repoPath.length - 1);
            }
        }

        // repoPathArray is like ['microsoft', 'vscode']
        const repoPathArray = repoPath.split("/");
        repoPathArray.forEach((p) => {
            tmpPath = `${tmpPath}${p}/`;
            memFs.createDirectory(vscode.Uri.parse(tmpPath));
        });
        // branchArr is like ['-b master', 'mater', index: 14, input: 'microsoft/vscode -b master']
        {
            const branchArr = queryUrl.match(branchReg);
            const tagArr = queryUrl.match(tagReg);
            if (branchArr && branchArr.length > 1) {
                branch = branchArr[1];
            } else if (tagArr && tagArr.length > 1) {
                tag = tagArr[1];
            }
        }
    } else {
        Output("please type in valid repo path!", "warn");
    }

    let count = 0;
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Building Virtual FileSystem From Github...Just secs...",
    }, async () => {
        let repoUrl: string;
        if (branch) {
            repoUrl = `https://api.github.com/repos/${repoPath}/git/ref/heads/${branch}`;
        } else if (tag) {
            repoUrl = `https://api.github.com/repos/${repoPath}/git/ref/tags/${tag}`;
        } else {
            repoUrl = `https://api.github.com/repos/${repoPath}/git/ref/heads/master`;
        }
        if (!memFs) {
            memFs = new MemFS();
        }
        let ref: GithubRef;
        try {
            ref = (await request(repoUrl)).data;
        } catch (e) {
            Output(e, "error");
            return;
        }
        let commit: GithubCommit & GithubTag = (await request(ref.object.url)).data;
        let tree: GithubTree;
        if (commit.tree) {
            tree = (await request(commit.tree.url)).data;
        } else {
            commit = (await request(commit.object.url)).data;
            tree = (await request(commit.tree.url)).data;
        }

        // select sub folder:
        for (;;) {
            const selectedItem = await vscode.window.showQuickPick<vscode.QuickPickItem & { item?: Tree}>(
                [{ item: tree.tree[0], label: ".", picked: true }, {
                    item: tree.tree[0], label: "..", picked: false,
                }].concat(tree.tree.map((t) => ({ label: (t.type === "blob") ? `📄${t.path}` : `📂${t.path}`, picked: false, item: t }))),
                { placeHolder: tmpPath, ignoreFocusOut: true  },
            );

            if (!selectedItem) { return; }

            if (selectedItem.label === ".") {
                break;
            } else if (selectedItem.label === "..") {
                memFs.delete(vscode.Uri.parse(tmpPath));
                if (tree.parent) {
                    tree = tree.parent;
                    tmpPath = tmpPath.slice(0, tmpPath.length - 1);
                    tmpPath = tmpPath.slice(0, tmpPath.lastIndexOf("/") + 1);
                }
            } else if (selectedItem.item?.type === "blob") {
                tmpPath = `${tmpPath}${selectedItem.item.path}`;
                request(selectedItem.item.url).then((r) => {
                    const blob: GithubBlob = r.data;
                    const buf = Buffer.from(blob.content, "base64");
                    memFs.writeFile(vscode.Uri.parse(tmpPath), buf, { create: true, overwrite: true });
                });
                return;
            } else if (selectedItem.item?.type === "tree") {
                tmpPath = `${tmpPath}${selectedItem.item.path}/`;
                memFs.createDirectory(vscode.Uri.parse(tmpPath));
                    // if tree, load tree again
                const oldTree = tree;
                tree = (await request(selectedItem.item.url)).data;
                tree.parent = oldTree;
            }
        }

        let bigFolderNotif: boolean = false;
        let exceedMaxFolderNotif: boolean = false;
        const maxRequestTime: number | undefined = vscode.workspace.getConfiguration("remote-github").get(SettingEnum.maxRequestTimesPerOpen);
        const useSyncLoad: boolean | undefined = vscode.workspace.getConfiguration("remote-github").get(SettingEnum.useSyncLoad);

        async function _writeTree(githubTree: GithubTree, rootPath: string) {
            for (const t of githubTree.tree) {
                const fname = t.path;
                if (t.type === "blob") {
                    count++;
                    if (count > 300) {
                        if (!bigFolderNotif) {
                        // for escape from abuse detection
                            Output("You are trying to open a big folder, network & performance issue may occur.", "warn");
                            bigFolderNotif = true;
                        }
                        await delay(100);
                    }
                    if (maxRequestTime && count > maxRequestTime) {
                        if (!exceedMaxFolderNotif) {
                            exceedMaxFolderNotif = true;
                            Output("The folder exceeds the max request times, some files were not loaded for performance issue.", "warn");
                        }
                        throw new Error(("repo size exceeds the max limit"));
                    }
                    request(t.url).then((r) => {
                        const blob: GithubBlob = r.data;
                        const buf = Buffer.from(blob.content, "base64");
                        memFs.writeFile(vscode.Uri.parse(`${rootPath}${fname}`), buf, { create: true, overwrite: true });
                    }).catch(async (e) => {
                        const limits = await getLimits();
                        if (limits.resources.core.limit === 0) {
                            Output(`It seems that your request times were used up. You could request after${limits.resources.core.reset}`);
                        } else {
                            Output(`It seems github has detected you are requesting resources too frequently...pls do it later.`);
                        }
                    });
                } else if (t.type === "tree") {
                    let folderPath;
                    // if (rootPath == '' || !rootPath) {
                    //     folderPath = `${rootPath}${t.path}/`;
                    // } else {
                    folderPath = `${rootPath}${t.path}/`;
                    // }
                    memFs.createDirectory(vscode.Uri.parse(folderPath));
                    if (useSyncLoad) {
                        const r = (await request(t.url)).data;
                        const gtree: GithubTree = r;
                        await _writeTree(gtree, `${rootPath}${t.path}/`);
                    } else {
                        request(t.url).then((r) => {
                            const gtree: GithubTree = r.data;
                            _writeTree(gtree, `${rootPath}${t.path}/`);
                        });
                    }
                }
            }
            // _tree.tree.forEach(t => {
            //     let fname = t.path;
            //     if (t.type == 'blob') {
            //         count++;
            //         request(t.url).then(r => {
            //             let blob: GithubBlob = r.data;
            //             let buf = Buffer.from(blob.content, 'base64');
            //             memFs.writeFile(vscode.Uri.parse(`${rootPath}${fname}`), buf, { create: true, overwrite: true });
            //         })
            //     } else if (t.type == 'tree') {
            //         let folderPath;
            //         // if (rootPath == '' || !rootPath) {
            //         //     folderPath = `${rootPath}${t.path}/`;
            //         // } else {
            //         folderPath = `${rootPath}${t.path}/`;
            //         // }
            //         memFs.createDirectory(vscode.Uri.parse(folderPath))
            //         request(t.url).then(r => {
            //             let tree: GithubTree = r.data;
            //             _writeTree(tree, `${rootPath}${t.path}/`);
            //         })
            //     }
            // })
        }

        await _writeTree(tree, tmpPath);

        const limit = await getLimits();
        if (useSyncLoad) {
            Output(`You have ${limit.resources.core.remaining} times left to make request this hour.` +
            `This would refresh at ${new Date(limit.resources.core.reset * 1000).toTimeString()}`, "info",
            );
        }

        return;
    });
}
