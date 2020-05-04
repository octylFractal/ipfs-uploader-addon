declare module 'ipfs' {
    import {Readable} from "stream";
    import CID from "cids";

    export interface AddResult {
        path: string;
        cid: CID;
    }

    export type UnixTime = Date | { secs: number; nsecs?: number } | number[];

    export interface FileObject {
        path?: string;
        content?: Readable;
        mode?: number | string;
        mtime?: UnixTime;
    }

    export interface Ipfs {
        stop(): Promise<void>;

        add(data: FileObject, options?: {
            preload?: boolean;
        }): AsyncIterable<AddResult>;

        cat(ipfsPath: CID | string): AsyncIterable<Buffer>;
    }

    export function create(options?: {
        repo?: string;
    }): Promise<Ipfs>;
}
