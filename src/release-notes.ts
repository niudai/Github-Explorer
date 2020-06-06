
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ReleaseNotesPath } from "./const/PATH";
import { getExtensionPath, getGlobalState } from "./util/global";

export function showReleaseNote() {
	let fileNames: string[] = fs.readdirSync(path.join(getExtensionPath(), ReleaseNotesPath))
	let mdFileReg = /^(\d)\.(\d)\.(\d)\.md$/;
	let latestVer = fileNames.filter(name => mdFileReg.test(name)).reduce((prev, curr, index, arr) => {
		return curr > prev ? curr : prev;
	});
	let usrLatestVer: string | undefined = getGlobalState().get('remote-github.currentVersion');
	if (!usrLatestVer || usrLatestVer < latestVer) {
		vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(path.join(
			getExtensionPath(), ReleaseNotesPath, latestVer
		)), null, {
			sideBySide: false,
			locked: true
		});
		getGlobalState().update('remote-github.currentVersion', latestVer);
	}
}

