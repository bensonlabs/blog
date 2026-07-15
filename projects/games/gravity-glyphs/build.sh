#!/bin/sh
set -x
rm -rf docs/pkg || true
wasm-pack build --release --target web
mkdir -p docs/pkg
cp -r pkg/* docs/pkg
cp index.html docs/