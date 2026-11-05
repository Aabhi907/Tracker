#!/bin/bash
# Cartoon-3D shorts (three.js inside Remotion) on a Mac with Apple Silicon (M1-M4). Also works on Linux.
# usage: bash setup.sh [project_dir]          default project_dir = ~/cartoon3d
# It installs the claude-animated-shorts skill to ~/.claude/skills/cartoon-3d-short, creates the Remotion project with the
# exact versions the bridge short was made with, copies the bridge source in as a working example, fixes the
# Windows-only paths, installs packages and type-checks. Safe to re-run (never overwrites your edits).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
PROJ="${1:-$HOME/cartoon3d}"
SKILL_DIR="${SKILL_DIR:-$HOME/.claude/skills/cartoon-3d-short}"
REPO=https://github.com/mromidev/claude-animated-shorts.git
MISSING=0
need(){ command -v "$1" >/dev/null || { echo "MISSING: $1   ->  $2"; MISSING=1; }; }
need git "xcode-select --install"
need node "brew install node   (Node 18 or newer)"
need ffmpeg "brew install ffmpeg"
need python3 "brew install python"
if [ $MISSING = 1 ]; then echo "Install the missing tools (Homebrew: https://brew.sh), then run this again."; exit 1; fi
[ "$(node -v | sed 's/v//' | cut -d. -f1)" -ge 18 ] || { echo "Node 18+ needed, you have $(node -v)"; exit 1; }
python3 -c "import numpy, scipy" 2>/dev/null || python3 -m pip install --user numpy scipy || echo "NOTE: install numpy + scipy for the sound scripts"

echo "1/4 skill -> $SKILL_DIR"
if [ ! -f "$SKILL_DIR/SKILL.md" ]; then mkdir -p "$(dirname "$SKILL_DIR")"; git clone --depth 1 "$REPO" "$SKILL_DIR"; fi

echo "2/4 project -> $PROJ"
mkdir -p "$PROJ"
cp -Rn "$HERE/project/." "$PROJ/" 2>/dev/null || true
mkdir -p "$PROJ/src/videos" "$PROJ/scripts" "$PROJ/audio" "$PROJ/voice" "$PROJ/public/bridge/kenney" "$PROJ/out"
[ -d "$PROJ/src/videos/bridge" ] || cp -R "$SKILL_DIR/templates/bridge" "$PROJ/src/videos/bridge"
for f in "$SKILL_DIR"/templates/scripts/*; do [ -e "$PROJ/scripts/$(basename "$f")" ] || cp "$f" "$PROJ/scripts/"; done
for f in "$SKILL_DIR"/templates/audio/*; do [ -e "$PROJ/audio/$(basename "$f")" ] || cp "$f" "$PROJ/audio/"; done
python3 "$HERE/patch_mac.py" "$PROJ"

echo "3/4 npm install (a few minutes the first time)"
cd "$PROJ" && npm install --no-audit --no-fund

echo "4/4 type-check"
npx tsc --noEmit -p . && echo "TYPECHECK OK"
n=$(ls public/bridge/kenney/*.glb 2>/dev/null | wc -l | tr -d ' ')
echo
echo "Done. Project: $PROJ   ($n Kenney models in public/bridge/kenney)"
echo "Next: see README_MAC.md (Kenney props, first stills, first render, making your own short with Claude Code)."
