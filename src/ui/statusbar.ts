import { StatusBarAlignment, StatusBarItem, window } from "vscode";
import { getUserProfile } from "../loginService";
export class StatusbarUi {

    private static get statusbar() {
        if (!StatusbarUi._statusBarItem) {
            StatusbarUi._statusBarItem = window
                .createStatusBarItem(StatusBarAlignment.Right, 200);
            this.statusbar.show();
            // Show status bar only if user wants :)
        }

        return StatusbarUi._statusBarItem;
    }

    public static Init() {
        StatusbarUi.Working("loading...");
        setTimeout(() => {
            StatusbarUi.Online();
        }, 1200);
    }

    public static Working(workingMsg: string = "Working on it...") {
        StatusbarUi.statusbar.text = `$(sync) ${workingMsg}`;
        StatusbarUi.statusbar.tooltip = "In case if it takes long time, try to close all browser window.";
        StatusbarUi.statusbar.command = undefined;
    }

    public static async Online() {
        StatusbarUi.statusbar.text = `$(github) ${(await getUserProfile()).login}`;
        StatusbarUi.statusbar.command = "github.logout";
        StatusbarUi.statusbar.tooltip = "Click signout";
    }

    public static Offline() {
        StatusbarUi.statusbar.text = `$(github) Sign in`;
        StatusbarUi.statusbar.command = "github.login";
        StatusbarUi.statusbar.tooltip = "Click to sign in.";
    }

    public static dispose() {
        StatusbarUi.statusbar.dispose();
    }

    // tslint:disable-next-line: variable-name
    private static _statusBarItem: StatusBarItem;
}
