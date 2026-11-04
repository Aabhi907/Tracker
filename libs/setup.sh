#!/bin/bash
# Re-creates the p5.brush install: clones the library (pinned commit), builds it, and installs the demo (p5 2.x + p5.brush).
# usage: ./setup.sh     then: cd brush_demo && node shot.cjs out.png
set -e
cd "$(dirname "$0")"
if [ ! -d p5.brush ]; then git clone https://github.com/acamposuribe/p5.brush.git; fi
(cd p5.brush && git checkout -q d56350a && npm install --ignore-scripts && npm run build)
(cd brush_demo && npm install --ignore-scripts)
echo "p5.brush ready"
