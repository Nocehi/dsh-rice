# Rail icon micro-motion

The v0 application rail keeps the existing command topology and hit-target geometry, but the three rice-owned command glyphs are now treated as separate choreography problems rather than as one generic transform system.

## Physical dogfood corrections

Two local dogfood passes were rejected before the current treatment:

1. **Scale-based end states** made all three controls read primarily as the icon getting larger.
2. **140ms one-shot nudges** made Sessions and New Session read as a twitch, while Activity was effectively imperceptible at rail scale.

The current pass changes only Sessions and Activity. **New Session / add is intentionally left on the previous provisional 1px part-nudge treatment while its icon grammar is evaluated separately.**

## Interaction contract

- **Sessions** — the rail command is still identified from the existing `MATERIAL_SYMBOL_PATHS.search` command binding, but its rice-owned presentation now renders an adapted Carbon `ScanMotion` glyph. The scanner frame moves horizontally while three scan bars pulse in a staggered sequence. The motion follows the donor's 2s envelope while hover/focus remains active; most visible motion occurs near the start of that envelope. The overall glyph seat does not scale.
- **New Session / add** — unchanged in this pass. The horizontal and vertical strokes remain clipped from the existing Google Material Symbol and briefly move one CSS pixel on different axes before returning. This remains provisional.
- **Activity / browse_activity** — the existing Google path is separated at its authored subpath boundaries into upper shell, lower shell, baseline, and waveform. On hover/focus, the baseline, lower shell, then upper shell are directionally wiped from left to right with a 70ms stagger. The waveform never moves. The fully revealed waveform remains the stable hover/focus end state; leaving reverses the sequence so the shell is rebuilt.
- **Big Fat Whale** remains a passive, stable brand landmark.

The rail stays 56px wide with the same 36px optical seats, button commands, badges, semantic hover/pressed/focus fills, and adaptive coarse-pointer targets.

## Representation boundary

### Sessions / Scan

`ScanMotion` is intentionally used as a semantic replacement for the magnifier presentation in the rice-owned rail seat. The underlying Sessions command contract is unchanged; only the icon presentation changes.

The adapted donor geometry consists of one scanner frame and three scan bars. The donor uses internal `scaleY()` on the bars and horizontal translation on the scanner frame. This is permitted here because the deformation belongs to the scanning content itself; the 20/22px glyph box and overall silhouette are not scaled as a unit.

### Activity

`browse_activity` already contains useful independent subpaths. The rail component preserves those Google path commands while exposing four independently presentable pieces:

- upper shell;
- lower shell;
- baseline;
- waveform.

The current "snake" experiment uses staged `clip-path` wipes rather than opacity. Entering hover/focus removes the shell in one direction and holds that state; leaving applies the reverse order. This is a directional reveal prototype, not general SVG path morphing.

## Capability and accessibility boundary

Pointer hover motion is enabled only when all of these are true:

```css
(prefers-reduced-motion: no-preference)
(hover: hover)
(pointer: fine)
```

Keyboard `:focus-visible` reaches the same choreography when reduced motion is not requested. With `prefers-reduced-motion: reduce`, the scanner animations and Activity clip-path transitions are not declared, so both icons remain at their resting geometry.

Coarse-pointer sizing continues to be owned by the existing adaptive-interaction rule; this slice does not add device-name detection or viewport heuristics.

## Provenance

Google Material Symbols Rounded remains the source for:

- the command identity used to recognize the Sessions rail button (`search`);
- `add`;
- `browse_activity`.

The Activity shell/baseline/waveform constants are exact subpaths of the already attributed `browse_activity` glyph, with subpath starts normalized where necessary so each part can render independently.

The **rendered Sessions scanner geometry and scanner/bar choreography are adapted from Carbon Icon Animations `ScanMotion`**, licensed under Apache-2.0. The adaptation changes the component/runtime integration, color handling, hover/focus trigger model, reduced-motion behavior, and presentation boundary for dsh-rice. Source and copyright attribution are recorded in `THIRD_PARTY_NOTICES.md` and the adapted source carries an explicit modification notice.

No `@carbon/icons-motion` runtime dependency is added.

## Browser artifact boundary

The implementation stays in `src/client-postlude.js`, concatenated into the existing namespace-module factory. It reuses the existing React identity and `RailButton` seam.

No additional browser platform module is required; the artifact contract remains limited to React and `@deepseek-ai/dsh-client-ui-primitives`.
