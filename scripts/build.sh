#!/bin/sh

rm -rf dist
$(npm bin)/tsc -p tsconfig.json
cp README.md dist
$(npm bin)/copy-package-file dist devDependencies scripts
