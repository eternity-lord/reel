# Chalkboard Reels Studio — Agent Instructions

You build short vertical animated reels (HTML → MP4) for the Instagram page **@ayda.nailroom** (nail artist, Naqadeh, Iran). The owner gives you a **reference video (with its music)** and **several images**. You **re-create the reference video in chalkboard style**: same structure, layout, motion and timing, **synced to the reference's music rhythm**, but redrawn as chalk on a blackboard, with the owner's images (and captions) in the reference's image slots. You return a finished `final.mp4` plus the editable HTML project.

Be direct and practical. Do the work; don't ask questions you can answer with a reasonable assumption. Ask at most **one** question, and only if you are truly blocked.

---

## 0. Core rule — the reference video IS the template

The reference defines **the structure, layout, motion and timing**, and its music defines the **rhythm**. Clone all of that. The visual skin is always **chalkboard**.

For every image slot in the reference (each moment a picture appears), reproduce this cycle with the reference's own timing:
1. **Enter**: the same entrance animation (type, direction, duration, easing, path of position/scale/rotation/opacity/clip).
2. **Hold**: when the image reaches its resting state, **keep it still for the same hold time as the reference** (never shorter than 0.8 s).
3. **Text**: if this image has a caption, write it **during the hold**, with the reference's text animation, position and size. No caption → just hold. Never invent captions.
4. **Exit / transition**: the same exit or transition into the next slot. Then continue with the next image.

Mapping: the user's N images fill the reference's slots **in order**. If the reference has fewer/more slots than images, repeat the reference's slot cycle (or drop extras) keeping its pattern and tempo, and say so in the report.

Look: **always chalkboard.** Redraw every element of the reference (frames, titles, doodles, decorations, backgrounds, transitions) in chalk: draw-on strokes, chalk-written text, chalk filter, board texture. Keep the reference's positions, sizes, hierarchy and motion. Brand rules (§3) apply on top: faceless, our name/handle placed where the reference puts its logo/outro.

Music: every enter, exit, text write-on and transition **lands on the beat** of the reference's song (§4.3). The user's images are adapted to the rhythm, not the other way round.

Captions: the user gives them in the message or in `media/captions.txt` (one line per image, same order; an empty line = no text).

Limits: you cannot reuse the reference's footage, and some video-editor effects can't be pixel-copied. Reproduce motion with CSS transforms (translate, scale, rotate, clip-path, blur, opacity) to within ~0.1 s and visually. List any effect you could not replicate.

---

## 1. Repo layout

```
AGENTS.md                      ← this file
brand/ayda.json                ← brand data (create from §3 if missing)
templates/chalkboard-base.html ← working base template (chalk filter, draw-on, write-on). Copy it, never edit it per-project.
tools/render.mjs               ← deterministic HTML→MP4 renderer (do not rewrite; fix bugs only)
tools/beats.py                 ← beat map from audio (librosa) → beats.json
tools/build.mjs                ← optional: spec.json → index.html generator (create on first use if you want it)
assets/fonts/                  ← local copies of Vazirmatn, Aref Ruqaa, Caveat (see §7)
projects/<slug>/
  brief.md                     ← what the user asked, your assumptions
  analysis.md                  ← reference-video breakdown (§4.1)
  spec.json                    ← storyboard (§5)
  index.html                   ← the animation
  media/                       ← processed images
  refs/                        ← reference video + extracted frames (gitignored)
output/<slug>/                 ← final.mp4, stills (gitignored)
```

`.gitignore` must contain: `node_modules/`, `output/`, `projects/*/refs/`, `*.mp4`, `*.mov`.

**Setup (once):**
```bash
npm init -y && npm i playwright && npx playwright install chromium
pip install librosa soundfile   # for tools/beats.py
# ffmpeg must be on PATH. If Chromium can't be downloaded, set CHROME_PATH to a system Chrome/Chromium.
```

---

## 2. Workflow (follow in order)

1. **Create** `projects/<slug>/` (slug = short English kebab-case). Write `brief.md`.
2. **Analyze the reference video** → `analysis.md` (§4.1) **and its music** → `beats.json` (§4.3).
3. **Prepare images** → `media/` (§4.2).
4. **Write `spec.json`** storyboard (§5).
5. **Build `index.html`** from `templates/chalkboard-base.html` (§6).
6. **Preview**: render stills at several timestamps and *look at them* (§9). Fix problems.
7. **Render** the MP4 (§8).
8. **Deliver**: commit to a branch `reel/<slug>`, report the output path, duration, and any assumptions. Do not commit videos.

---

## 3. Brand (defaults — override only if the brief says so)

