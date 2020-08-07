declare module 'ipfs' {
    import {Readable} from "stream";
    import CID from "cids";

    export type UnixTime = Date | { secs: number; nsecs?: number } | number[];

    export interface FileObject {
        path?: string;
        content?: Readable;
        mode?: number | string;
        mtime?: UnixTime;
    }

    export interface UnixFSEntry {
        path: string;
        cid: CID;
        // There are more, didn't include as we don't use them
    }

    export interface Ipfs {
        stop(): Promise<void>;

        add(data: FileObject, options?: {
            pin?: boolean;
            preload?: boolean;
        }): UnixFSEntry;

        cat(ipfsPath: CID | string): AsyncIterable<Buffer>;
    }

    export function create(options?: {
        repo?: string;
    }): Promise<Ipfs>;
}
