#!/usr/bin/env node
import yargs from "yargs";
import {upload} from "./uploader";
import fs from "fs";
import path from "path";
import clipboardy from "clipboardy";
import notifier from "node-notifier";

const args = yargs
    .option('file', {
        alias: 'f',
        description: 'The file to upload. Use `-` for STDIN.',
        requiresArg: true,
        demandOption: true,
        string: true,
    })
    .option('filename', {
        alias: 'n',
        description: 'The name of the file, inferred from --file if not STDIN',
        requiresArg: true,
        string: true,
    })
    .version(false)
    .parse();

async function main(): Promise<void> {
    const file = args.file;
    let filename = args.filename;
    if (!filename) {
        if (file === '-') {
            throw new Error("Need a file name for stdin");
        }
        filename = path.basename(file);
    }
    const stream = file === '-' ? process.stdin : fs.createReadStream(file);
    const uploadUrl = await upload(stream, filename);
    await clipboardy.write(uploadUrl);
    notifier.notify({
        title: "IPFS File Uploaded",
        message: `Uploaded ${filename} to the IPFS network! Copied the URL to the clipboard.`,
    });
}

process.on('unhandledRejection', (error) => {
    const stack = (error as Error)?.stack || '';
    if (stack.indexOf('read ECONNRESET') >= 0) {
        // spurious IPFS error
        return;
    }
    console.log('=== UNHANDLED REJECTION ===');
    console.dir(stack);
});
main().catch(err => console.error(err));
