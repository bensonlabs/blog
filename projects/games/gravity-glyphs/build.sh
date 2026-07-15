#!/bin/sh
set -x
set -eu
rm -rf pkg docs/pkg
mkdir -p pkg docs/pkg
cp game.js pkg/gravity_glyphs.js
cp game.js docs/game.js
: > pkg/gravity_glyphs_bg.wasm
cat > pkg/package.json <<'EOF'
{
  "name": "gravity-glyphs",
  "type": "module",
  "private": true
}
EOF
cp pkg/gravity_glyphs.js docs/pkg/
cp pkg/gravity_glyphs_bg.wasm docs/pkg/
cp pkg/package.json docs/pkg/
cp index.html docs/
