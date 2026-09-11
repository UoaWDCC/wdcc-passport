# Shader and texture sources

The holographic effects in `src/cards` are taken from **pokebox** by Sergej Lopatkin
(<https://github.com/selop/pokebox>), MIT licence (text below). Copied from a local
checkout on 2026-09-11.

## Copied verbatim

| Here                                    | pokebox                                        | Purpose                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `shaders/holo.vert`                     | `src/shaders/holo.vert`                        | Shared vertex shader                        |
| `shaders/flatsilver-reverse.frag`       | `src/shaders/flatsilver-reverse.frag`          | common cards (reverse holo)                 |
| `shaders/ultra-rare.frag`               | `src/shaders/ultra-rare.frag`                  | rare cards (ultra rare, e.g. Zapdos ex 192) |
| `shaders/illustration-rare.frag`        | `src/shaders/illustration-rare.frag`           | epic cards (e.g. Poliwhirl 176)             |
| `shaders/double-rare.frag`              | `src/shaders/double-rare.frag`                 | legendary cards (e.g. Ninetales ex 038)     |
| `shaders/common/{blend,filters,rainbow}.glsl` | `src/shaders/common/…`                   | Shared GLSL chunks (`#include`)             |
| `public/cards/fx/grain.webp`            | `public/img/grain.webp`                        | flatsilver-reverse grain (500×500, 58 KB)   |
| `public/cards/fx/glitter.png`           | `public/img/glitter.png`                       | illustration-rare glitter (630×540, 111 KB) |
| `public/cards/fx/iri-7.webp`            | `public/img/151/iri-7.webp`                    | ultra-rare iridescence (300×300, 36 KB)     |
| `public/cards/fx/birthday-holo-dank.webp`, `-2.webp` | `public/img/151/birthday-holo-dank*.webp` | double-rare sparkle (1140×2026, 162 KB each) |

## Adapted

- `shaders/presets.ts` — the uniform values from pokebox `src/data/defaults.ts`, keyed by
  uniform name via `src/data/shaderRegistry.ts`.
- `shaders/index.ts` — `#include` resolution (pokebox uses `vite-plugin-glsl`) and three
  load-time edits to the fragment sources: the back face samples the back image
  un-mirrored and clipped to the front's alpha; `double-rare` shows the plain front
  (not the back image) where the mask is black; and `main()` is wrapped so the output is
  faded out beyond a rounded rectangle (pokebox's scans carry their corners in alpha).
- `three/buildCard.ts` — `buildCardMesh` from `src/three/buildCard.ts` (uniform set,
  double-sided `ShaderMaterial`); no shadow casting.
- `three/shaderUniforms.ts` — `src/three/ShaderUniformUpdater.ts` with a fixed eye.
- `three/buildRoom.ts` — the solid-mode box, walls and lights from `src/three/buildBox.ts`
  with pokebox's lighting-panel values; spotlight shadow, candles and dim mode left out.

## Generated here

- `public/cards/masks/reverse-frame.webp` — card frame mask for common cards (white =
  foil), art panel cut out. 496×700.
- `public/cards/masks/etch-generic.webp` — generic etched-foil relief for rare cards
  (cross-hatch plus flecks, seeded). 496×700.
- `public/cards/masks/legendary-foil.webp` — uniform 30% grey mask so the double-rare
  effect runs at 30% strength on legendary cards. 496×700.

## pokebox licence

MIT License

Copyright (c) 2026 Sergej Lopatkin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
