declare module 'ipfs-http-client' {
    import {Ipfs} from "ipfs";

    type HttpIpfs = Ipfs;

    function HttpIpfs(endpoint: string): HttpIpfs;

    export = HttpIpfs;

}
