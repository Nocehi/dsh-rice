# dsh-rice

Experimental presentation layer for **DeepSeek Harness Web**.

`dsh-rice` keeps DSH's existing AppFrame and replaces the persistent
workspace/session tree with a compact **56px application rail** plus a transient
session switcher. It is deliberately a presentation plugin: it does not own
session persistence, message search, model requests, or theme generation.

```text
DSH session/workspace runtime
        │
        │ ctx.sessions.list + ctx.workspaces.list
        ▼
     dsh-rice
        │
        ├── 56px application rail
        │     search / new session / activity / footer / settings
        │
        └── transient session surface
              Sessions / Activity
```

The current v0 has been physically dogfooded with
`@deepseek-ai/dsh@0.1.0-rc.6` on DSH Web. Public upstream source used for the
slot/layout audit is `deepseek-ai/deepseek-harness` at
`47f943859bef60e4160492346772ded9b24f765a`.

> `dsh-rice` is an independent experimental project and is not an official
> DeepSeek project.

## What v0 changes

The upstream 56px collapsed AppFrame track stays in place. `dsh-rice` replaces
the normal `ui-sidebar` occupant with a tree-less rail and moves top-level
session navigation into an overlay.

The rail exposes:

- **Sessions** — opens the full product-visible session switcher;
- **New Session** — delegates to the existing DSH workspace/session runtime;
- **Activity** — opens the same transient surface projected to current,
  running, completed, or pending-interaction sessions;
- existing `sidebar.footer.action` occupants;
- existing Settings in collapsed-rail posture.

The rail follows vanilla DSH's 36x36 control-seat rhythm inside the 56px track.
The embedded Material Symbols are optically sized rather than forced to one
viewport size: search 22px, add 24px, activity 20px. The upstream Settings
occupant remains owned by DSH.

## Session authority

`dsh-rice` does not create a second session index.

The switcher derives its corpus only from:

```text
ctx.sessions.list
ctx.workspaces.list
```

`All` therefore means **product-visible sessions**, not every retained Host
record. v0 follows the upstream top-level navigation semantics:

- archived sessions are excluded;
- subagent-origin child sessions are excluded;
- blank sessions are hidden except for the currently selected blank session;
- Workspace membership/order comes from `workspace.sessionIds`;
- sessions outside a Workspace group appear under `Ungrouped`.

Search is local fuzzy matching over already-visible metadata (title, Workspace,
cwd and agent preset). It intentionally does **not** call
`ctx.sessions.search()` and does not depend on DSH's optional message-content
index.

## Install from a checkout

The package is currently intended to be composed from a checkout rather than
installed as a published npm release.

```sh
git clone https://github.com/Nocehi/dsh-rice.git
cd dsh-rice
npm run check
```

`npm run check` builds `lib/client.js` and runs the Node test suite. Node 22+
is required.

With the rc.6 CLI used for current dogfood, add the checkout to the Web profile
using an absolute path:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 \
  plugin --profile web add /absolute/path/to/dsh-rice
```

Then apply [`examples/cordis.patch.yml`](examples/cordis.patch.yml) to the Web
profile. The essential composition rule is:

```yaml
- id: ui-sidebar
  disabled: true

- insert:
    - id: dsh-rice
      name: dsh-rice
```

`sidebar` is a **single slot**. v0 fails loudly if `ui-sidebar` or another
occupant still owns that surface when `dsh-rice` mounts.

A plugin checkout is linked into the profile during local development. After
switching commits or rebuilding `lib/client.js`, restart the DSH Web process so
Host/client module provenance is unambiguous.

## Optional: use with dsh-matugen

[`dsh-matugen`](https://github.com/Nocehi/dsh-matugen) and `dsh-rice` are
complementary but independent plugins.

```text
DankMaterialShell / Matugen
        │
        ▼
    dsh-matugen
        │ ctx.theme / --dsw-* semantic tokens
        ▼
  vanilla DSH Web ───── dsh-rice
                         layout/navigation only
```

`dsh-matugen` supplies semantic DSH theme variables; `dsh-rice` consumes the
same variables because its surfaces are ordinary DSH-themed UI. There is no
direct import, RPC, filesystem dependency, or wallpaper knowledge between the
two packages. `dsh-rice` also works with stock DSH themes.

This separation is intentional: a component that still pins a stock
`--dsw-static-deepseek-*` color remains an upstream/theme-seam issue, not a
reason for the layout plugin to know about Matugen.

## Commands, not hard-coded chords

v0 defines semantic command ids:

```text
quickSwitcher
sessionMruNext
sessionMruPrevious
sessionOverview
```

It intentionally ships no fixed Web keyboard chords. `Ctrl+K`, `Ctrl+Tab` and
`Ctrl+Space` collide with browser, OS or IME namespaces on important target
platforms. A durable platform keymap can be added separately without changing
the navigation model.

## Browser artifact

DSH Web loads the package's `exports["./client"]` artifact through its lazy
module table. This repository builds one namespace module registered via:

```text
window.__ModuleLoader__.load({ id: "dsh-rice", factory })
```

The source plugin exports `inject` and `apply` as sibling namespace exports and
has no default export. React is resolved from the DSH Web module table at
runtime; the repo-local builder emits `lib/client.js` without adding a browser
package-loader boundary.

Git installs run the builder through `prepare`.

## Verification

```sh
npm run check
```

The current suite covers:

- fail-loud single-slot ownership;
- rc.6 namespace-module artifact shape;
- embedded Material Symbols and optical rail geometry;
- archive/subagent/non-current-blank exclusion;
- local metadata fuzzy search;
- Activity as a projection of the same visible corpus;
- Workspace grouping metadata;
- MRU helpers without a second corpus.

Repository CI may be unavailable when the account's GitHub Actions spending
limit prevents a job from starting. Physical rc.6 dogfood has therefore been a
separate evidence boundary rather than being represented as CI coverage.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — slot, state, theme and
  lifecycle boundaries;
- [`docs/v0.md`](docs/v0.md) — current product decisions and deferred work;
- [`examples/cordis.patch.yml`](examples/cordis.patch.yml) — minimal Web-profile
  composition patch.

## Scope

v0 intentionally leaves these for later slices:

- a true 0px sidebar / new AppFrame posture;
- richer Overview/Activity cards;
- Review/Results presentation;
- Compact Trajectory extraction;
- typography rice;
- `zh-HK` runtime localisation;
- permanent platform keybindings.

## License

`dsh-rice` is MIT licensed. Embedded Google Material Symbols path data is
redistributed under Apache-2.0; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
