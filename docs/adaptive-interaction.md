# Adaptive interaction and width behavior

`dsh-rice` adapts presentation from the space and input capabilities actually available to a component. It does not select a layout from a device name, browser user agent, or an `iPad`/desktop/mobile mode flag.

## Design contract

The current slice follows four rules:

1. **Content decides, not device identity.** Input precision is queried with CSS media capabilities and width adaptation is local to the component that owns the constrained content.
2. **Continuous before categorical.** The existing 56px application rail and transient switcher topology remain unchanged while controls can still fit through ordinary flex sizing, intrinsic sizing, and a local container query.
3. **Interaction geometry may exceed optical geometry.** A coarse-capable environment gives rice-owned rail buttons a 44px hit target while the hover/pressed state surface remains the existing 36px optical seat inset four pixels on each edge.
4. **Topology breakpoints remain exceptional.** This slice does not invent a bottom navigation bar, hidden-rail posture, or alternate mobile shell. A true topology change belongs at the point where the current DSH AppFrame contract can no longer express the required layout.

## Coarse-pointer posture

The rail uses `@media (any-pointer: coarse)` rather than a device or primary-pointer test. `any-pointer` is intentional: a touch device may also have a trackpad or mouse attached, but the presence of a fine pointer does not remove the need for a usable touch target.

In that posture:

```text
56px rail
  └─ 44px rice-owned hit target
       └─ 36px optical state surface
            └─ existing 20–24px glyph
```

The 36px visual seat is preserved with a four-pixel inset pseudo-element. Hover and pressed fills move to that visual surface; focus remains on the real 44px control. The activity badge moves inward with the optical seat.

The transient switcher's search and New Session controls also gain a 44px minimum height when a coarse pointer is available. Session rows were already taller than that threshold and are not enlarged again.

Upstream-owned Settings/footer controls remain upstream-owned. This slice does not globally rewrite arbitrary descendants mounted into those slots.

## Local width adaptation

The Sessions/Activity panel establishes an inline-size query container. At a constrained panel width the New Session action yields its secondary text label and keeps the `+` affordance, while the DOM text remains present as the accessible name.

```text
wide panel
  Sessions | Search visible sessions | + New session

constrained panel
  Sessions | Search visible sessions | +
```

The query is against the switcher panel itself, not `window.innerWidth` or a viewport media breakpoint. The application rail remains the same topology on both sides.

## Deliberately unchanged

This slice does not:

- change the DSH AppFrame 56px collapsed-rail contract;
- add a second navigation topology;
- change Conversation/InputBar responsive behavior owned by upstream DSH;
- change Session/Workspace projection semantics;
- make hover-only information newly authoritative;
- add device sniffing or platform-specific JavaScript;
- change theme token ownership.

Touch-only disclosure for upstream surfaces such as the truncated Conversation `StatsLine` remains a separate upstream/presentation seam.

## Design references

The implementation direction is informed by the same general principles demonstrated in Google's responsive-layout codelab and Material guidance: use component-local constraints where possible, preserve spatial continuity, and reserve topology changes for genuine structural breakpoints.

- Wear OS Material 3 Expressive application guidance: https://developer.android.com/design/ui/wear/guides/get-started/apply?hl=zh-tw
- Flutter animated responsive layout codelab: https://codelabs.developers.google.com/codelabs/flutter-animated-responsive-layout?hl=zh-tw#0

These references guide interaction and adaptation principles only. `dsh-rice` does not import Wear geometry, Flutter implementation code, or a device-class breakpoint table.
