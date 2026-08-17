# Local surface continuity prototype

This branch now tests a narrower question than the first rail-to-switcher goo prototype: **when two interactive surfaces are already physically close, can dsh-rice make them read as one locally continuous surface without drawing a long-distance tether?**

The old full-viewport SVG silhouette, Gaussian blur/alpha threshold, and 300 ms source-to-dialog flight are removed from the experiment. The replacement is deliberately proximity-gated and host-agnostic.

## Geometry contract

The maximum edge-to-edge gap is exactly **56 px**, one dsh-rice application-rail width.

For a source and target rectangle, dsh-rice measures the shortest edge gap. A small pointer-inert bridge is allowed only when the measured gap is `<= 56px`. Beyond that threshold, the pair does not receive a visual connector. Overlapping/touching surfaces can still be marked as engaged, but do not need an extra bridge.

The bridge is positioned from the closest points on the two rectangles, not from their centers. That keeps the experiment local even for differently sized surfaces. Geometry is refreshed through `requestAnimationFrame`, a short post-activation settling window, `ResizeObserver`, document mutations, scroll, and viewport resize.

`prefers-reduced-motion: reduce` removes the bridge fade transition while preserving the same semantic engaged state.

## Host participation contract

The generic path deliberately does not carry a selector map for DSH internals. A host control participates when it exposes one of these stable platform relationships:

- `[aria-controls][aria-expanded]` pointing at a visible target by ID;
- native `<details><summary>` with visible opened content.

Pointer, focus, click, open/expanded state, and their reverse transitions drive the pair. The most recently interacted pair owns the single prototype bridge.

This means **Todo**, **Produced**, and **composer** are smoke-test candidates only when the live host exposes one of those stable relationships. If a current DSH build does not expose a durable accessible control-to-surface relation for one of them, this PR intentionally leaves it unbound instead of adding a private class-name/React-tree dependency merely to make the demo fire.

The same rule covers generic collapsed cards: native `details/summary` participates directly; custom cards participate when they expose `aria-controls` + `aria-expanded`.

## dsh-better-sidebar boundary

The sidebar experiment refers specifically to **dsh-better-sidebar**. All new code still lives in **dsh-rice**; this branch does not modify or vendor `dsh-better-sidebar`.

`dsh-rice` injects the public `betterSidebar` client service, reads `getSnapshot().state`, and subscribes with `subscribeState()`. It mirrors only public state into dsh-rice-owned semantic hooks on the document root:

- `data-rice-better-sidebar-panel-open`
- `data-rice-better-sidebar-bottom-open`
- `data-rice-better-sidebar-mode="closed|side|bottom|split"`
- `data-rice-better-sidebar-maximized` when present
- `--rice-better-sidebar-width`
- `--rice-better-sidebar-bottom-height`

There is **no guessed `.dsh-better-sidebar` DOM selector**. The public service exposes sidebar state but does not promise a target DOM node, so this pass tests real service/state integration without fabricating a visual source-to-sidebar seam. A future visible connector should require an explicit DOM/slot anchor contract or another stable accessible relationship.

## What to dogfood

Test the experiment against these routes:

1. a live DSH control with `aria-controls` + `aria-expanded` whose target opens within 56 px;
2. a native or accessible collapsed-card surface;
3. Todo / Produced / composer wherever the inspected host build already exposes that standards-based relation;
4. dsh-better-sidebar opening, closing, side/bottom/split state, resize width, bottom height, and maximize state — observed through the dsh-rice root hooks above.

The key failure condition is simple: if a pair is more than 56 px apart, dsh-rice must not draw a tentacle across the interface. If a host feature has no public/stable relation, the prototype should stay silent rather than guess.

## Debug surface

The browser experiment remains inspectable as `globalThis.RiceSurfaceMorph`, exposing the 56 px threshold, pure edge-gap/geometry helpers, the generic installer, and the better-sidebar state adapter. It remains isolated in `src/surface-morph.js`, so removing that file plus the existing build/package hooks removes the experiment without touching the rail, pulse, or Sidebar QA presentation code.