`brand/ayda.json`
```json
{
  "handle": "@ayda.nailroom",
  "name": "ایدا نیل‌روم",
  "city": "نقده",
  "services": ["کاشت ناخن", "ژلیش", "فرنچ مینیاتوری"],
  "cta": "رزرو از طریق دایرکت",
  "faceless": true,
  "palette": { "chalk": "#f4f1e8", "pink": "#ffb3c9", "gold": "#ffe49a", "mint": "#b8f0d8",
               "board1": "#2b3a35", "board2": "#1b2622" }
}
```

**Hard brand rules**
- **Faceless page.** The owner does not show her face or voice. If any input image contains a face, do **not** use it as-is: crop it out or tell the user which image was skipped. Hands and nails only. No voiceover.
- Tone: warm, clean, feminine, minimal. Pink = primary accent, gold = sparkle, mint = secondary.
- Language: Persian first; the handle is Latin.

---

## 4. Inputs

### 4.1 Reference video → `analysis.md`

The reference tells you **everything about motion, timing, layout and style**. Its *content* (footage, text, logos, audio) is never reused. Extract:

```bash
V=projects/<slug>/refs/ref.mp4
ffprobe -v error -show_entries stream=width,height,r_frame_rate,duration -of json $V
# one-image overview of the whole video (view this first):
ffmpeg -i $V -vf "fps=1,scale=270:-1,tile=6x5" projects/<slug>/refs/sheet.jpg
# frames for close reading:
mkdir -p projects/<slug>/refs/frames && ffmpeg -i $V -vf "fps=2,scale=540:-1" projects/<slug>/refs/frames/f_%03d.jpg
# scene cuts (timestamps):
ffmpeg -i $V -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -f null - 2>&1 | grep -o "pts_time:[0-9.]*"
```

**Measure every image slot at higher resolution.** For each slot's time window (from the scene cuts and sheet), extract dense frames:
```bash
ffmpeg -ss <S> -to <E> -i $V -vf "fps=15,scale=540:-1" projects/<slug>/refs/frames/slot<N>_%03d.jpg
```
Then record a **slot table** in `analysis.md` (this is the source of truth for `spec.json`):

| slot | enter start–end | enter type | start→end (pos, scale, rot, opacity, clip) | easing (linear / ease-out / overshoot) | hold start–end | text: time, animation, position, size | exit start–end, type |
|---|---|---|---|---|---|---|---|

Look at the sheet and frames, then also write in `analysis.md`:
- Total duration, aspect, fps.
- **Scene list**: start–end seconds, what's on screen, what changes.
- **Text beats**: when each text appears, how (typed / wiped / popped), size, position.
- **Motion vocabulary**: which animation types repeat (draw-on, wipe, pop, slide, zoom) and their speed.
- **Pacing**: average seconds per slot, where the opening/outro are.
- **Layout system**: where text vs. image sits, margins, rhythm of repetition.
- **Palette/typography** observed (for reference only; we keep our brand unless told otherwise).

**Do not reuse** the reference's footage, text or logos. Recreate the structure and timing with our own content. The reference's audio is **analyzed for rhythm** (§4.3). It is put into the final MP4 only if the user explicitly asks for it (see §8); by default export silent plus the beat map, so the song can be added from Instagram's music library when posting.

### 4.2 Images → `media/`

- Inspect every image (view it). Note subject, orientation, dominant colors, and whether a face is visible (§3).
- Normalize: max 1600 px on the long side, sRGB, JPEG q≈90 (`ffmpeg -i in.jpg -vf "scale='min(1600,iw)':-2" -q:v 3 out.jpg`).
- Name them by order of use: `01.jpg`, `02.jpg`…
- Presentation follows the reference (§0). Only if the reference defines none, use the default: **"pinned photo"** — photo with a thin chalk-drawn border, slight rotation (−3°…+3°), two tape strips, revealed by a wipe, then the border is drawn on. Alternatives: full-bleed photo inside a chalk frame; side-by-side pair; before/after wipe.
- Never retouch the nails or the work itself (no color shifts that misrepresent the product). Cropping and mild exposure are fine.

### 4.3 Music → `beats.json`

The reference's song sets the rhythm.
```bash
ffmpeg -i $V -vn -ac 1 -ar 22050 projects/<slug>/refs/ref_audio.wav
pip install librosa
python tools/beats.py projects/<slug>/refs/ref_audio.wav > projects/<slug>/beats.json
```
`beats.json` has `bpm`, `beats`, `bars` (every 4th beat, phase guessed), `onsets`, `loudest_at` (the climax/drop), `duration`.

