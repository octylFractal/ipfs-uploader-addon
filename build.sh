#!/usr/bin/env bash

set -e

set -x

if [[ $ENV == dev* ]]; then
  tsc -w
else
  eslint 'src/**'
  tsc
fi
