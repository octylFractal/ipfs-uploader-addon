/*
 * An IPFS client that uses the IPFS daemon to upload files.
 *
 * This is here instead of kubo-rpc-client because that library is completely broken in TypeScript right now.
 */
import {default as fetch, FormData} from "node-fetch";
import {Readable} from "stream";
import {default as streamToBlob} from "stream-to-blob";

export class IPFSClient {
    private readonly node: URL;
    constructor(endpoint: string) {
        // Endpoint comes as /<ip4|ip6>/<ip>/tcp/<port>
        const parts = endpoint.split('/');
        if (parts.length !== 5) {
            throw new Error(`Invalid endpoint: ${endpoint}`);
        }
        if (parts[0] !== '' || parts[1] !== 'ip4' || parts[3] !== 'tcp') {
            throw new Error(`Invalid endpoint: ${endpoint}`);
        }
        this.node = new URL(`http://${parts[2]}:${parts[4]}`);
    }

    /**
     * Add a file (unpinned) to IPFS.
     *
     * @param content the content to add
     * @param name the name of the file
     * @return the hash of the file
     */
    async add(content: Readable, name: string): Promise<string> {
        const params = new FormData();
        params.set('file', await streamToBlob(content), name);
        const result = await fetch(`${this.node}api/v0/add?pin=false`, {
            method: 'POST',
            body: params,
        });
        if (!result.ok) {
            throw new Error(`Failed to upload file: ${result.statusText}`);
        }
        return ((await result.json()) as { Hash: string }).Hash;
    }
}
