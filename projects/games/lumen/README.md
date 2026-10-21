# LUMEN

A single-file neon arena game. Everything is in `index.html` — no build step,
no bundler, no dependencies. Open the file in a browser and it runs.

## The game

WebGL2, no libraries. You are a triangle in a neon arena; waves of enemies
close in, and you shoot, dash, shockwave and overdrive your way through.

- **Move** WASD / arrows, or the left half of the screen on a touch device
- **Aim** mouse, or the right half of the screen on a touch device
- **Fire** hold click, or hold on the right side of a touch device
- **Dash** SPACE · **Nova** R · **Overdrive** F · **Pause** ESC

Rendering is a custom pipeline: an instanced SDF renderer draws every shape
from a single quad, a 46,000-point GPU particle field does its motion
analytically in the vertex shader, and the result goes through an HDR
bright-pass → separable blur → composite chain with chromatic aberration,
bloom, vignette, grain and an ACES-ish tonemap.

The soundtrack is generated live in Web Audio — a 16-step sequencer over a
minor-pentatonic scale, synthesized from oscillators, with the arrangement's
intensity tracking how much trouble you're in. No audio files either.

## What built it

**Model:** `minimax-m3.1-flash` (MiniMax M3.1 Flash), running as
`minimax-m3.1-flash:cloud` inside Claude Code.

**Author:** Claude Code — an agentic coding harness. The whole game was written
by the model through Claude Code's tool interface: it wrote `index.html`, ran
it in a real browser, measured what actually happened, and fixed what the
measurements showed was wrong. No human wrote a line of the game.

The prompt was deliberately minimal — *"build me a single html file game as a
test of your capabilities, I will give you no guidance other than that it
needs to be entirely contained in a single html file, and that it should be
cutting edge to demonstrate your capabilities."* Everything below is the
model's own design decisions, made without further guidance.

### How it was built

The interesting part was not writing the renderer — it was the loop that
followed. The model never asserted that the game worked; it measured.

**1. Design from first principles.** The core rendering idea is a single
instanced quad. Every entity — the player triangle, every enemy, every
bullet, every pickup — is one instance of the *same* quad, 12 floats each
(`x, y, size, rotation`, then `r, g, b, a`, then `shapeId, param1, param2,
seed`). A fragment shader switches on `shapeId` and evaluates a different
signed distance function per shape. The result: a whole game world drawn in
one instanced call, with 11 SDF primitives (disc, ring, triangle/arrow,
diamond, hexagon, capsule, 4-point spark, soft blob, meter fill, meter
track, ship hull) and no sprite atlas, no geometry pipeline, and no
per-entity objects. 4,096 instances fit in one interleaved buffer, uploaded
once per frame in a single `bufferSubData`.

**2. Make the GPU do the work.** The 46,000-particle field is not simulated on
the CPU. Each particle carries a static seed (angle, radius, speed, size),
and the vertex shader derives its position analytically as a function of
`uTime` and that seed: a swirl that tightens toward the centre, a breathing
radial pulse, a wrapped vertical drift, and a sideways sway — all evaluated
per-vertex, per-frame, with zero CPU work and zero buffer uploads. The seed
buffer is written once at startup. Two details show up in the shader
comments as hard-won: the drift phase has to be spread across the whole
1,600-unit wrap window or every particle shares a phase and the entire field
slides into a single band, and the field radius has to scale with the
viewport or a phone shows the same 46k particles crammed into a quarter of
the screen.

**3. Build the post chain properly.** The scene renders to an `RGBA16F`
float target when `EXT_color_buffer_float` is available (falling back to
`RGBA8`), then runs a bright-pass with a soft knee, a separable 9-tap
gaussian at half and quarter resolution, and a composite that adds bloom,
chromatic aberration, an overdrive grade, hit flash, vignette, film grain and
scanlines, finishing with an ACES-ish tonemap. This is a real deferred
pipeline, not a canvas filter.

**4. Compose the audio, too — with no audio files.** The soundtrack is
generated live in Web Audio: a lookahead scheduler walks a 16-step bar on a
minor-pentatonic scale, synthesizing bass, arp, hats and percussion from
oscillators, through a dynamics compressor and separate music/SFX gain
stages. The music's *intensity* tracks the game state — as enemies close in
the arrangement thickens. Zero bytes of audio assets, zero `<audio>` tags.

**5. Then verify it, empirically.** The model built a dependency-free
Chrome DevTools Protocol driver (`cdp.mjs`, using Node 22's built-in
`WebSocket` and `fetch`) and wrote probes that read the actual framebuffer,
the actual DOM, the actual GPU state. When a screenshot looked wrong, it
measured the luminance histogram rather than guessing. When a test looked
like it passed, it checked the test was actually capable of failing.

**6. Review, then fix what the review found.** A full top-to-bottom review
of the finished `index.html` surfaced eleven real defects, all confirmed
empirically before being fixed. The interesting ones were not visible in a
screenshot:

