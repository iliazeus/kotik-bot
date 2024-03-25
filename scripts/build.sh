#!/bin/sh

npx esbuild \
  --bundle --sourcemap=inline --minify --charset=utf8 \
  --platform=node --banner:js='#!/usr/bin/env node' \
  ./src/main.ts \
  --outfile=./dist/main.js

chmod a+x ./dist/main.js
