import {Readable} from "stream";

export default function streamToBlob(stream: Readable, mimeType?: string): Promise<Blob>;
