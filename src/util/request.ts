import Axios, { AxiosResponse } from "axios";
import * as axios from "axios";
import { DefaultHeader } from "../const/HTTP";
import { Output } from "./logger";

export async function request(uri: string, method?: string, headers?: string): Promise<AxiosResponse<any>> {

    let resp: AxiosResponse<any>;
    try {
        resp = await axios.default.get(uri, {
            headers: DefaultHeader(),
        });
    } catch (e) {
        Output(`request to ${uri} failed because "${e.response.data.message}"`);
        throw new Error((`request to ${uri} failed because "${e.response.data.message}"`));
        // return ;
    }

    return Promise.resolve(resp);
}
