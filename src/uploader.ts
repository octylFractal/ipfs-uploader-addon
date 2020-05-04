import {Readable} from "stream";
import IPFS from "ipfs";
import axios from "axios";

const IPFS_CENTRAL_ACCESS = "https://ipfs.octyl.net";

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

async function doUpload(file: Readable, name: string): Promise<string> {
    const node = await IPFS.create();
    try {
        console.log("IPFS initialized. Uploading file now...");

        const result = await first(node.add({
            path: `/${name}`,
            content: file,
        }, {
            pin: false,
            preload: true,
        }));
        console.log(`Fetching ${result.cid.toString()} from ${IPFS_CENTRAL_ACCESS} to verify in-network...`);
        let retries = 5;
        let lastError: string | undefined;
        while (retries > 0) {
            const url = `${IPFS_CENTRAL_ACCESS}/ipfs/${result.cid.toString()}`;
            const response = await axios.get(url);
            if (response.status >= 400) {
                console.error(lastError = `Got erroneous status code: ${response.status}`);
                console.log(`Retrying... (${retries} left)`);
                retries--;
                continue;
            }
            console.log("Found it in-network.");
            return url;
        }
        throw new Error(`Ran out of retries; last error: ${lastError}`);
    } finally {
        await node.stop();
    }
}

export async function upload(file: Readable, name: string): Promise<string> {
    const url = await doUpload(file, name);

    const realUrl = `${url}?filename=${encodeURIComponent(name)}`;
    console.log(`Stopped IPFS node. File available at ${realUrl}`);
    return realUrl;
}
