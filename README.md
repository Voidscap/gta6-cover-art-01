# Neon Sunset Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Voidscap/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Voidscap/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline, single-page cover maker that turns your photos into a multi-panel
neon-sunset poster in the style of a GTA VI loading screen — no uploads, no
server, no watermark. An entry for the make.fun bounty
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).

## Features

- **Your photos, 1–5 at a time** — pick files or drag and drop them onto the
  page; two bundled sample photos (a boulevard and a pier) load with one click.
- **Three multi-panel layouts** — three vertical panels, a wide hero panel over
  three below, or a five-panel collage (one big panel plus a 2×2 grid).
- **Per-panel control** — each panel takes any loaded photo, a zoom slider for
  the cover-fit crop, and drag-to-reposition right on the cover. One photo can
  fill several panels or every panel can show a different one.
- **Vice City neon-sunset grade** — a magenta-to-orange-to-purple grade laid
  over the cover with an intensity slider, plus a saturation and contrast lift
  on the photos.
- **Big bold caption** — editable text lettered in heavy capitals with a dark
  outline and drop shadow, top or bottom, in white, gold, pink or cyan.
- **One-click PNG export** — 1080×1080, 1080×1350 or 1920×1080.

## How to run

Open `app/index.html` in a desktop browser, or serve the folder and open it:

```
node serve.ts
```

then open the address it prints (http://localhost:8080). Everything is plain
static files — no build step, no network request, no downloaded fonts (system
font stacks only).

## Privacy

Photos are read on your own machine and drawn straight onto a canvas. They are
never uploaded anywhere — there is no server to upload them to, and the app
makes no network requests at all.

## License

MIT — see `LICENSE`.
