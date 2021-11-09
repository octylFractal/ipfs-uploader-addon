#!/usr/bin/env node
import yargs from "yargs";
import {upload} from "./uploader.js";
import * as fs from "fs";
import * as path from "path";
import clipboardy from "clipboardy";
import notifier from "node-notifier";
import {createShortLink} from "./shortlink.js";
import {hideBin} from "yargs/helpers";

const argsSpec = yargs(hideBin(process.argv))
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
    .version(false);

async function main(): Promise<void> {
    if (!process.env['DISPLAY']) {
        throw new Error("No DISPLAY variable set!");
    }
    const args = await argsSpec.parseAsync();
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
main().catch(err => {
    console.error(err);
    process.exit(1);
});
