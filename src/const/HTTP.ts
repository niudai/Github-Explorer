import { getKeyString } from "../loginService";

export function DefaultHeader() {
    return {
        Authorization: getKeyString(),
    };
}
