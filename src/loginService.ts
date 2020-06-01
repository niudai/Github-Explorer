import Axios from "axios";
import * as fs from "fs";
import { join } from "path";
import * as vscode from "vscode";
import { SettingEnum } from "./const/ENUM";
import { DefaultHeader } from "./const/HTTP";
import { GithubProfile } from "./type/github";
import { StatusbarUi } from "./ui/statusbar";
import { getExtensionPath } from "./util/global";
import { Output } from "./util/logger";
import { request } from "./util/request";

let Keystring: string;

let keystorePath: string;
let keystoreDir: string;

// todo: load keystring from persistent
export function getKeyString() {
    return Keystring ? Keystring : "";
}

export async function loadKeyString() {
    // tslint:disable-next-line: max-line-length
    const userKeystorePath: string | undefined = vscode.workspace.getConfiguration("remote-github").get(SettingEnum.keystorePath);
    keystorePath = join(getExtensionPath(), "vault/keystore.json");
    keystoreDir = join(getExtensionPath(), "vault");
    if (!userKeystorePath || userKeystorePath.length === 0) {
        Keystring = fs.readFileSync(keystorePath, { encoding: "utf8"});
    } else {
        Keystring = `Basic ${new Buffer(fs.readFileSync(userKeystorePath)).toString("base64")}`;
    }
    if (await isAuthenticated()) {
        StatusbarUi.Online();
    } else {
        StatusbarUi.Offline();
    }
}

// todo: logout()
export async function login() {
    if (await isAuthenticated()) {
        Output(`you have already logged in as ${(await getUserProfile()).login}`, "info");
        return;
    }
    // todo: create uncreated folder
    if (!fs.existsSync(join(getExtensionPath(), "/vault"))) {
        fs.mkdirSync(keystoreDir);
    }
    if (!fs.existsSync(keystorePath)) {
        fs.writeFileSync(keystorePath, "");
    }
    const username: string | undefined = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "",
        prompt: "type in your github username:",
    });

    if (!username) { return; }

    const password: string | undefined = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        password: true,
        placeHolder: "",
        prompt: "type in your password or security token:",
    });

    StatusbarUi.Working("Loging in...");

    if (!password) { return; }

    const keystring = `${username}:${password}`;

    if (!keystring) { return; }
    Keystring = `Basic ${new Buffer(keystring).toString("base64")}`;
    fs.writeFileSync(keystorePath, Keystring);
    // todo: persist keystring
    let resp;
    try {
        resp = (await request("https://api.github.com/user")).data;
    } catch (e) {
        Output(e.message, "error");
    }
    if (resp && resp.login) {
        Output(`welcome, ${resp.login}`, "info");
        StatusbarUi.Online();
    }

}

export async function logout() {
    Keystring = "";
    if (!keystorePath) {
        throw new Error("keystore path not initialized!");
    }
    fs.writeFileSync(keystorePath, "");
    Output("You have signed out.", "info");
    StatusbarUi.Offline();
}

export async function isAuthenticated(): Promise<boolean> {
    let resp;
    try {
        resp = (await Axios.get("https://api.github.com/user", { headers: DefaultHeader()})).data;
    } catch (e) {
        // Output(e.message, 'error')
        return Promise.resolve(false);
    }
    if (resp && resp.login) {
        return Promise.resolve(true);
    }
    return  Promise.resolve(false);
}

export async function getUserProfile(): Promise<GithubProfile> {
    let resp: GithubProfile;
    try {
        resp = (await Axios.get("https://api.github.com/user", { headers: DefaultHeader()})).data;
    } catch (e) {
        Output(e.message, "error");
        throw new Error(("please sign in to get profile!"));
    }
    if (!resp || !resp.login) {
        throw new Error(("please sign in to get profile!"));
    }
    return Promise.resolve(resp);
}