- *Bloom was completely dead.* The bright-pass threshold was `1.05`, but the
  `RGBA8` fallback target clamps every channel at `1.0` — so on that path the
  bright pass could never fire at all. And on the float path the scene only
  peaks around `1.02–1.09`, so about 0.001% of pixels cleared it. The model
  measured the scene's actual luminance distribution (particle wash
  0.00–0.10, entity cores 0.75–0.85) and re-tuned the threshold to `0.78`.
- *The hidden menu card ate touches during play.* A descendant's
  `pointer-events:auto` overrides an ancestor's `none`, so the dismissed
  menu stayed live and swallowed taps over ~20% of the viewport — aim and
  fire were dead there.
- *The card could not be touch-scrolled.* `body{touch-action:none}` is not
  restorable by a descendant, so the scrollable menu could never scroll on
  a phone. The fix was to scope `touch-action:none` to the canvas instead.
- *The FPS counter could never report below 20.* Frame time was clamped
  *before* being accumulated, and `autoQuality` was fed that floored value
  — blinding the adaptive quality system exactly when it needed to act.

Full detail in the build log entry `log/2026-10-20-lumen-review-fixes.md`.

**7. Build a regression suite, not a one-off test.** Every defect above
became a numbered check in `review.mjs`, written to *fail* if the bug ever
returns. 14 checks, all passing.

### What it runs at

Measured in a real Chromium, not estimated:

| | |
|---|---|
| Frame time | 16.6ms median, 17.4ms p95 (60fps) |
| Under load | 60fps across all six stress scenarios, up to 298 enemies / 1,186 draw entities / 46k particles |
| Enemy separation loop | 0.68ms/frame at 205 enemies (O(n²), measured and cleared) |
| 60s soak | heap flat at 10MB, DOM flat at ~130 nodes |
| 60s autoplay | score 10,248, wave 6, 52 kills, 60fps throughout |
| Adaptive quality | high → low (5,520 particles) → high (46,000) |

### By the numbers

| | |
|---|---|
| `index.html` | 2,398 lines / 96KB — the entire game |
| GLSL programs | 6 (background, entities, particles, bright-pass, blur, composite) |
| SDF primitives | 11, selected by a branch in one fragment shader |
| Draw calls per frame | 9 for the whole world (HUD reports the live count) |
| External requests | 2 — Google Fonts for the two typefaces, with system fallbacks |
| Audio assets | 0 — everything is synthesized at runtime |
| Sprite sheets / textures | 0 — every shape is a signed distance function |
| Dependencies | 0 |

Open `index.html` from a `file://` URL and it runs. There is nothing to
install and nothing to build.

## Running the checks

The harness drives a real Chromium over the DevTools Protocol. No npm
install — it uses Node 22's built-in `WebSocket` and `fetch`.

```
node review.mjs        # the regression suite — exits non-zero on failure
node test.mjs          # smoke test: boots, plays, reports frame times
node stress.mjs        # heavy load: holds 60fps at ~300 enemies
node leak.mjs          # 60s soak: heap and DOM node count over time
node play.mjs          # 60s of autoplay, prints a score trace
node quality_check.mjs # adaptive quality demotes and recovers
node mobile_check.mjs  # mobile layout screenshots
node scroll_check.mjs  # touch-scrolling the menu card on a short viewport
node shots.mjs         # screenshot capture
```

A Chromium build is required. The harness looks in the Playwright cache and
falls back to a system Chrome; set `LUMEN_CHROME` to point at a specific
binary:

```
LUMEN_CHROME=/path/to/chrome node review.mjs
```

Screenshots and test output are written to the system temp directory, not the
checkout. Every path in the harness derives from `import.meta.url`, so the
suite runs from any checkout location.

## Notes for anyone extending this

- **`review.mjs` is the regression suite.** Each check asserts a specific
  fixed defect stays fixed. When you change rendering, input or HUD code, run
  it.
- **The bloom threshold is load-bearing.** It sits at `0.78`, between the
  particle field's luminance (0.00–0.10) and the entity cores (0.75–0.85). It
  also has to stay under 1.0, because the `RGBA8` fallback target clamps every
  channel there and a threshold above 1.0 makes the bright pass output pure
  black.
- **CDP's raw `Input.dispatchTouchEvent` does not scroll.** It does not drive
  the compositor's scroll gesture — verified against a plain scrollable div
  with no game involved. Use `Input.synthesizeScrollGesture` for anything that
  depends on a real finger scroll.
- **Coordinates:** world +Y is up, screen/DOM +Y is down, and GL's `vUV.y` is
  up. Most bugs in this codebase live at that boundary.
- **The entity draw is one instanced call, not many.** If you add a new
  shape, add a branch to the SDF switch and raise `MAX_ENT` if you exceed
  4,096 simultaneous entities — but check the instanced buffer size first.
