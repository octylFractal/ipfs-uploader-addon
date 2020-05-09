import {Readable} from "stream";
import IPFS, {Ipfs} from "ipfs";
import axios from "axios";
import path from "path";
import fs from "fs";
import * as os from "os";
import {promisify} from "util";
import chalk from "chalk";

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

function getRepoPath(): string {
    return process.env.IPFS_PATH || path.join(os.homedir(), '/.ipfs');
}

function getApiFile(): string {
    return path.join(getRepoPath(), 'api');
}

function isDaemonOn(): boolean {
    try {
        fs.readFileSync(getApiFile());
        return true;
    } catch (err) {
        return false;
    }
}

async function getIpfs(): Promise<{ ipfs: Ipfs; cleanup?: () => Promise<void> }> {
    if (isDaemonOn()) {
        console.log(chalk.green("Using running daemon for control"));
        const endpoint = await promisify(fs.readFile)(getApiFile(), {encoding: 'utf-8'});
        return {
            ipfs: (await import("ipfs-http-client")).default(endpoint)
        };
    }
    console.log(chalk.cyan("Using temporary daemon for control"));
    const node = await IPFS.create();
    return {
        ipfs: node,
        async cleanup(): Promise<void> {
            await node.stop();
        }
    };
}

async function doUpload(file: Readable, name: string): Promise<string> {
    const {ipfs: node, cleanup} = await getIpfs();
    try {
        console.log(`${chalk.green("IPFS initialized")}. Uploading file now...`);

        const result = await first(node.add({
            path: `/${name}`,
            content: file,
        }, {
            pin: false,
            preload: true,
        }));
        console.log(`Fetching ${chalk.blue(result.cid.toString())} from ` +
            `${chalk.blue(IPFS_CENTRAL_ACCESS)} to verify in-network...`);
        let retries = 5;
        let lastError: string | undefined;
        while (retries > 0) {
            const url = `${IPFS_CENTRAL_ACCESS}/ipfs/${result.cid.toString()}`;
            const response = await axios.get(url);
            if (response.status >= 400) {
                console.error(chalk.red(lastError = `Got erroneous status code: ${response.status}`));
                console.log(`Retrying... (${retries} left)`);
                retries--;
                continue;
            }
            console.log(chalk.green("Found it in-network."));
            return url;
        }
        throw new Error(`Ran out of retries; last error: ${lastError}`);
    } finally {
        if (cleanup) {
            console.log(chalk.cyan("Cleaning up IPFS..."));
            await cleanup();
        }
    }
}

export async function upload(file: Readable, name: string): Promise<string> {
    const url = await doUpload(file, name);

    const realUrl = `${url}?filename=${encodeURIComponent(name)}`;
    console.log(chalk.green("File available at ") + chalk.blue(realUrl));
    return realUrl;
}