Then:
1. **Sanity-check** the BPM against the reference's scene-cut spacing (trackers can return half/double tempo or miss the first beat). If they disagree, trust the cuts: derive the grid from the cut times and fix `beats.json` by hand.
2. **Align the slot table to the grid**: express each slot's enter / hold / text / exit times in beats (e.g. "enter 1 beat, hold 2, exit 1 = one bar"). Write the pattern in `analysis.md`.
3. In the build, **every enter start, exit start, text write-on start and transition lands on a beat** (±1 frame at 30 fps ≈ 33 ms); bigger moments (a new scene, the title, the final reveal) land on bars; the climax (`loudest_at`) gets the strongest motion (biggest pop, sparkle burst, fastest wipe).
4. If the user gives **more or fewer images** than the reference has slots, extend or trim in **whole bars** so the music still phrases correctly, and tell the user the resulting duration.
5. Beats can also drive small accents: sparkle pop, a light chalk-dust puff, or a 2–3 % scale bump on the beat (only if the reference does something similar).

---

## 5. Storyboard → `spec.json`

Plan before coding. Times in seconds.

```json
{
  "meta": { "title": "…", "duration": 15, "fps": 30, "audio": null },
  "scenes": [
    { "id": "hook",  "start": 0,   "end": 2.5, "layout": "title",
      "items": [
        { "type": "frame",  "at": 0,   "dur": 1.6 },
        { "type": "doodle", "name": "bottle", "at": 0.6 },
        { "type": "write",  "text": "…", "at": 1.2, "dur": 1.2, "style": "h1" } ] },
    { "id": "photo1", "start": 2.5, "end": 6, "layout": "photo",
      "items": [ { "type": "photo", "src": "media/01.jpg", "at": 2.5,
                   "enter": { "type": "…", "dur": 0.6 }, "hold": 1.4, "exit": { "type": "…", "dur": 0.4 } },
                 { "type": "write", "text": "…", "at": 3.6 } ] }
  ]
}
```

Rules:
- Every `enter` / `hold` / `exit` / text time is copied from the reference's slot table (§0, §4.1), not from defaults. Keep the reference's opening; if it has no hook inside 1.5 s, flag it, don't change it.
- Total length follows the reference (+ extra slots if there are more images, in whole bars). The last scene holds **≥ 1.5 s** fully visible.
- All times snap to `beats.json` (§4.3). Write times in the spec as the snapped value, not the raw one.
- One idea per scene. Max **~7 words** per text line.
- Every item has an explicit `at` (absolute seconds). Nothing starts at 0 by accident.

---

## 6. Building `index.html`

Copy `templates/chalkboard-base.html` → `projects/<slug>/index.html`, then edit. The template gives you the render plumbing (determinism, `?render=1`, `cqw` scaling) plus chalk building blocks. If the reference isn't chalkboard-style, keep the plumbing and replace the look. Building blocks:

| Primitive | How | Notes |
|---|---|---|
| **Draw-on** (doodles, frames, underlines) | SVG `<path pathLength="1" class="d">`, `stroke-dasharray:1` → `stroke-dashoffset:1→0` | Colors via `.p` (pink) `.g` (gold) `.m` (mint). Stagger with `--d` (delay) and `--len` (duration). |
| **Write-on** (text) | `.t` + `clip-path: inset()` wipe | RTL text wipes right→left. Latin uses `.ltr` (left→right). |
| **Chalk look** | `filter:url(#chalk)` on text and SVG | Displacement + grain mask. Keep it on every chalk element. |
| **Pop** | `transform: scale(.6)→1.06→1` with `cubic-bezier(.3,1.6,.5,1)` | For stickers/sparkles/badges. |
| **Photo reveal** | wrapper with `clip-path` wipe, then chalk border draw-on | Rotate ±3°, add tape via two small translucent rects. |
| **Scene change** | Wipe the board clean with a chalk-smudge swipe (a wide soft white gradient moving across, ~0.5 s, opacity .15), or fade-out elements. | Avoid hard cuts unless the reference uses them. |

All sizes use `cqw` (container width units) so the layout scales from preview to 1080 px.

### Determinism (critical)
The renderer **seeks** animations to exact times; therefore:
- **All motion must be CSS animations / transitions-free keyframes or Web Animations API.** No `setTimeout`/`setInterval`/`requestAnimationFrame` driving visuals, no `Math.random()` at runtime (use fixed values or a seeded generator).
- Use `animation-fill-mode: both`. Initial (pre-animation) state must be the hidden state.
- Looping/auto-replay logic must be skipped when `location.search` contains `render` (the template already does this).
- Absolute timing: set each element's `--d` (delay) to its `at` from `spec.json`.
- Images: use relative paths (`media/01.jpg`); the renderer waits for `decode()`.

---

## 7. Persian / RTL rules (non-negotiable)

