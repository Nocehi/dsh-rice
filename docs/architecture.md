# Architecture

`dsh-rice` is one presentation plugin over existing DSH Web layout, theme,
module, and session contracts.

```text
DSH AppFrame
  sidebar single slot / conversation / details / shell.overlay
        │
        ├── ui-sidebar        (disabled by profile composition)
        │
        └── dsh-rice          (owns sidebar surface)
              │
              ├── 56px rail
              │     ├── Big Fat Whale (passive landmark)
              │     ├── Sessions
              │     ├── New Session
              │     ├── Activity
              │     ├── sidebar.footer.action
              │     └── sidebar.settings
              │
              └── shell.overlay
                    └── transient Sessions / Activity surface

DSH runtime state
  ctx.sessions.list + ctx.workspaces.list
        │
        ▼
product-visible projection
        │
        ├── Workspace groups
        ├── Ungrouped
        ├── metadata fuzzy filter
        └── Activity projection
```

The current public source audit is against
`deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a`.

## Authority boundaries

- DSH owns Session and Workspace persistence. `dsh-rice` only reads the public
  list snapshots and invokes existing navigation/start-session actions.
- `ctx.sessions.list` is the Session metadata authority used by the plugin.
- `ctx.workspaces.list` is the Workspace membership/order and archive authority.
- `ctx.sessions.search()` is not part of the v0 navigation corpus. It is an
  optional message-content search seam and is deliberately not used as a
  second source of truth.
- AppFrame owns the actual sidebar column geometry. v0 adopts its 56px
  collapsed track instead of introducing a parallel layout system.
- DSH theme runtime owns semantic theme variables. `dsh-rice` consumes them but
  does not generate a palette.
- DSH Web owns the frozen browser platform module table. `dsh-rice` consumes
  public entries from that table rather than bundling another React or logo
  implementation.

## Sidebar composition

The upstream `sidebar` seat is a single slot. A profile using `dsh-rice` must
therefore disable the stock `ui-sidebar` row before inserting this plugin:

```yaml
- id: ui-sidebar
  disabled: true

- insert:
    - id: dsh-rice
      name: dsh-rice
```

The plugin fails loudly if the single slot already has an occupant. Silent
double ownership would make the rendered surface depend on registration order,
which is not an acceptable presentation contract.

Although `dsh-rice` owns the whole sidebar surface, it re-declares the child
seats used by existing DSH features:

```text
sidebar.workspaces
sidebar.settings
sidebar.footer.action
```

v0 intentionally does not render `sidebar.workspaces`: that is how the
persistent Workspace/Session tree disappears. `sidebar.settings` and
`sidebar.footer.action` remain rendered so their existing registrants retain
normal lifecycle ownership.

## Rail geometry and brand landmark

The rail uses the upstream 56px collapsed AppFrame track. Current vanilla DSH
source specifies a 36x36 control-seat rhythm in that track, so v0 follows that
geometry.

The passive brand seat and every rice-owned control seat are 36x36. The three
embedded Material Symbols use optical compensation inside those seats:

```text
Big Fat Whale     24px upstream FishLogo width
Sessions search   22px
New Session       24px
Activity          20px
```

Equal Material SVG viewport sizes produced visibly unequal ink bounds during
physical dogfood, especially for the add glyph. These sizes are presentation
choices; the hit/control geometry remains aligned with upstream DSH.

`FishLogo` is not embedded. It is imported from the public root export of
`@deepseek-ai/dsh-client-ui-primitives`. Upstream owns its Figma-derived
23.16x17.04 geometry and renders the path with `currentColor`.

The Whale is a passive `role="img"` landmark labelled `DeepSeek`. Vanilla's
collapsed logo can reveal a sidebar toggle because vanilla has an expanded
workspace tree. Rice has deliberately removed that product state, so the mark
does not pretend to toggle a non-existent tree or duplicate Sessions/New
Session.

The Settings glyph remains rendered by the upstream Settings registrant and is
not replaced by `dsh-rice`.

## Presentation grammar

Rice-owned large regions use semantic surfaces, inset, shape, and elevation:

```text
rail                 --dsw-specific-sidebar-fill
overlay mask         --dsw-alias-bg-mask-1
panel                --dsw-specific-menu + --dsw-shadow-lv2
inset search region  --dsw-specific-selector
```

The rail has no rice-owned full-height trailing border. The panel has no
decorative outline. The top controls sit in an inset tonal region rather than
above a full-width divider.

Lines remain available for real interaction or alignment semantics. The current
Session uses an inset three-pixel brand marker because it communicates retained
selection, not region geometry.

### State matrix

```text
rail hover             --dsw-alias-interactive-bg-hover
rail/button pressed    --dsw-alias-interactive-bg-active
row hover              --dsw-specific-sidebar-nav-item-hover
keyboard-active row    --dsw-specific-sidebar-nav-item-active
current Session        --dsw-specific-sidebar-nav-item-active-accent
focus-visible ring     --dsw-alias-brand-primary
```

The current Session combines tonal fill, inset accent, status text, and
`aria-current="page"`. Focus is not represented by hover fill alone: all
rice-owned focusable controls retain a two-pixel semantic ring. Moving focus to
a Session row synchronizes the keyboard-active row, while ArrowUp/ArrowDown
changes are announced through an `aria-live` viewing-state label.

No rice CSS declares or overrides `--dsw-static-*`, and color declarations have
no hard-coded fallback palette.

## Rice-owned typography boundary

The transient surface owns these textual layers:

```text
mode label
search text / placeholder
Workspace name / path
Session title / metadata / status
New Session action
empty state
```

