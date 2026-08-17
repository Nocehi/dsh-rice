# Local surface continuity prototype

This branch tests a narrower question than the first rail-to-switcher goo prototype: **when two interactive surfaces are already physically close, can dsh-rice make them read as one locally continuous surface without drawing a long-distance tether?**

The rejected full-viewport SVG silhouette, Gaussian blur/alpha threshold, and 300 ms rail-to-dialog flight are no longer the active experiment. The replacement is deliberately proximity-gated, reversible where the host exposes a real open/close state, and split into a generic standards-based core plus focused candidate adapters.

## Geometry contract

The maximum ordinary source-to-target edge gap is exactly **56 px**, one dsh-rice application-rail width.

For a source and target rectangle, dsh-rice measures the shortest edge gap. A small pointer-inert bridge is allowed only when the measured gap is `<= 56px`. Beyond that threshold, the pair does not receive a visual connector. Overlapping/touching surfaces can still be marked as engaged, but do not need an extra bridge.

The bridge is positioned from the closest points on the two rectangles, not from their centers. Geometry is refreshed through `requestAnimationFrame`, a short post-activation settling window, `ResizeObserver`, document mutations, scroll, and viewport resize.

`prefers-reduced-motion: reduce` removes the bridge/bloom transition while preserving ordinary host behavior.

## Stable relationship path

The core path deliberately does not carry a selector map for DSH internals. A host control participates when it exposes one of these stable platform relationships:

- `[aria-controls][aria-expanded]` pointing at a visible target by ID;
- native `<details><summary>` with visible opened content.

Pointer, focus, click, open/expanded state, and their reverse transitions drive the pair. The most recently interacted pair owns the single core bridge.

This is the preferred route for collapsed cards and Todo-like disclosure surfaces. If the live host gives Todo a durable accessible source→target relation, the prototype attaches automatically; if it does not, dsh-rice stays silent instead of inventing a private React/class seam.

## Newly-visible semantic surface path

Some real controls delegate popup semantics to the newly-mounted surface rather than carrying `aria-controls` themselves. `src/surface-morph-candidates.js` therefore adds a second, still standards-based experiment:

1. capture a recent compact `button`, `[role=button]`, or `[aria-haspopup]` activation;
2. snapshot already-visible semantic popup surfaces;
3. for the next 18 animation frames, look only for **newly-visible** `role=menu`, `role=listbox`, `role=dialog`, or open native popover surfaces;
4. connect the nearest candidate only when its edge gap is `<= 56px`.

This is intended for nearby composer action menus/pickers, dsh-better-sidebar's tab-bar `+` menu, and similar local popovers. It deliberately excludes tooltip hover noise and never binds a private host class name.

When the popup disappears or moves beyond the locality limit, the bridge releases. Pointer/focus semantics remain owned by the real source and popup DOM; the bridge is `pointer-events:none` and `aria-hidden`.

## dsh-better-sidebar boundary

The sidebar experiment refers specifically to **dsh-better-sidebar**. All new code still lives in **dsh-rice**; this branch does not modify or vendor `dsh-better-sidebar`.

The public `betterSidebar` client service remains the authority. dsh-rice injects it, reads `getSnapshot().state`, and subscribes with `subscribeState()`. The core adapter mirrors public state into dsh-rice-owned semantic hooks on the document root:

- `data-rice-better-sidebar-panel-open`
- `data-rice-better-sidebar-bottom-open`
- `data-rice-better-sidebar-mode="closed|side|bottom|split"`
- `data-rice-better-sidebar-maximized` when present
- `--rice-better-sidebar-width`
- `--rice-better-sidebar-bottom-height`

The candidate adapter now also gives the **right workbench toggle** a real visual experiment without querying any CSS-module class. It records only a fresh compact activation in the top-right 112 px corner; a subsequent public-service `panelOpen` transition is the gate that proves the activation belonged to the right workbench. The panel width comes from public service state.

Instead of rebuilding the earlier long tether, dsh-rice animates a **180 ms local corner bloom**: the toggle-sized surface expands only into a small top-right patch of the right workbench and fades into the real panel. Closing runs the same geometry in reverse when the state transition follows a fresh top-right activation. The bloom never traverses the viewport and never becomes interactive.

The bottom workbench deliberately does not receive the same bloom: its toggle lives at the top-right while its panel appears at the bottom, so the source/destination topology is non-local and would recreate the rejected tentacle problem.

There is still **no `.dsh-better-sidebar` selector, CSS-module substring match, or vendored sidebar implementation** in dsh-rice.

## Produced-file experiment

Current dsh-better-sidebar owns a produced-files interception whose chips open files through the same public `betterSidebar.openTab(...)` service. That makes Produced a useful negative/conditional test:

- if a produced chip and its resulting surface are physically local, the generic 56 px rules may connect them;
- if the editor workbench is far across the conversation viewport, dsh-rice intentionally draws nothing rather than resurrecting a long handoff.

This PR therefore does not fabricate a separate preview card merely to force Produced to animate. The real product destination remains authoritative.

## What to dogfood

Test these routes independently:

1. **dsh-better-sidebar right toggle → right workbench**: open and close should read as a short local corner bloom, never a tether; keyboard activation should behave the same when focus is on the toggle.
2. **dsh-better-sidebar tab-bar `+` → menu**: if the DSH `Menu` renders a semantic menu within 56 px, a tiny live bridge should connect the two while open and release on close.
3. **composer action → nearby picker/menu/dialog**: only newly-visible semantic surfaces within 56 px should participate.
4. **Todo / collapsed card**: native details or `aria-controls` disclosures should use the core reversible bridge; host builds without a stable relation should remain untouched.
5. **Produced chip → sidebar editor**: verify the locality gate; a far destination should produce no cross-viewport connector.
6. **dsh-better-sidebar state**: side/bottom/split, resize width, bottom height, maximize, and session changes should keep the dsh-rice root hooks accurate.

The key failure condition remains simple: **if a surface relationship is not local, dsh-rice must not draw a tentacle to make it look local.**

## Debug surfaces

`globalThis.RiceSurfaceMorph` exposes the 56 px threshold, pure edge-gap/geometry helpers, the stable-relation installer, and the better-sidebar state adapter.

`globalThis.RiceSurfaceCandidates` exposes the semantic-emergence installer plus the better-sidebar corner-bloom helpers. Both scripts are dependency-free and concatenated into the existing dsh-rice browser artifact; removing them plus their build/package hooks removes the experiments without touching rail icon motion, pulse, or Sidebar QA presentation.