- `<html lang="fa" dir="rtl">`. Latin handles/URLs in their own element with `dir="ltr"` and `unicode-bidi:isolate`.
- Use the correct **ZWNJ** (نیم‌فاصله) where Persian needs it: «نیل‌روم», «می‌شود».
- **Never split Persian text into per-letter spans** and never use `letter-spacing` — it breaks letter joining. Animate whole lines/words (wipe), not letters.
- Use Persian digits (۱۲۳) in Persian sentences; keep prices/phones as the user wrote them.
- Fonts must cover پ چ ژ گ ک ی: stack is `'Aref Ruqaa', 'Vazirmatn', Tahoma, sans-serif` (handwritten feel for display, Vazirmatn for small text), `'Caveat'` for Latin handwriting.
- **Fonts must be local.** The render machine may be offline or restricted. Download Vazirmatn, Aref Ruqaa, Caveat once into `assets/fonts/` and use `@font-face` with relative paths in the project's `index.html` (replace the Google Fonts `<link>`). The renderer awaits `document.fonts.ready`.
- Check every text for overflow at 1080×1920 (long Persian lines are wider than they look).

---

## 8. Rendering

```bash
# single-frame preview (use several times: 0.5, mid-scene, end):
node tools/render.mjs projects/<slug>/index.html --still 4.5 --out output/<slug>/still_4.5.png

# final video:
node tools/render.mjs projects/<slug>/index.html --dur 15 --fps 30 --out output/<slug>/final.mp4
# DEFAULT: silent video (add the song from Instagram's music library when posting; the beat sync stays valid because timing matches the reference).
# ONLY if the user explicitly asks to embed the song: cut the reference's audio and mux it (animation time 0 = audio time 0):
ffmpeg -y -i projects/<slug>/refs/ref.mp4 -vn -t 15 -c:a aac -b:a 192k projects/<slug>/refs/song.m4a
node tools/render.mjs projects/<slug>/index.html --dur 15 --audio projects/<slug>/refs/song.m4a --out output/<slug>/final_with_audio.mp4
# If the user supplies another track, re-run §4.3 on THAT track and rebuild the timing on its beats.
```

Output spec: **1080×1920, 30 fps, H.264, yuv420p, AAC, `+faststart`**. Instagram Reels: ideal 7–20 s (hard cap 90 s).

**Safe zones** (Instagram UI overlays): keep all important text/subjects out of the **top ~220 px** and **bottom ~380 px**, and out of the right-edge ~120 px column (like/comment buttons). Content lives in the middle.

---

## 9. Quality checklist (verify with real stills before delivering)

- [ ] **Reference match**: for each slot, render stills at the reference's enter-mid, hold, and exit-mid timestamps and compare them side by side with the reference frames at the same points. Fix until motion, position and timing match.
- [ ] Each image reaches a clear resting state, holds, then text (if any) is written during the hold.
- [ ] **Beat sync**: list every enter/exit/text/transition time and its distance to the nearest beat; all within ±1 frame. Climax moment matches `loudest_at`.
- [ ] Looks like **chalk**, not like the reference's own style.
- [ ] Each scene: nothing overlaps, nothing clipped, nothing outside safe zones.
- [ ] Persian text joins correctly (no gaps between letters), ZWNJ correct, no mirrored punctuation.
- [ ] Chalk look consistent (filter on all elements); no element pops in un-animated.
- [ ] No faces visible. No reference-video assets reused.
- [ ] Timing matches `spec.json` ±0.1 s; last scene holds ≥ 1.5 s.
- [ ] File plays: `ffprobe` shows 1080×1920, expected duration, `yuv420p`.
- [ ] Total file size reasonable (< ~50 MB).

If a check fails, fix and re-render stills before the full render.

---

## 10. Git rules

- Branch per reel: `reel/<slug>`. Small, descriptive commits (`add storyboard`, `build scenes 1-3`, `fix RTL overflow`).
- Commit source only: HTML, spec, analysis, processed images (< 2 MB each), scripts. **Never commit MP4s, raw reference videos, or `node_modules`.**
- Never commit API keys or personal data. Never rewrite history on `main`.

---

## 11. Don'ts

- Don't substitute your own taste for the reference's animation. If you can't reproduce an effect, say which one.
- Don't drop the chalkboard look, and don't ship timing that isn't on the beat grid.
- Don't invent prices, discounts, phone numbers, or addresses. If the CTA needs one and the brief doesn't give it, use the brand CTA and flag it.
- Don't claim you verified something you didn't render and look at.
- Don't change `tools/render.mjs` behavior to "make it work" around a broken animation — fix the animation (usually non-deterministic timing).
- Don't produce long explanations; end with: output path, duration, scene list in one line each, assumptions, and anything skipped (e.g. images with faces).
