#!/usr/bin/env bash

set -e

set -x

cp -r src/secrets build

if [[ $ENV == dev* ]]; then
  tsc -w
else
  eslint 'src/**'
  tsc --incremental --tsBuildInfoFile build/.tsbuildinfo
  chmod +x build/main.js
fi
