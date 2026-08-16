# Rail icon micro-motion

The v0 application rail keeps the existing Google Material Symbols Rounded SVG path data for Sessions, New Session, and Activity. The motion layer does not introduce a replacement icon family or a browser motion dependency.

## Interaction contract

- **Sessions / search** — the magnifier lens and handle are rendered as clipped layers of the same Material Symbol and separate slightly on hover/focus.
- **New Session / add** — horizontal and vertical strokes are clipped from the same Material Symbol and expand independently from the centre.
- **Activity / browse_activity** — the existing glyph receives a very small vertical pulse treatment.
- **Big Fat Whale** remains a passive, stable brand landmark.

The motion is intentionally bounded to the three rice-owned command glyphs. It does not alter the 56px rail, 36px optical control seats, button hit targets, semantic hover/pressed/focus fills, badges, or command behaviour.

## Capability and accessibility boundary

Pointer hover motion is enabled only when all of these are true:

```css
(prefers-reduced-motion: no-preference)
(hover: hover)
(pointer: fine)
```

Keyboard `:focus-visible` receives the same semantic end states when reduced motion is not requested. With `prefers-reduced-motion: reduce`, there is no transform transition because all motion declarations live inside `no-preference` media queries.

Coarse-pointer sizing continues to be owned by the existing adaptive-interaction rule; this slice does not add device-name detection or viewport heuristics.

## Provenance

The glyph geometry is unchanged from the already vendored Google Material Symbols Rounded paths documented in `THIRD_PARTY_NOTICES.md`:

- `search`
- `add`
- `browse_activity`

Those SVG paths remain redistributed under Apache-2.0. The clipping, transforms, easing, and React presentation code in this repository are locally authored. No source code or SVG geometry is copied from an animated-icon library.

## Browser artifact boundary

The implementation stays in `src/client-postlude.js`, which is concatenated into the existing namespace-module factory. It reuses the existing `MaterialSymbol`, `MATERIAL_SYMBOL_PATHS`, React identity, and `RailButton` seam.

No additional browser platform module is required; the artifact contract remains limited to React and `@deepseek-ai/dsh-client-ui-primitives`.
