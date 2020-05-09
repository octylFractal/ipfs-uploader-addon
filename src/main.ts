#!/usr/bin/env node
import yargs from "yargs";
import {upload} from "./uploader";
import fs from "fs";
import path from "path";
import clipboardy from "clipboardy";
import notifier from "node-notifier";
import {createShortLink} from "./shortlink";

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
    .option('short-link', {
        alias: 's',
        description: 'Shorten the link in the clipboard',
        boolean: true,
        default: true,
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
    const finalUrl = args["short-link"] ? await createShortLink(uploadUrl) : uploadUrl;
    await clipboardy.write(finalUrl);
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
