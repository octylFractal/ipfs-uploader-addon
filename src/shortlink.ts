import {apikey} from "./secrets/yourls.js";
import axios from "axios";
import {checkAxiosError} from "./util.js";
import * as qs from "qs";

type YourlsResponse = {
    shorturl: string;
};

export async function createShortLink(url: string): Promise<string> {
    try {
        const response = await axios.post(
            `https://url.octyl.net/yourls-api.php?signature=${apikey}&action=shorturl`,
            qs.stringify({
                url,
                format: 'json'
            }),
            {
                headers: {'content-type': 'application/x-www-form-urlencoded'},
            }
        );
        return (response.data as YourlsResponse).shorturl;
    } catch (e) {
        checkAxiosError(e);
        throw new Error("Failed to create short link: " + JSON.stringify(e.response.data));
    }
}
