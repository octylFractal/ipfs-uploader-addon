import {apikey} from "./secrets/yourls.js";
import {default as fetch, Headers} from "node-fetch";
import {stringify} from "querystring";

type YourlsResponse = {
    shorturl: string;
};

export async function createShortLink(url: string): Promise<string> {
    const response = await fetch(
        `https://url.octyl.net/yourls-api.php?${stringify({
            signature: apikey,
            action: 'shorturl',
            url,
            format: 'json'
        })}`,
        {
            method: 'POST',
            headers: new Headers({'content-type': 'application/x-www-form-urlencoded'}),
        }
    );
    if (!response.ok) {
        throw new Error("Failed to create short link: " + (await response.text()));
    }
    return ((await response.json()) as YourlsResponse).shorturl;
}
