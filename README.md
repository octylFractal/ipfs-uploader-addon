ipfs-uploader-addon
===================

Essentially a pluggable uploader for IPFS.

This was designed to be the last step in a screenshot upload pipeline. The script I use is as follows:

```bash
#!/usr/bin/env bash

set -e

export NODE_VERSION=14

while true; do
inotifywait -m ~/Pictures/Screenshots | 
    while read dir action file; do
        if [[ $action == CLOSE_WRITE* ]]; then
            echo "Triggering uploader!"
            ~/.nvm/nvm-exec ipfs-uploader-addon --file "$dir/$file" || true
        fi
    done || true
    # In case of errors, sleep it off
    sleep 10
done
```
