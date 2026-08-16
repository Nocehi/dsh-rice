# Rail icon micro-motion

The v0 application rail keeps the existing command topology and hit-target geometry, but the three rice-owned command glyphs are treated as separate choreography problems rather than as one generic transform system.

## Physical dogfood corrections

Three local dogfood findings shaped the current treatment:

1. **Scale-based end states** made all three controls read primarily as the icon getting larger.
2. **140ms one-shot nudges** made Sessions and New Session read as a twitch, while Activity was effectively imperceptible at rail scale.
3. **The first Scan/Activity pass still behaved like playback rather than interaction**: Sessions launched a complete autonomous scanner animation on hover, and Activity incorrectly removed the baseline together with the outer shell.

The current pass corrects only Sessions and Activity. **New Session / add is intentionally left on the previous provisional 1px part-nudge treatment while its icon grammar is evaluated separately.**

## Interaction contract

- **Sessions** — the rail command is still identified from the existing `MATERIAL_SYMBOL_PATHS.search` command binding, but its rice-owned presentation renders an adapted Carbon `ScanMotion` glyph. Hover/focus now transitions the scanner frame and three scan bars into a held active pose with a short stagger. Leaving hover/focus reverses the stagger from the current rendered state. There is no autonomous loop and no requirement to finish an animation before release can respond.
- **New Session / add** — unchanged in this pass. The horizontal and vertical strokes remain clipped from the existing Google Material Symbol and briefly move one CSS pixel on different axes before returning. This remains provisional.
- **Activity / browse_activity** — the existing Google path is separated at its authored subpath boundaries into upper shell, lower shell, baseline, and waveform. The baseline and waveform form the persistent signal layer and never participate in the hover wipe. On hover/focus, only the lower shell and then upper shell are directionally wiped from left to right. That state is held until release; leaving restores upper then lower shell.
- **Big Fat Whale** remains a passive, stable brand landmark.

The rail stays 56px wide with the same 36px optical seats, button commands, badges, semantic hover/pressed/focus fills, and adaptive coarse-pointer targets.

## Representation boundary

### Sessions / Scan

`ScanMotion` is intentionally used as a semantic replacement for the magnifier presentation in the rice-owned rail seat. The underlying Sessions command contract is unchanged; only the icon presentation changes.

The adapted donor geometry consists of one scanner frame and three scan bars. The donor's internal relationship is retained: the scanner translates horizontally and the bars expand vertically. The donor's old autonomous 2s keyframe envelope is **not** retained. dsh-rice maps those parts onto short CSS transitions so hover/focus is a state relationship with an interruptible release path.

The active pose keeps the scanner at a 4px horizontal offset and the bars at `scaleY(1.3)`. Enter uses a scanner-first, bar-by-bar stagger; release uses the reverse order. Because this is transition-driven, pointer leave during an incomplete enter transition returns from the current interpolated state instead of waiting for a complete animation cycle.

### Activity

`browse_activity` already contains useful independent subpaths. The rail component preserves those Google path commands while exposing four independently presentable pieces:

- upper shell;
- lower shell;
- baseline;
- waveform.

The current "snake" experiment uses staged `clip-path` wipes rather than opacity. Only the two shell paths are mutable. The baseline and waveform remain visible at rest, during enter, while hover/focus is held, and during release. Enter removes lower then upper shell; release rebuilds upper then lower shell.

This is a directional reveal prototype, not general SVG path morphing.

## Capability and accessibility boundary

Pointer hover motion is enabled only when all of these are true:

```css
(prefers-reduced-motion: no-preference)
(hover: hover)
(pointer: fine)
```

Keyboard `:focus-visible` reaches the same held states when reduced motion is not requested. With `prefers-reduced-motion: reduce`, the scanner transitions and Activity clip-path transitions are not declared, so both icons remain at their resting geometry.

Coarse-pointer sizing continues to be owned by the existing adaptive-interaction rule; this slice does not add device-name detection or viewport heuristics.

## Provenance

Google Material Symbols Rounded remains the source for:

- the command identity used to recognize the Sessions rail button (`search`);
- `add`;
- `browse_activity`.

The Activity shell/baseline/waveform constants are exact subpaths of the already attributed `browse_activity` glyph, with subpath starts normalized where necessary so each part can render independently.

The **rendered Sessions scanner geometry and scanner/bar transform relationship are adapted from Carbon Icon Animations `ScanMotion`**, licensed under Apache-2.0. The adaptation changes the component/runtime integration, color handling, timing, hover/focus trigger model, release behavior, reduced-motion behavior, and presentation boundary for dsh-rice. Source and copyright attribution are recorded in `THIRD_PARTY_NOTICES.md` and the adapted source carries an explicit modification notice.

No `@carbon/icons-motion` runtime dependency is added.

## Browser artifact boundary

The implementation stays in `src/client-postlude.js`, concatenated into the existing namespace-module factory. It reuses the existing React identity and `RailButton` seam.

No additional browser platform module is required; the artifact contract remains limited to React and `@deepseek-ai/dsh-client-ui-primitives`.
