/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


import * as vscode from 'vscode';
import { MemFS } from './fileSystemProvider';
import { GithubBlob, GithubCommit, GithubRef, GithubTree, Tree, GithubTag, GithubLimits } from './type/github';
import { Output } from './util/logger';
import { request } from './util/request';
import { SettingEnum } from './const/ENUM';

// used to cache user query history
var memoryRepoUrlList: string[] = [];

async function delay(ms: number) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}

export async function getLimits(): Promise<GithubLimits> {
    return (await request('https://api.github.com/rate_limit')).data;
}

// todo: change defaultHeader into defaultHeader()
export async function initGithubFS(memFs: MemFS) {

    var queryUrl: string | undefined = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt: "type in url like \"https://github.com/golang/go\" or just \"golang/go\". \n",
        value: memoryRepoUrlList[memoryRepoUrlList.length-1],
    });
    if (!queryUrl) {
        return
    };
    memoryRepoUrlList.push(queryUrl);

    const mainReg = /(https:\/\/github.com\/)?([^\s]+)/i;
    const branchReg = /-b[\s]+([^\s]+)/;
    const tagReg = /-t[\s]+([^\s]+)/;
    var matchArr;
    var repoPath: string;
    var tmpPath = 'github:/';
    var branch: string;
    var tag: string;
    if ((matchArr = queryUrl.match(mainReg)) && matchArr.length > 2) {
        // repoPath is like 'microsoft/vscode'
        repoPath = matchArr[2];

        { // polish queryUrl
            if(repoPath.endsWith('.git')) {
                repoPath = repoPath.slice(0, repoPath.length-4);
            }
            if (repoPath.endsWith('/')) {
                repoPath = repoPath.slice(0, repoPath.length-1);
            }    
        }
    
        // repoPathArray is like ['microsoft', 'vscode']
        let repoPathArray = repoPath.split('/');
        repoPathArray.forEach(p => {
            tmpPath = `${tmpPath}${p}/`;
            memFs.createDirectory(vscode.Uri.parse(tmpPath));
        })
        // branchArr is like ['-b master', 'mater', index: 14, input: 'microsoft/vscode -b master']
        {
            let branchArr;
            let tagArr
            if ((branchArr = queryUrl.match(branchReg)) && branchArr.length > 1) {
                branch = branchArr[1];
            } else if ((tagArr = queryUrl.match(tagReg)) && tagArr.length > 1) {
                tag = tagArr[1];
            }
        }
    } else {
        Output('please type in valid repo path!', 'warn');
    }

    var count = 0;
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Building Virtual FileSystem From Github...Just secs...'
    }, async () => {
        var repoUrl: string;
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
        var ref: GithubRef;
        try {
            ref = (await request(repoUrl)).data;
        } catch (e) {
            Output(e, 'error')
            return;
        }
        var commit: GithubCommit & GithubTag = (await request(ref.object.url)).data;
        var tree: GithubTree;
        if (commit.tree) {
            tree = (await request(commit.tree.url)).data;
        } else {
            commit = (await request(commit.object.url)).data;
            tree = (await request(commit.tree.url)).data;
        }

        // select sub folder:
        for (;;) {
            const selectedItem = await vscode.window.showQuickPick<vscode.QuickPickItem & { item?: Tree}>(
                [{ label: '.', picked: true , item: tree.tree[0] }, {
                    label: '..', picked: false, item: tree.tree[0]
                }].concat(tree.tree.map(t => ({ label: (t.type == 'blob') ? `📄${t.path}` : `📂${t.path}`, picked: false, item: t }))),
                { placeHolder: tmpPath,ignoreFocusOut: true  }
            );
            
            if (!selectedItem) return
            
            if (selectedItem.label == '.') {
                break;
            } else if (selectedItem.label == '..') {
                memFs.delete(vscode.Uri.parse(tmpPath));
                if (tree.parent) {
                    tree = tree.parent;
                    tmpPath = tmpPath.slice(0, tmpPath.length-1);
                    tmpPath = tmpPath.slice(0, tmpPath.lastIndexOf('/') + 1);    
                };
            } else if (selectedItem.item?.type == 'blob') {
                tmpPath = `${tmpPath}${selectedItem.item.path}`;
                request(selectedItem.item.url).then(r => {
                    let blob: GithubBlob = r.data;
                    let buf = Buffer.from(blob.content, 'base64');
                    memFs.writeFile(vscode.Uri.parse(tmpPath), buf, { create: true, overwrite: true });
                })
                return;
            } else if (selectedItem.item?.type == 'tree') {
                tmpPath = `${tmpPath}${selectedItem.item.path}/`;
                memFs.createDirectory(vscode.Uri.parse(tmpPath));
                    // if tree, load tree again
                var oldTree = tree;
                tree = (await request(selectedItem.item.url)).data;
                tree.parent = oldTree;
            }
        }

        var bigFolderNotif: boolean = false;
        var exceedMaxFolderNotif: boolean = false;
        var maxRequestTime: number | undefined= vscode.workspace.getConfiguration('github-explorer').get(SettingEnum.maxRequestTimesPerOpen);
        var useSyncLoad: boolean | undefined = vscode.workspace.getConfiguration('github-explorer').get(SettingEnum.useSyncLoad);

        async function _writeTree(_tree: GithubTree, rootPath: string) {
            for (let t of _tree.tree) {
                let fname = t.path;
                if (t.type == 'blob') {
                    count++;
                    if (count > 300) { 
                        if (!bigFolderNotif) {
                        // for escape from abuse detection
                            Output('You are trying to open a big folder, network & performance issue may occur.', 'warn')
                            bigFolderNotif = true;
                        }
                        await delay(100);
                    }
                    if (maxRequestTime && count > maxRequestTime) {
                        if (!exceedMaxFolderNotif) {
                            exceedMaxFolderNotif = true;
                            Output('The folder exceeds the max request times, some files were not loaded for performance issue.', 'warn')    
                        }
                        throw('repo size exceeds the max limit');
                    }
                    request(t.url).then(r => {
                        let blob: GithubBlob = r.data;
                        let buf = Buffer.from(blob.content, 'base64');
                        memFs.writeFile(vscode.Uri.parse(`${rootPath}${fname}`), buf, { create: true, overwrite: true });
                    }).catch(async e => {
                        let limits = await getLimits();
                        if (limits.resources.core.limit == 0) {
                            Output(`It seems that your request times were used up. You could request after${limits.resources.core.reset}`);
                        } else {
                            Output(`It seems github has detected you are requesting resources too frequently...pls do it later.`);
                        }
                    })
                } else if (t.type == 'tree') {
                    let folderPath;
                    // if (rootPath == '' || !rootPath) {
                    //     folderPath = `${rootPath}${t.path}/`;
                    // } else {
                    folderPath = `${rootPath}${t.path}/`;
                    // }
                    memFs.createDirectory(vscode.Uri.parse(folderPath));
                    if (useSyncLoad) {
                        let r = (await request(t.url)).data;
                        let tree: GithubTree = r;
                        await _writeTree(tree, `${rootPath}${t.path}/`);    
                    } else {
                        request(t.url).then(r => {
                            let tree: GithubTree = r.data;
                            _writeTree(tree, `${rootPath}${t.path}/`);
                        })    
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

        let limit = await getLimits();
        if (useSyncLoad) {
            Output(`You have ${limit.resources.core.remaining} times left to make request this hour.` + 
            `This would refresh at ${new Date(limit.resources.core.reset*1000).toTimeString()}`, 'info'
            )    
        }

        return;
    })
}