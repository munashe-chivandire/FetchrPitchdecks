---
name: fetchr-hover
description: Hover, focus and press rules for buttons and links on the Fetchr pitch deck site (landing page and one-pager). Use when adding or changing any button or link there.
---

# Fetchr hover

Built from the global `button-hover` skill. The code is `lib/hover-motion.js` (needs GSAP loaded first) and `lib/hover.css`.

## Why

Fetchr's signature motion is the loader panel sliding up off the page. Its two brand colors are blue 500 `#0041f5` and blue 900 `#001245`, with blue 200 `#adc2ff` as the light accent. A flood that grows from where the pointer entered matches the panel move, and the blue 200 rim is the second color.

## Kinds and where they're used

- `flood` on every solid or outlined button.
  - One-pager `.btn.primary` floods blue 900 with a blue 200 rim.
  - One-pager `.btn` and the name pill `.who-btn` flood blue 50 with a blue 200 rim.
  - Landing `.btn-primary` and `.btn-open` flood blue 400 `#2a5cff` with a blue 200 rim, because blue 900 vanishes on the dark page.
- `line` on the landing nav link, drawn on a `<span data-line>` around the text.
- The guide's close button is red 600 and floods a darker red `#b91c1c`, because close buttons are red on this site.
- Deck cards keep their own CSS hover. Steps, inputs and the layout toggle change color only.

## Icon moves

Keyed by Phosphor class in `moves`:

- Arrows loop the way they point.
- `ph-arrow-square-out` loops up and to the right.
- `ph-link` and `ph-question` rock.
- `ph-x` turns a quarter.
- Anything else lifts.

## Timing

The skill's defaults: flood 0.5s in and 0.4s out, line 0.4s and 0.3s, press ripple 0.7s.

## Doesn't do

- No lift, scale or magnet on a control. The old `translateY(-2px)` hovers were removed.
- No added arrow characters.
- Never animate a transform on a `<dialog>`. In Chrome it drops the dialog out of the top layer and it renders at the bottom of the page. Move the dialog's children instead.

## Checks

Run `~/.claude/skills/button-hover/scripts/hover-check.mjs` on a flood button from both sides. Pass `--ready "!document.querySelector('.loader')"` so the hover waits for the loader to lift.
