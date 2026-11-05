#!/usr/bin/env python3
"""Fix the Windows-only bits of the claude-animated-shorts templates so they run on macOS (and Linux).
usage: python3 patch_mac.py <project_dir>"""
import sys, pathlib
P = pathlib.Path(sys.argv[1])
f = P / 'scripts' / 'bridge-stills.mjs'
s = f.read_text()
s = s.replace('const browserExecutable = "C:/Program Files/Google/Chrome/Application/chrome.exe";',
              'const browserExecutable = process.env.CHROME || null; // null = the headless Chrome Remotion downloads itself')
s = s.replace('const chromiumOptions = { gl: "angle" };',
              'const chromiumOptions = { gl: process.env.GL || "angle" }; // angle = Metal on Apple Silicon; GL=swangle without a GPU')
s = s.replace('const composition = await selectComposition({ serveUrl, id: "BridgeShort",',
              'const composition = await selectComposition({ serveUrl, id: process.env.COMP || "BridgeShort",')
f.write_text(s)
print('patched', f)
# EffectComposer's types want an element for every child: switched-off effects return an empty fragment, not null
b = P / 'src' / 'videos' / 'bridge' / 'Bridge.tsx'
if b.exists():
    t = b.read_text(); n = 0
    lines = t.split('\n')
    for i, l in enumerate(lines):
        if '<primitive object={fx.' in l and ': null}' in l:
            lines[i] = l.replace(': null}', ': <></>}'); n += 1
    b.write_text('\n'.join(lines)); print('patched', b, n, 'composer children')
