# KITCHEN FIGHT — Art Guide ("Trattoria Toon")

All art is **procedural vector painting** in TypeScript (Canvas 2D), cached to
high-resolution bitmaps at load time. There are no image files. The bar is
*grade-A indie game*: think polished modern cartoon — bold, juicy, readable,
charming.

## The look
- **Bold warm ink outlines** — `INK` (`#2b1712`), never pure black. Width scales with size:
  small things (≤24u) 1.4–1.8, normal characters 2.2–2.6, big props 2.6–3, bosses 3–4.
- **Cel shading** — light from the **upper-left**. Every main shape gets a shadow crescent on the
  lower-right (`shape()` does this automatically; tune with `shadowOffset`, bigger shape → bigger offset).
- **Gloss** — glossy highlight spots on round/shiny things (`gloss` in `shape()` or `glint()`).
- **Saturated Mediterranean palette** for characters & pickups; **floors/backgrounds are calmer,
  lower contrast and less saturated** so characters pop. Enemies must stand out from every floor.
- **Expressive faces** — every food villain has a face: angry brows, big eyes with a white highlight,
  toothy snarls/grins (`face()`, `eye()`, `brow()`, `mouth()`). Heroes: determined, friendly.
- **Chunky, chibi proportions** — big heads/bodies, stubby limbs (`legs()`, `arm()`).
- **Details that reward a closer look** but don't clutter at 1× — texture via `speckle()`, seams via `line()`.
- **No text inside sprites** except big signage props (short, readable, Italian/English, no brands).
- **No real brands/logos/trademarks.** Generic parodies only.

## Technical conventions
- Register sprites with `defineSprite({ id, w, h, ax, ay, frames, flash, draw })` from `src/gfx/sprites.ts`.
- **World units** everywhere. 1 world unit ≈ 1 CSS pixel at default zoom. Sprites are cached at
  `RES = 2` px/unit (override `res` for portraits/icons).
- `draw(ctx, frame)` paints around the **anchor** `(0,0)`; the box `w×h` is positioned so the anchor sits
  at `(ax, ay)` from its top-left. Anything outside the box is clipped — leave ~3 units margin for outlines.
- **Characters/enemies/bosses:** anchor = centre of the collision circle (roughly the middle of the body's
  lower half). Feet rest at about `y = +radius`. **Do not draw the ground shadow** (the renderer draws a soft
  ellipse at the feet). Face **right / front-right** (the renderer mirrors for left).
- **Walk cycles:** `frames: 4` (0..3), frame 0 = neutral. Animate legs/arms/tails/drips; keep the body
  in place (the renderer adds bob/squash/tilt). Set `flash: true` for anything that can be hit.
- **Props:** anchor = the point where the prop touches the ground (bottom-centre of its footprint);
  this is what the y-sorting uses.
- Use the helpers in `src/gfx/painter.ts`: `shape`, `group`, `flat`, `line`, `inkLine`, `face`, `eye`,
  `brow`, `mouth`, `legs`, `arm`, `speckle`, `glint`, `glow`, `splatPath`, `smoothPath`, `blobPath`,
  `starPath`, `roundRectPath`, `ellipsePath`, `circlePath`, `polyPath`, `volume`, `vgrad`, `rgrad`,
  colour utils `shade`, `light`, `mix`, `rgba`, deterministic `rng(seed)`.
- Keep painters deterministic (use `rng(seed)`, never `Math.random()`).
- Performance: painters run once at load; complexity is fine, but avoid >2,000 path ops per sprite.

## Reference
`src/gfx/art/hero.ts` (Chef Enzo) is the quality/style reference. Match its outline weight, shading,
face construction and proportions.

## Visual QA loop (mandatory)
1. Dev server: `npx vite --port 5173 --strictPort` (one is usually already running — check
   `curl -s localhost:5173/gallery.html | head -3` first).
2. Screenshot: `node scripts/shot.mjs "/gallery.html?prefix=enemy.&zoom=1" out.png 1400 900`
   - `zoom=1` is the **real in-game size** — judge readability here. `zoom=3` to inspect detail.
   - `&bg=%23383030` or `&bg=tile:<tile sprite id>` to check contrast on floors; `&flash=1` shows hit flashes.
   - Stage previews: `/gallery.html?stage=kitchen&zoom=1&colliders=1`.
3. Look at the PNG with the Read tool. Fix what looks off. Repeat until it looks *great*, not just OK.
Save screenshots in your scratchpad, never in the repo.
