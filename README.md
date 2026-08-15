# dsh-rice

Experimental presentation layer for DeepSeek Harness Web.

## v0: tree-less 56px application rail

v0 keeps DSH Web's upstream `AppFrame` and its contract-frozen 56px collapsed sidebar track, but replaces the sidebar surface with a small application rail. The workspace/session tree is removed from the persistent column; product-visible sessions move to a transient, keyboard-navigable switcher.

The rail currently exposes:

- session switcher;
- New Session;
- cross-session activity/attention count;
- existing footer actions and Settings in rail posture.

The switcher groups sessions by Workspace, excludes archived sessions, excludes subagent child rows, and uses `ctx.sessions.list` + `ctx.workspaces.list` as its only canonical metadata sources. Search is local fuzzy filtering over that projection; it does not depend on DSH's opt-in message-content index.

## Install into a Web profile

Add the package to the profile's Node environment, then apply the patch in [`examples/cordis.patch.yml`](examples/cordis.patch.yml). The important part is that upstream `ui-sidebar` is disabled before `dsh-rice` mounts:

```yaml
- id: ui-sidebar
  disabled: true

- insert:
    - id: dsh-rice
      name: dsh-rice
```

`sidebar` is a single slot. v0 fails loudly if another occupant is already registered.

## Commands, not hard-coded chords

v0 defines semantic command ids (`quickSwitcher`, MRU next/previous, `sessionOverview`) but intentionally ships no fixed Web shortcuts. `Ctrl+K`, `Ctrl+Tab`, and `Ctrl+Space` collide with browser/IME namespaces on important target platforms; platform keymaps will be audited separately.

## Scope

See [`docs/v0.md`](docs/v0.md) for the source-audited contract and deferred work. In particular, true 0px sidebar, Review/Results, Compact Trajectory, typography, and `zh-HK` localisation are later slices.

## Development

Requires Node 22+.

```sh
npm run check
```

The browser build is dependency-free at build time and emits `lib/client.js` in DSH's namespace ModuleLoader format. React is resolved from the DSH Web module table at runtime.
