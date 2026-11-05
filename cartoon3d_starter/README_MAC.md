# Cartoon 3D shorts on your MacBook (M4 Pro)

The style: flat 2D cartoon characters standing in a real, colourful 3D world, with ink outlines, painted textures, lens
blur, gliding cameras and synthesized sound. It is all three.js rendered by Remotion, frame by frame, on your Mac's GPU.
The pipeline comes from github.com/mromidev/claude-animated-shorts (MIT), proven on their 67 s short "The Bridge That
Fell for a Song". This starter sets it up on macOS and fixes the parts that were Windows-only.

## 1. One-time setup (about 10 minutes)

1. Install the tools (Terminal):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"   # Homebrew, if you don't have it
   brew install node ffmpeg python git
   ```
2. Unzip this starter anywhere, then:
   ```bash
   bash cartoon3d_starter/setup.sh ~/cartoon3d
   ```
   It installs the skill to `~/.claude/skills/cartoon-3d-short`, creates the Remotion project in `~/cartoon3d` with the
   exact versions the bridge short used (Remotion 4.0.290, three 0.175, React Three Fiber 9.1.2, postprocessing 6.37.2),
   copies the bridge short in as a working example, installs everything and type-checks. It ends with `TYPECHECK OK`.
3. The free 3D props (Kenney, CC0 licence, free for any use):
   - Download the **Nature Kit** and the **Fantasy Town Kit** from https://kenney.nl/assets
   - From their `Models` folders (GLB format), copy these files into `~/cartoon3d/public/bridge/kenney/`:
     `tree_oak tree_default tree_detailed tree_fat tree_cone tree-high-round tree plant_bushLarge plant_bushDetailed
     plant_bush hedge flower_redA flower_yellowA flower_purpleA grass_large grass lily_large lantern cart stall-red
     stall-green stall-bench banner-red banner-green windmill canoe` (each as `<name>.glb`).
   - Any file that is missing is simply skipped (fewer trees and props, no crash).
   - If a kit only has `.gltf` files, convert one with `npx gltf-pipeline -i tree_oak.gltf -o tree_oak.glb`.
   - The sound timeline (`audio/timeline.py`) mirrors the bridge short's shots; for a new short Claude updates it with the picture.
4. Remotion writes a ~1.3 GB temp copy on every bundle and never deletes it. Point it at a folder you can clean:
   ```bash
   echo 'export REMOTION_TMP="$HOME/remotion-tmp"' >> ~/.zshrc && source ~/.zshrc
   ```
   Delete `~/remotion-tmp/remotion-webpack-bundle-*` now and then when nothing is rendering.

## 2. See the bridge short running

```bash
cd ~/cartoon3d
npm run studio                                   # live preview in the browser: scrub the timeline, see every shot
node scripts/bridge-stills.mjs out/bridge/x_ 60,560,1500 0.5   # 3 test stills at half size
npm run render                                   # full 1080x1920 MP4 (Metal GPU via ANGLE)
npm run render2k                                 # final 1440x2560 (2K), what the skill delivers
```
The bridge author measured ~4 frames/s for 2K renders on a PC GPU; an M4 Pro should be in the same range, so a 67 s
short (2025 frames) takes roughly 8-15 minutes. Stills take a few seconds each after a ~40 s bundle.

Sound (numpy synthesis, no samples): put the narration in `voice/voice.wav` with word timings in `voice/words.json`, then
`cd audio && python3 mix.py` (it builds the music and SFX itself, ducks the music under the voice, and writes `mix.wav`,
the stems and `cues.md`), then mux:
`ffmpeg -i out/bridge/video_2k.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k final.mp4`
(Remotion adds a silent audio track, hence the `-map`).

## 3. Make your own short with Claude Code (on the Mac)

1. Install Claude Code on the Mac (https://claude.com/claude-code), open Terminal in `~/cartoon3d`, run `claude`.
2. Say: **"Use the cartoon short skill and make a short about <your story>."**
3. The skill (`~/.claude/skills/cartoon-3d-short/SKILL.md`) walks through: facts → script (hook paradox, setting,
   escalation, "You see," + everyday analogy, ironic payoff; ~3.7 words/s) → your voice + word timings → shot plan in a
   copy of `src/videos/bridge/` → world, characters, camera → stills → render → sound → frame QA.
4. Everything new goes in `src/videos/<name>/` (copy of the bridge folder) and one more `<Composition>` in `src/Root.tsx`.

What each file does (so you can ask for precise changes):

| File | What it controls |
|---|---|
| `story.ts` | shots, timing to the words, camera keys (glides, push-ins, cuts, kicks), lens blur per shot, foreground props |
| `world.ts` / `build.ts` / `paint.ts` | the 3D set: sky, fog, water, buildings, props, painted textures |
| `lights.ts` / `shade.ts` | day and golden-hour light presets, two-tone shadows (blue-violet, never grey) |
| `toon.ts` / `cast.ts` / `cardshade.ts` | the 2D characters: drawing, faces, walks, blinks, crowds, how they take the scene light |
| `ink.ts` / `lensblur.ts` / `grade.ts` / `Bridge.tsx` | post: ink outlines, depth of field, bloom, colour grade, composer order |
| `scripts/short_qa.py` | frame-by-frame QA of the final MP4 (frozen holds, pops, black/white frames, loudness) |

## 4. Rules worth keeping (from the skill)
- Story, characters and voice are always your own. The reference frames in the skill are for studying the look only.
- Camera: smooth glides of 18-40 frames, a slow push-in on every hold, hard cuts for big jumps, flip kicks on impacts.
- Characters react 0-3 frames before the word. Blinks every 0.5-2.3 s.
- Lens blur on about a third of shots (close-ups), wides stay sharp. No film grain (it quadruples the file size).

## 5. KINA idea for later
The same three.js setup can render real 3D objects for KINA Dark (a glass cylinder that turns, molecules with true
depth of field, a phone flipping in 3D) as layers that drop into the KINA Dark engine.
