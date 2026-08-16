# Rail icon micro-motion

The v0 application rail keeps the existing Google Material Symbols Rounded geometry for Sessions, New Session, and Activity. The motion layer does not introduce a replacement icon family or a browser motion dependency.

## Physical dogfood correction

The first implementation used hover/focus end states built from `scale()`, `scaleX()` and `scaleY()` on clipped copies of the three Material Symbols. Physical DSH Web dogfood rejected that treatment: all three commands read primarily as the icon growing, rather than as an internal semantic motion.

The current contract therefore forbids scaling the rail glyph silhouette. Motion is transient: entering hover or keyboard focus plays one short internal gesture and returns the icon to its authored resting geometry while the pointer/focus may remain in the seat.

## Interaction contract

- **Sessions / search** — the lens remains fixed. The handle is isolated from the same Material Symbol with a bounded clip and nudges one CSS pixel along its own diagonal before returning.
- **New Session / add** — the horizontal and vertical strokes remain the same size. They are isolated from the same Material Symbol and briefly move one CSS pixel on different axes before returning, changing their relationship without stretching the plus.
- **Activity / browse_activity** — the existing Google path is decomposed at its authored subpath boundaries into a static shell/baseline and the activity waveform. Only the waveform moves one CSS pixel horizontally before returning.
- **Big Fat Whale** remains a passive, stable brand landmark.

The motion is intentionally bounded to the three rice-owned command glyphs. It does not alter the 56px rail, 36px optical control seats, button hit targets, semantic hover/pressed/focus fills, badges, or command behaviour.

The motion duration is 140ms with the existing productive easing shape. There is no scale, rotation, looping animation, weight-axis pulse, or fill-axis transition in this slice.

## Representation boundary

Google currently ships these Material Symbols as filled, monolithic SVG paths. `search` and `add` therefore continue to reuse the original path through small clipping regions rather than introducing newly redrawn approximations.

`browse_activity` already contains useful independent subpaths in the upstream SVG path data. The rail motion component preserves those exact path commands while separating the frame/baseline from the waveform so the outer silhouette can stay still.

This slice does not attempt general SVG path morphing or stroke-dash drawing. Those techniques require a different path representation and are not needed for the current three rail commands.

## Capability and accessibility boundary

Pointer hover motion is enabled only when all of these are true:

```css
(prefers-reduced-motion: no-preference)
(hover: hover)
(pointer: fine)
```

Keyboard `:focus-visible` triggers the same one-shot semantic gesture when reduced motion is not requested. With `prefers-reduced-motion: reduce`, none of the rail keyframe animation declarations apply.

Coarse-pointer sizing continues to be owned by the existing adaptive-interaction rule; this slice does not add device-name detection or viewport heuristics.

## Provenance

The glyph authority remains the already vendored Google Material Symbols Rounded paths documented in `THIRD_PARTY_NOTICES.md`:

- `search`
- `add`
- `browse_activity`

Those SVG paths remain redistributed under Apache-2.0. The `browse_activity` shell and waveform constants are exact subpaths of the already attributed glyph, with the relative move at the subpath boundary normalized to an equivalent absolute move so each part can render independently.

The clipping, transforms, timing, easing, and React presentation code in this repository are locally authored. Carbon animated icons and Android animated-vector material informed the choreography investigation, but this repository copies no Carbon component, stylesheet, Android XML, or third-party animated-icon geometry.

## Browser artifact boundary

The implementation stays in `src/client-postlude.js`, which is concatenated into the existing namespace-module factory. It reuses the existing `MaterialSymbol`, `MATERIAL_SYMBOL_PATHS`, React identity, and `RailButton` seam.

No additional browser platform module is required; the artifact contract remains limited to React and `@deepseek-ai/dsh-client-ui-primitives`.
