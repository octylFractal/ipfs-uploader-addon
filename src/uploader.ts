import {Readable} from "stream";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import chalk from "chalk";
import {IPFSClient} from "./ezipfs.js";

const IPFS_CENTRAL_ACCESS = "https://ipfs.octyl.net";

function getRepoPath(): string {
    return process.env['IPFS_PATH'] || path.join(os.homedir(), '/.ipfs');
}

function getApiFile(): string {
    return path.join(getRepoPath(), 'api');
}

async function isDaemonOn(): Promise<boolean> {
    try {
        await fs.readFile(getApiFile());
        return true;
    } catch (err) {
        return false;
    }
}

async function getIpfs(): Promise<IPFSClient> {
    if (!await isDaemonOn()) {
        console.error(chalk.red("No daemon detected. ipfs-uploader-addon does not currently support starting a daemon."));
        console.error(chalk.red("Please start a daemon and try again."));
        process.exit(1);
    } else {
        console.log(chalk.green("Using running daemon for control"));
        const endpoint = await fs.readFile(getApiFile(), {encoding: 'utf-8'});
        return new IPFSClient(endpoint);
    }
}

async function doUpload(file: Readable, name: string): Promise<string> {
    const node = await getIpfs();
    console.log(`${chalk.green("IPFS initialized")}. Uploading file now...`);

    const hash = await node.add(file, name);
    console.log(`Fetching ${chalk.blue(hash)} from ` +
        `${chalk.blue(IPFS_CENTRAL_ACCESS)} to verify in-network...`);
    let retries = 5;
    let lastError: string | undefined;
    while (retries > 0) {
        const url = `${IPFS_CENTRAL_ACCESS}/ipfs/${hash}`;
        const res = await fetch(url);
        if (!res.ok) {
            console.error(chalk.red(lastError = `Got erroneous status code: ${res.status} (${res.statusText})`));
            console.log(`Retrying... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
            continue;
        }
        console.log(chalk.green("Found it in-network."));
        return url;
    }
    throw new Error(`Ran out of retries; last error: ${lastError}`);
}

export async function upload(file: Readable, name: string): Promise<string> {
    const url = await doUpload(file, name);

    const realUrl = `${url}?filename=${encodeURIComponent(name)}`;
    console.log(chalk.green("File available at ") + chalk.blue(realUrl));
    return realUrl;
}