The slice gives each layer explicit leading and spacing, constrains long
Workspace paths and row-copy measure, and uses title/metadata/status hierarchy
inside the panel. These selectors are all rooted under
`[data-dsh-rice-switcher]`.

Conversation Markdown, message measure, and QuestionComposer remain upstream
components. This plugin does not apply global typography CSS, inspect their DOM,
or patch their runtime styles. Any pacing issue observed there is an upstream
seam rather than permission for a presentation plugin to rewrite the page.

## Session projection

The core projection starts from the two list snapshots and removes rows that do
not belong in top-level product navigation:

```text
Session list + Workspace list
        │
        ├── remove archived
        ├── remove origin=subagent
        ├── remove non-current blank sessions
        ▼
product-visible rows
        │
        ├── Workspace membership/order from workspace.sessionIds
        └── remaining rows → Ungrouped by recency
```

The projection keeps enough metadata for presentation and local filtering:
Session id, title, Workspace identity/label/path, cwd, agent preset, running,
pending interaction, completion, update time and current/blank state.

No content body is copied into the switcher and no second persistent index is
created.

## Search

Search is a lightweight in-memory fuzzy score over the already-visible
metadata projection. It may match title, Workspace, cwd or agent preset.

A query therefore narrows the same authoritative corpus; it cannot resurrect
an archived Session, a subagent child, or a hidden blank Session.

The Activity mode applies its activity projection even while a query is
present. Typing in Activity never changes the surface back into the full
Sessions corpus.

## Activity

Activity is a view over the product-visible rows, currently admitting a Session
when any of these is true:

```text
current
running
completed
pendingInteraction is present
```

The rail badge counts completion or pending-interaction rows from the same
visible groups. v0 deliberately keeps Activity small: it is a lens over the
switcher rather than a separate dashboard or retained notification database.

## Commands and input

The plugin exposes stable semantic command ids:

```text
quickSwitcher
sessionMruNext
sessionMruPrevious
sessionOverview
```

The command layer is separate from platform keybindings. Pointer/touch controls
are available immediately; fixed browser chords are deferred until browser,
OS and IME collisions can be audited per platform.

The MRU tracker is also constrained to product-visible ids. Session changes may
reorder MRU history, but the tracker cannot invent or retain a navigation
corpus outside the current visible projection.

## Overlay lifecycle

The Sessions/Activity surface is registered into `shell.overlay`. Open mode,
query text and active keyboard row are local browser viewing state.

Opening resets the query and focuses the search field. Escape closes the
surface; ArrowUp/ArrowDown move the active row and Enter opens it. Focusing or
hovering a row synchronizes the active row. Clicking the backdrop closes the
surface. Starting or opening a Session delegates to the DSH runtime and then
closes the overlay.

The backdrop is pointer-dismissal chrome and is removed from the sequential tab
order; Escape remains the keyboard dismissal path. The overlay does not own
session data, history storage or a Host RPC route.

## AppFrame lifecycle

The rail receives AppFrame's `collapsed` owner prop. If the column is actually
expanded, a layout effect asks the existing layout owner to collapse it. It
does not maintain a second sidebar-width state.

This keeps the 56px posture idempotent across plugin reloads: the plugin adopts
AppFrame state rather than emulating AppFrame geometry in a parallel shell.

## Browser module boundary

The browser source is built into `lib/client.js` as a DSH lazy namespace module:

```text
window.__ModuleLoader__.load({ id: "dsh-rice", factory })
```

The plugin exposes `inject` and `apply` as namespace exports with no default
export. The generated artifact may require exactly:

```text
react
@deepseek-ai/dsh-client-ui-primitives
```

Both are public entries in DSH Web's frozen platform module table at the audited
upstream head. The second entry supplies `FishLogo`; it is not an npm/runtime
dependency on `dsh-matugen` and does not create another browser package-loader
boundary.

The local builder rejects extra static imports, dynamic `import(...)`, residual
ESM syntax, and any generated `require(...)` outside this exact allowlist. Git
installs rebuild the artifact through `prepare`.

## Theme boundary and dsh-matugen

`dsh-rice` styles its surfaces with DSH alias/specific theme variables. It has
no direct knowledge of the source of those tokens.

The Whale uses `--dsw-alias-brand-primary`; controls and regions use existing
surface, interaction, label, and navigation aliases. That means stock DSH
themes work normally, while an optional provider such as
[`dsh-matugen`](https://github.com/Nocehi/dsh-matugen) can repaint the same
semantic variables:

```text
DMS / Matugen
     │
     ▼
dsh-matugen
     │ semantic --dsw-* tokens
     ▼
DSH theme runtime
     ├── vanilla DSH components
     └── dsh-rice surfaces and Whale ink
```

There is deliberately no direct dependency between the two repositories. A
vanilla component that bypasses semantic aliases and pins a static DeepSeek
color remains a component/theme-seam concern; `dsh-rice` does not override
static palette scales to compensate.

## Evidence boundary

Repository tests cover projection behavior, MRU constraints, slot ownership,
browser artifact geometry, public platform-module requirements, upstream
FishLogo reuse, semantic-only colors, soft-region structure, and distinct
interaction/focus/current states.

Physical rc.6 dogfood owns the remaining graphical evidence: real AppFrame
composition, Settings/footer survival, Chat/Trajectory layout, optical rail
sizing and interaction behavior in the actual DSH Web deployment.

A GitHub Actions run that cannot start because of account billing/spending
limits is infrastructure evidence only and is not represented as a code test
failure.
