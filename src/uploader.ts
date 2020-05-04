import {Readable} from "stream";
import IPFS from "ipfs";
import axios from "axios";

async function first<T>(iterable: AsyncIterable<T>): Promise<T> {
    let first: T | undefined;
    for await (const t of iterable) {
        if (typeof first !== "undefined") {
            break;
        }
        first = t;
    }
    if (typeof first !== "undefined") {
        return first;
    }
    throw new Error("Never saw first result");
}

export async function upload(file: Readable, name: string): Promise<string> {
    const node = await IPFS.create();

    console.log("IPFS initialized. Uploading file now...");

    const result = await first(node.add({
        path: `/${name}`,
        content: file,
    }, {
        preload: true,
    }));
    console.log(`Fetching ${result.cid.toString()} from IPFS central server to verify in-network...`);
    const url = `https://ipfs.io/ipfs/${result.cid.toString()}`;
    const response = await axios.get(url);
    if (response.status >= 400) {
        throw new Error(`Got erroneous status code: ${response.status}`);
    }
    console.log("Found it in-network.");

    await node.stop();

    const realUrl = `${url}?filename=${encodeURIComponent(name)}`;
    console.log(`Stopped IPFS node. File available at ${realUrl}`);
    return realUrl;
}
