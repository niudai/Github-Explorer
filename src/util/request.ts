import Axios, { AxiosResponse } from "axios";
import * as axios from "axios";
import { DefaultHeader } from "../const/HTTP";
import { Output } from "./logger";
import * as process from 'process';

export async function request(uri: string, config?: axios.AxiosRequestConfig): Promise<AxiosResponse<any>> {
    
    var resp: AxiosResponse<any>;
    try {
        if (!config) {
            config = {};
        }
        if (!config.headers) {
            config.headers = DefaultHeader();
        }
        resp = await axios.default(uri, config)    
    } catch (e) {
        Output(e.message);
        Output(`request to ${uri} failed because "${e.response.data.message}"`);
        throw(`request to ${uri} failed because "${e.response.data.message}"`);
        // return ;
    }

    return Promise.resolve(resp);
}