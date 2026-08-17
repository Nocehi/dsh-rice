# Rail-to-switcher surface morph prototype

This slice tests one narrow presentation question: whether the rice-owned Sessions and Activity rail seats should read as the physical origin of the transient switcher surface.

It is now rebased directly on `main` after the rail micro-motion work landed, so the surface-topology experiment can be dogfooded against the final 20px Scan / static Add / Activity signal-layer behavior without carrying the old stacked branch history.

## Product behavior

- Activating **Sessions** or **Activity** from the application rail captures the existing 36×36 optical seat as the transition origin.
- When the transient switcher opens, a short presentation-only SVG silhouette grows from that origin toward the measured dialog rectangle.
- A rounded tether and the two surfaces share one blur/alpha-threshold filter, producing the temporary connected/liquid topology.
- The actual dialog stays real DOM above the silhouette. Text, input, buttons, focus, ARIA, hit targets, session commands, and list rendering are unchanged.
- **New Session** does not participate because it creates a session directly instead of opening this transient surface.
- Keyboard activation of the rail buttons still produces the surface transition because it reaches the same click path.
- Opens triggered by other command surfaces have no fresh rail geometry and therefore use the existing switcher presentation without the morph layer.

This prototype currently tests the **open / arrival** transition only. Closing remains immediate and behaviorally identical to the existing switcher. That keeps the experiment from adding delayed dialog teardown or navigation semantics before the visual direction has earned that complexity.

## Geometry boundary

Coarse-pointer mode may expand the interactive rail target to 44×44, but the surface origin is clamped back to the existing centered 36×36 optical seat. The animation therefore follows the visible object rather than the larger touch hit box.

The destination rectangle is measured from the live `.dsh-rice-panel` after it mounts. No viewport breakpoint or hard-coded panel coordinates are introduced.

## Rendering boundary

The browser artifact does not import `liquid-gooey` or any other motion package. `dsh-rice` still requires only:

- `react`
- `@deepseek-ai/dsh-client-ui-primitives`

The linked gooey experiment motivated the separation between a deformable silhouette and sharp interactive DOM. The implementation here is local and deliberately smaller: SVG rounded surfaces + a tether, `feGaussianBlur`, and alpha thresholding. No third-party source or package is vendored.

The layer uses `--dsw-specific-menu`, the same semantic surface token already used by the switcher panel, so stock DSH and semantic theme providers remain the color authority.

## Motion / accessibility boundary

The silhouette handoff lasts 300 ms and removes itself shortly afterward. The real panel is never replaced by the SVG and never becomes the hit target.

Current `main` rail motion is state-driven rather than the earlier 140 ms one-shot prototype. Sessions settles across roughly 190 ms of scanner/bar stagger, while Activity's two shell stages settle across roughly 180 ms. Physical dogfood therefore needs to judge the 300 ms surface handoff together with those release transitions rather than comparing it with the obsolete 140 ms gesture.

`prefers-reduced-motion: reduce` removes the morph layer and panel handoff animation entirely. Focus behavior remains owned by the existing switcher.

## Acceptance criteria

The prototype earns a merge only if physical dogfood confirms all of these:

1. **Sessions → switcher reads as one surface changing topology.** The tether must not read as a decorative line, tentacle, or object flying independently of the rail seat.
2. **Activity → switcher remains coherent despite the longer travel.** Its click/release shell restoration and the surface morph must not compete for attention or look like two unrelated animations.
3. **Recognition is not delayed.** The real dialog must become visually legible immediately enough that the 300 ms handoff does not make the switcher feel slower than `main`.
4. **Rail release remains responsive.** Scan and Activity must continue their current interruptible release behavior; opening the switcher must not freeze, restart, or visually override those rail states.
5. **Geometry stays attached.** The 36×36 origin must align with the visible rail seat and the destination must land on the measured panel under Firefox/Wayland and coarse-pointer layouts.
6. **No interaction regression.** Input focus, Escape, backdrop close, rows, buttons, ARIA, hit targets, and commands must behave exactly as on `main`; the SVG layer remains presentation-only and pointer-inert.
7. **Reduced motion is clean.** With `prefers-reduced-motion: reduce`, no morph or panel handoff should appear and the switcher should open exactly through the ordinary presentation path.
8. **Theme behavior remains semantic.** Stock DSH and Matugen-derived palettes must paint the temporary surface through the same semantic menu token without conspicuous mismatch.

If the effect reads as a tentacle, obscures content, delays recognition of the dialog, or makes the rail release and surface handoff fight for attention, close the prototype rather than generalising the mechanism.
