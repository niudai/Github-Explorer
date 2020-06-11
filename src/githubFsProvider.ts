/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


import * as vscode from 'vscode';
import { MemFS } from './fileSystemProvider';
import { GithubBlob, GithubCommit, GithubRef, GithubTree, Tree, GithubTag, GithubLimits, GithubRepo, GithubSearchRepo } from './type/github';
import { Output } from './util/logger';
import { request } from './util/request';
import { SettingEnum } from './const/ENUM';
import { join } from 'path';
import * as path from 'path';
import { fstat, writeSync } from 'fs';
import * as fs from 'fs';
import { isAuthenticated } from './loginService';
import { getGlobalState } from './util/global';

// used to cache user query history
var memoryRepoUrlList: string[] = [];

async function delay(ms: number) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}

export async function getLimits(): Promise<GithubLimits> {
    return (await request('https://api.github.com/rate_limit')).data;
}

export async function initGithubFS(memFs: MemFS) {
    if (!(await isAuthenticated())) {
        Output('Please Sign in first!', 'info');
        await vscode.commands.executeCommand('remote-github.login');
        return;
    } 

    var isPersist = false; // to indicate whether to store it persistently
    var tmpPath = 'github:/';
    var mountPoint: string | undefined= vscode.workspace.getConfiguration('remote-github').get(SettingEnum.mountPoint);

    if (mountPoint && mountPoint.length > 0) {
        isPersist = true;
        tmpPath = join(mountPoint, 'github');
    }

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
    
        let repoPathArray: string[] | undefined = repoPath.split('/');
        if (repoPathArray.length == 1) {
            // repoPathArray contains only username
            var repoList: GithubSearchRepo = (await request(`https://api.github.com/search/repositories?q=${repoPathArray[0]}`)).data;
            var searchPromise = vscode.window.showQuickPick<vscode.QuickPickItem & { item: GithubRepo}>(
                repoList.items.map(t => ({ label: t.name, picked: false, item: t, description: t.description })),
                { placeHolder: `${repoPathArray[0]}/`, ignoreFocusOut: true  }
            );

            const selectedItem = await searchPromise
            if (!selectedItem) return;
            repoPathArray = selectedItem.item?.full_name.split('/');
            repoPath = selectedItem.item.full_name;
        }
        // repoPathArray is like ['microsoft', 'vscode']
        repoPathArray?.forEach(p => {
            if (isPersist) {
                tmpPath = join(tmpPath, p);
                if (!fs.existsSync(tmpPath)) {
                    fs.mkdirSync(tmpPath, { recursive: true });
                } 
            } else {
                tmpPath = `${tmpPath}${p}/`;
                memFs.createDirectory(vscode.Uri.parse(tmpPath));
            }
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
    }, async (progress, token) => {
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
                { placeHolder: tmpPath, ignoreFocusOut: true  }
            );
            
            if (!selectedItem) return
            
            if (selectedItem.label == '.') {
                // remember opening path
                getGlobalState().update(repoPath, tree);
                break;
            } else if (selectedItem.label == '..') {
                if (isPersist) {
                    if (fs.existsSync(tmpPath)) {
                        fs.rmdirSync(tmpPath);
                    }
                } else {
                    memFs.delete(vscode.Uri.parse(tmpPath));
                }
                if (tree.parent) {
                    tree = tree.parent;
                    if (tmpPath.endsWith(path.sep)) {
                        tmpPath = tmpPath.slice(0, tmpPath.length-1);
                    }
                    tmpPath = tmpPath.slice(0, tmpPath.lastIndexOf(path.sep) + 1);        
                };
            } else if (selectedItem.item?.type == 'blob') {
                if (isPersist) {
                    tmpPath = join(tmpPath, selectedItem.item.path);
                } else {
                    tmpPath = `${tmpPath}${selectedItem.item.path}`;
                }
                request(selectedItem.item.url).then(r => {
                    let blob: GithubBlob = r.data;
                    let buf = Buffer.from(blob.content, 'base64');
                    if (isPersist) {
                        fs.writeFileSync(tmpPath, buf);
                    } else {
                        memFs.writeFile(vscode.Uri.parse(tmpPath), buf, { create: true, overwrite: true });
                    }
                })
                progress.report({
                    message: `Writing ${tmpPath}`
                })
                return;
            } else if (selectedItem.item?.type == 'tree') {
                if (isPersist) {
                    tmpPath = join(tmpPath, selectedItem.item.path);
                    if (!fs.existsSync(tmpPath)) {
                        fs.mkdirSync(tmpPath);
                    }
                } else {
                    tmpPath = `${tmpPath}${selectedItem.item.path}/`;
                    memFs.createDirectory(vscode.Uri.parse(tmpPath));
                }  // if tree, load tree again
                progress.report({
                    message: `Loading ${tmpPath} folder`,
                    increment: 1
                })
                var oldTree = tree;
                tree = (await request(selectedItem.item.url)).data;
                tree.parent = oldTree;
            }
        }

        var bigFolderNotif: boolean = false;
        var exceedMaxFolderNotif: boolean = false;
        var maxRequestTime: number | undefined= vscode.workspace.getConfiguration('remote-github').get(SettingEnum.maxRequestTimesPerOpen);
        var useSyncLoad: boolean | undefined = vscode.workspace.getConfiguration('remote-github').get(SettingEnum.useSyncLoad);

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
                        if (isPersist) {
                            fs.writeFileSync(join(rootPath, fname), buf);
                        } else {
                            memFs.writeFile(vscode.Uri.parse(`${rootPath}${fname}`), buf, { create: true, overwrite: true });
                        }
                    }).catch(async e => {
                        let limits = await getLimits();
                        if (limits.resources.core.limit == 0) {
                            Output(`It seems that your request times were used up. You could request after${limits.resources.core.reset}`);
                        } else {
                            Output(`It seems github has detected you are requesting resources too frequently...pls do it later.`);
                        }
                    })
                } else if (t.type == 'tree') {
                    let folderPath: string;
                    // if (rootPath == '' || !rootPath) {
                    //     folderPath = `${rootPath}${t.path}/`;
                    // } else {
                    // }
                    if (isPersist) {
                        folderPath = join(rootPath, t.path);
                        if (!fs.existsSync(folderPath)) {
                            fs.mkdirSync(folderPath);
                        }
                    } else {
                        folderPath = `${rootPath}${t.path}/`;
                        memFs.createDirectory(vscode.Uri.parse(folderPath));
                    }
                    if (useSyncLoad) {
                        let r = (await request(t.url)).data;
                        let tree: GithubTree = r;
                        await _writeTree(tree, folderPath);    
                    } else {
                        request(t.url).then(r => {
                            let tree: GithubTree = r.data;
                            _writeTree(tree, folderPath);
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
