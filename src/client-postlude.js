/**
 * Small browser postlude for compatibility/a11y behavior that must wrap the
 * v0 presentation components without adding another platform-module require.
 * The repo builder concatenates this file after src/client.js in the same
 * namespace-module factory, so these wrappers reuse the existing DSH runtime
 * and React identity.
 */
const RiceApplicationRailBase = ApplicationRail
const RiceQuickSwitcherOverlayBase = QuickSwitcherOverlay
const RiceApplyBase = apply

const RICE_COMPAT_CSS = `
span[role="tooltip"] { color:var(--dsw-alias-label-primary-inverted); }
/* rc.6 blank-session hero: keep upstream geometry/opacity, but let the DSH
   semantic theme own the ambient hue and Preview accent. */
[data-phase="hero"] [data-composer-seat] svg[viewBox="0 0 1051 468"] { color:var(--dsw-alias-state-business-primary); }
[data-phase="hero"] [data-composer-seat] svg[viewBox="0 0 1051 468"] ellipse { fill:currentColor; }
[data-phase="hero"] [data-composer-seat] div:has(> span:first-child > svg[viewBox="0 0 23.16 17.04"]) { position:relative; grid-template-columns:34px auto 0; transform:translateX(5px); }
[data-phase="hero"] [data-composer-seat] div:has(> span:first-child > svg[viewBox="0 0 23.16 17.04"]) > span:nth-child(3) { position:absolute; justify-self:start; background:transparent; color:var(--dsw-alias-state-business-tertiary); border-color:var(--dsw-alias-border-l2-darkmode-thin); }
/* rc.6 Chat turn status: upstream pins the shimmer to static DeepSeek blues.
   Override only the gradient image so upstream timing, clipping, reduced-motion
   behavior, clock styling, and future locale text remain upstream-owned. The
   midpoint is derived from the semantic primary/on-primary pair, so Matugen or
   any other DSH semantic theme can repaint the shimmer without static-palette
   mutation. */
[data-conversation-scroll] div[role="status"][aria-live="polite"] {
  background-image:linear-gradient(
    90deg,
    var(--dsw-alias-state-business-primary) 0%,
    var(--dsw-alias-state-business-primary) 40%,
    color-mix(in srgb, var(--dsw-alias-state-business-primary) 58%, var(--dsw-alias-label-primary-foreground)) 50%,
    var(--dsw-alias-state-business-primary) 60%,
    var(--dsw-alias-state-business-primary) 100%
  );
}
`

const RICE_ADAPTIVE_CSS = `
/* Adapt to input precision, not device names. A coarse-capable environment
   gets a 44px interaction target while the familiar 36px rail state surface
   remains inset inside it. any-pointer intentionally keeps this true when a
   tablet also has a trackpad or mouse attached. */
@media (any-pointer: coarse) {
  [data-dsh-rice-rail] .dsh-rice-rail-button { width:44px; height:44px; background:transparent; }
  [data-dsh-rice-rail] .dsh-rice-rail-button::before { content:''; position:absolute; inset:4px; border-radius:12px; background:transparent; pointer-events:none; }
  [data-dsh-rice-rail] .dsh-rice-rail-button:hover { background:transparent; }
  [data-dsh-rice-rail] .dsh-rice-rail-button:hover::before { background:var(--dsw-alias-interactive-bg-hover); }
  [data-dsh-rice-rail] .dsh-rice-rail-button:active { background:transparent; }
  [data-dsh-rice-rail] .dsh-rice-rail-button:active::before { background:var(--dsw-alias-interactive-bg-active); }
  [data-dsh-rice-rail] .dsh-rice-rail-icon { position:relative; z-index:1; }
  [data-dsh-rice-rail] .dsh-rice-badge { right:5px; top:5px; z-index:1; }
  [data-dsh-rice-switcher] .dsh-rice-search,
  [data-dsh-rice-switcher] .dsh-rice-new { min-height:44px; }
}

/* The transient switcher adapts from its own inline space. The application
   rail topology stays unchanged; only the secondary New Session label yields
   when this component, rather than the viewport, becomes constrained. */
[data-dsh-rice-switcher] .dsh-rice-panel { container-type:inline-size; }
@container (max-width:520px) {
  [data-dsh-rice-switcher] .dsh-rice-topline { gap:6px; padding-inline:8px; }
  [data-dsh-rice-switcher] .dsh-rice-new { inline-size:44px; min-width:44px; padding-inline:0; font-size:0; }
  [data-dsh-rice-switcher] .dsh-rice-new::before { content:'+'; font-size:18px; line-height:1; }
}
`

const RICE_RAIL_MOTION_CSS = `
/* Physical dogfood rejected whole-glyph zoom, one-shot nudges, and an
   autonomous scanner loop. Sessions and Activity now model hover/focus as a
   reversible state transition: entering advances the semantic parts, holding
   keeps the active pose, and release unwinds from the current rendered state.
   New Session remains on its prior provisional treatment. */
[data-dsh-rice-rail] .dsh-rice-rail-motion-icon { position:relative; z-index:1; display:block; flex:none; }
[data-dsh-rice-rail] .dsh-rice-rail-motion-part { position:absolute; inset:0; display:grid; place-items:center; pointer-events:none; transform:translate3d(0,0,0); }
[data-dsh-rice-rail] .dsh-rice-motion-add-horizontal { clip-path:inset(40% 14% 40% 14%); }
[data-dsh-rice-rail] .dsh-rice-motion-add-vertical { clip-path:inset(14% 40% 14% 40%); }
[data-dsh-rice-rail] .dsh-rice-motion-search-svg,
[data-dsh-rice-rail] .dsh-rice-motion-activity-svg { display:block; width:100%; height:100%; fill:currentColor; }
[data-dsh-rice-rail] .dsh-rice-motion-search-scanner { transform:translate3d(0,0,0); transform-origin:16px 16px; }
[data-dsh-rice-rail] .dsh-rice-motion-search-line { transform:scaleY(1); transform-origin:16px 16px; }
[data-dsh-rice-rail] .dsh-rice-motion-activity-shell-top,
[data-dsh-rice-rail] .dsh-rice-motion-activity-shell-bottom { clip-path:inset(0 0 0 0); }

/* Adapted and modified from Carbon Icon Animations ScanMotion (Apache-2.0).
   The donor geometry and scanner/bar transform relationship are retained, but
   the old autonomous 2s envelope is intentionally replaced by interruptible
   hover/focus state transitions. */
@keyframes dsh-rice-add-horizontal-nudge {
  0%,100% { transform:translate3d(0,0,0); }
  45% { transform:translate3d(1px,0,0); }
}
@keyframes dsh-rice-add-vertical-nudge {
  0%,100% { transform:translate3d(0,0,0); }
  45% { transform:translate3d(0,-1px,0); }
}

@media (prefers-reduced-motion: no-preference) {
  /* Release defaults are intentionally the reverse of the enter stagger. */
  [data-dsh-rice-motion="search"] .dsh-rice-motion-search-scanner { transition:transform 100ms cubic-bezier(.2,0,0,1) 90ms; }
  [data-dsh-rice-motion="search"] .dsh-rice-motion-search-line-1 { transition:transform 100ms cubic-bezier(.2,0,0,1) 60ms; }
  [data-dsh-rice-motion="search"] .dsh-rice-motion-search-line-2 { transition:transform 100ms cubic-bezier(.2,0,0,1) 30ms; }
  [data-dsh-rice-motion="search"] .dsh-rice-motion-search-line-3 { transition:transform 100ms cubic-bezier(.2,0,0,1) 0ms; }
  [data-dsh-rice-motion="search"]:focus-visible .dsh-rice-motion-search-scanner { transform:translate3d(4px,0,0); transition-delay:0ms; }
  [data-dsh-rice-motion="search"]:focus-visible .dsh-rice-motion-search-line-1 { transform:scaleY(1.3); transition-delay:30ms; }
  [data-dsh-rice-motion="search"]:focus-visible .dsh-rice-motion-search-line-2 { transform:scaleY(1.3); transition-delay:60ms; }
  [data-dsh-rice-motion="search"]:focus-visible .dsh-rice-motion-search-line-3 { transform:scaleY(1.3); transition-delay:90ms; }

  [data-dsh-rice-motion="add"]:focus-visible .dsh-rice-motion-add-horizontal { animation:dsh-rice-add-horizontal-nudge 140ms cubic-bezier(.2,0,0,1) 1 both; }
  [data-dsh-rice-motion="add"]:focus-visible .dsh-rice-motion-add-vertical { animation:dsh-rice-add-vertical-nudge 140ms cubic-bezier(.2,0,0,1) 1 both; }

  /* Activity's baseline and waveform are the signal layer and remain visible.
     Only the structural shell participates in the snake-like wipe. */
  [data-dsh-rice-motion="activity"] .dsh-rice-motion-activity-shell-top { transition:clip-path 110ms cubic-bezier(.2,0,0,1) 0ms; }
  [data-dsh-rice-motion="activity"] .dsh-rice-motion-activity-shell-bottom { transition:clip-path 110ms cubic-bezier(.2,0,0,1) 70ms; }
  [data-dsh-rice-motion="activity"]:focus-visible .dsh-rice-motion-activity-shell-bottom { clip-path:inset(0 0 0 100%); transition-delay:0ms; }
  [data-dsh-rice-motion="activity"]:focus-visible .dsh-rice-motion-activity-shell-top { clip-path:inset(0 0 0 100%); transition-delay:70ms; }
}

@media (prefers-reduced-motion: no-preference) and (hover:hover) and (pointer:fine) {
  [data-dsh-rice-motion="search"]:hover .dsh-rice-motion-search-scanner { transform:translate3d(4px,0,0); transition-delay:0ms; }
  [data-dsh-rice-motion="search"]:hover .dsh-rice-motion-search-line-1 { transform:scaleY(1.3); transition-delay:30ms; }
  [data-dsh-rice-motion="search"]:hover .dsh-rice-motion-search-line-2 { transform:scaleY(1.3); transition-delay:60ms; }
  [data-dsh-rice-motion="search"]:hover .dsh-rice-motion-search-line-3 { transform:scaleY(1.3); transition-delay:90ms; }

  [data-dsh-rice-motion="add"]:hover .dsh-rice-motion-add-horizontal { animation:dsh-rice-add-horizontal-nudge 140ms cubic-bezier(.2,0,0,1) 1 both; }
  [data-dsh-rice-motion="add"]:hover .dsh-rice-motion-add-vertical { animation:dsh-rice-add-vertical-nudge 140ms cubic-bezier(.2,0,0,1) 1 both; }

  [data-dsh-rice-motion="activity"]:hover .dsh-rice-motion-activity-shell-bottom { clip-path:inset(0 0 0 100%); transition-delay:0ms; }
  [data-dsh-rice-motion="activity"]:hover .dsh-rice-motion-activity-shell-top { clip-path:inset(0 0 0 100%); transition-delay:70ms; }
}
`

/* Optional dsh-sidebar-qa integration. The floating selection affordance
   already has a stable plugin-owned data host, so it can be presented without
   knowing any CSS-module class name. The AskPanel gets the second data scope
   from the descriptor wrapper below; all selectors then stay inside that
   explicit compatibility boundary. */
const RICE_SIDEBAR_QA_CSS = `
[data-dsh-sidebar-qa] > div { margin-top:-2px; }
[data-dsh-sidebar-qa] button {
  min-height:28px; padding:5px 9px; border:0; border-radius:9px;
  background:var(--dsw-specific-menu); color:var(--dsw-alias-label-primary);
  font:inherit; font-size:12px; line-height:18px; font-weight:600;
  box-shadow:var(--dsw-shadow-lv1); cursor:pointer;
}
[data-dsh-sidebar-qa] button:hover { background:var(--dsw-alias-button-floating-hover); }
[data-dsh-sidebar-qa] button:active { background:var(--dsw-alias-interactive-bg-active); }
[data-dsh-sidebar-qa] button:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }

[data-dsh-rice-sidebar-qa] { height:100%; min-height:0; }
[data-dsh-rice-sidebar-qa] > div { height:100%; min-height:0; }

/* Follow-up identity strip: keep the plugin's active-state semantics, while
   removing the extra card frame and turning New follow-up into a compact
   contextual action. */
[data-dsh-rice-sidebar-qa] > div > div:has(> button):not(:has(> textarea)) {
  gap:4px; padding:6px 8px; border-bottom:0; align-items:center;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> button):not(:has(> textarea)) > button {
  min-height:28px; padding:4px 8px; border-width:0; border-radius:8px;
  box-shadow:none; line-height:18px;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> button):not(:has(> textarea)) > button:hover {
  background:var(--dsw-alias-interactive-bg-hover);
}
[data-dsh-rice-sidebar-qa] > div > div:has(> button):not(:has(> textarea)) > button:last-child {
  inline-size:28px; min-width:28px; padding-inline:0; border:0;
  background:transparent; color:var(--dsw-alias-label-secondary); font-size:0;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> button):not(:has(> textarea)) > button:last-child::before {
  content:'+'; font-size:18px; line-height:1;
}

/* Composer: one seat, one embedded action. Mirror the audited DSH InputBar
   card roles (l2-thin stroke, 22px shape, input-major fill, lv2 elevation)
   instead of inventing a brand-colored focus border. */
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) {
  position:relative; display:block; padding:8px 10px 10px; border-top:0;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > textarea {
  box-sizing:border-box; width:100%; min-height:46px; max-height:160px;
  resize:none; border:1px solid var(--dsw-alias-border-l2-darkmode-thin); border-radius:22px;
  outline:none; background:var(--dsw-specific-input-major); color:var(--dsw-alias-label-primary);
  padding:11px 52px 11px 14px; box-shadow:var(--dsw-shadow-lv2);
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > textarea:focus,
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > textarea:focus-visible {
  border-color:var(--dsw-alias-border-l2-darkmode-thin); outline:none; box-shadow:var(--dsw-shadow-lv2);
}

/* Primary send: use the same optical contract as DSH InputBar.primary — a
   34px circle, info-fill/info-hover, static white, and the exact 16px arrow
   path. The glyph is absolutely centered on the button/circle center instead
   of participating in grid layout, so the 44px coarse hit target cannot move
   the 34px optical glyph relationship. */
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button {
  position:absolute; right:15px; bottom:16px; width:34px; height:34px;
  padding:0; border:0; border-radius:999px;
  background:transparent; color:#fff; font-size:0; line-height:1; box-shadow:none; cursor:pointer;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button::after {
  content:''; position:absolute; inset:0; border-radius:999px;
  background:var(--dsw-alias-button-info-fill); z-index:0;
  transition:background-color 100ms ease;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button::before {
  content:''; position:absolute; left:50%; top:50%; z-index:1; width:16px; height:16px;
  transform:translate(-50%,-50%); pointer-events:none;
  background:url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cpath%20d%3D%27M8.3125%200.980183C8.66767%201.0531%208.97902%201.20418%209.2627%201.43233C9.48724%201.61297%209.73029%201.85793%209.97949%202.10714L14.707%206.83468L13.293%208.24874L9%203.95577V15.0417H7V3.95577L2.70703%208.24874L1.29297%206.83468L6.02051%202.10714C6.26971%201.85793%206.51277%201.61297%206.7373%201.43233C6.97662%201.23986%207.28445%201.04402%207.6875%200.980183C7.8973%200.947006%208.1031%200.95516%208.3125%200.980183Z%27%20fill%3D%27%23fff%27%2F%3E%3C%2Fsvg%3E") center/16px 16px no-repeat;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button:hover:not(:disabled)::after {
  background:var(--dsw-alias-button-info-hover);
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button:focus-visible {
  outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button:disabled {
  opacity:.4; cursor:default;
}

@media (any-pointer: coarse) {
  [data-dsh-sidebar-qa] button { min-width:44px; min-height:44px; padding-inline:12px; }
  [data-dsh-rice-sidebar-qa] > div > div:has(> button):not(:has(> textarea)) > button { min-height:44px; }
  [data-dsh-rice-sidebar-qa] > div > div:has(> button):not(:has(> textarea)) > button:last-child { inline-size:44px; min-width:44px; }
  [data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > textarea { min-height:52px; padding-right:62px; }
  [data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button { right:10px; bottom:11px; width:44px; height:44px; }
  [data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button::after { inset:5px; }
}
`

/**
 * Wrap the sidebar-qa Ask tab in one rice-owned semantic scope. This mutates
 * the registered descriptor in place because better-sidebar 0.12 exposes
 * getTab() but no descriptor-replacement API. The mutation is reversible and
 * guarded by exact descriptor id; no sidebar-qa CSS-module name is consumed.
 */
function attachSidebarQaPresentation(service) {
  if (service === undefined || typeof service.getTab !== 'function') return () => {}
  let descriptor
  let original
  let wrapped

  const restore = () => {
    if (descriptor !== undefined && wrapped !== undefined && descriptor.component === wrapped) {
      descriptor.component = original
    }
    descriptor = undefined
    original = undefined
    wrapped = undefined
  }

  const sync = () => {
    const next = service.getTab('dsh-sidebar-qa:ask')
    if (next === descriptor) return
    restore()
    if (next === undefined || typeof next.component !== 'function') return

    const base = next.component
    function RiceSidebarQaPanel(props) {
      return h('div', { 'data-dsh-rice-sidebar-qa':'' }, h(base, props))
    }

    descriptor = next
    original = base
    wrapped = RiceSidebarQaPanel
    descriptor.component = wrapped
  }

  const unsubscribe = typeof service.subscribe === 'function' ? service.subscribe(sync) : () => {}
  sync()
  return () => {
    unsubscribe()
    restore()
  }
}

/** Dynamically attach only when better-sidebar exists; dsh-rice keeps no hard peer dependency. */
function installSidebarQaPresentation(ctx) {
  if (typeof ctx.inject === 'function') {
    ctx.inject(['betterSidebar'], injectedCtx => attachSidebarQaPresentation(injectedCtx?.betterSidebar ?? ctx.betterSidebar))
    return
  }
  if (ctx.betterSidebar !== undefined && typeof ctx.effect === 'function') {
    ctx.effect(() => attachSidebarQaPresentation(ctx.betterSidebar), 'dsh-rice: optional sidebar-qa presentation')
  }
}

/* Adapted and modified from Carbon Icon Animations ScanMotion (Apache-2.0).
   See THIRD_PARTY_NOTICES.md for source and attribution. */
const RICE_SCAN_MOTION_PATHS = Object.freeze({
  line1:'M15,9h2v14h-2V9z',
  line2:'M21,9h2v14h-2V9z',
  line3:'M27,9h2v14h-2V9z',
  scanner:'M21,29H5c-1.1,0-2-0.9-2-2V5c0-1.1,0.9-2,2-2h16v2H5v22h16V29z',
})

const RICE_BROWSE_ACTIVITY_PATHS = Object.freeze({
  shellTop:'M96-588v-155.85Q96-776 118.56-796q22.57-20 54.25-20h614.5q31.69 0 54.19 20 22.5 20 22.5 52.15V-588h-72v-156H168v156H96Z',
  shellBottom:'M172.69-264q-31.69 0-54.19-20Q96-304 96-336v-180h72v180h624v-180h72v180q0 32-22.56 52-22.57 20-54.25 20h-614.5Z',
  baseline:'M84-144q-15.3 0-25.65-10.29Q48-164.58 48-179.79t10.35-25.71Q68.7-216 84-216h792q15.3 0 25.65 10.29Q912-195.42 912-180.21t-10.35 25.71Q891.3-144 876-144H84Z',
  waveform:'M96-516v-72h233q14 0 25 7t17 18l39 72 112-176q5-8 12.42-12.5 7.43-4.5 16.5-4.5 9.08 0 17.08 3.5 8 3.5 13 10.5l61 82h222v72H629q-11 0-21-5t-17-14l-37-50-116 184q-5 8-13.06 12.5-8.07 4.5-16.94 4.5-9.9 0-18.45-5.5Q381-395 376-403l-62-113H96Z',
})

function riceRailMotionKind(iconPath) {
  if (iconPath === MATERIAL_SYMBOL_PATHS.search) return 'search'
  if (iconPath === MATERIAL_SYMBOL_PATHS.add) return 'add'
  if (iconPath === MATERIAL_SYMBOL_PATHS.browseActivity) return 'activity'
  return undefined
}

function riceRailMotionPart(key, className, iconPath, iconSize) {
  return h('span', { key, className:`dsh-rice-rail-motion-part ${className}`, 'aria-hidden':true },
    h(MaterialSymbol, { path:iconPath, size:iconSize }))
}

function RiceRailMotionIcon({ iconPath, iconSize, motion }) {
  if (motion === 'search') {
    return h('span', {
      className:'dsh-rice-rail-motion-icon dsh-rice-rail-motion-search',
      style:{ width:iconSize, height:iconSize },
      'aria-hidden':true,
    }, h('svg', {
      className:'dsh-rice-rail-icon dsh-rice-motion-search-svg',
      width:iconSize,
      height:iconSize,
      viewBox:'0 0 32 32',
      fill:'currentColor',
      focusable:'false',
      'aria-hidden':true,
    }, [
      h('path', { key:'line1', className:'dsh-rice-motion-search-line dsh-rice-motion-search-line-1', d:RICE_SCAN_MOTION_PATHS.line1 }),
      h('path', { key:'line2', className:'dsh-rice-motion-search-line dsh-rice-motion-search-line-2', d:RICE_SCAN_MOTION_PATHS.line2 }),
      h('path', { key:'line3', className:'dsh-rice-motion-search-line dsh-rice-motion-search-line-3', d:RICE_SCAN_MOTION_PATHS.line3 }),
      h('path', { key:'scanner', className:'dsh-rice-motion-search-scanner', d:RICE_SCAN_MOTION_PATHS.scanner }),
    ]))
  }

  if (motion === 'activity') {
    return h('span', {
      className:'dsh-rice-rail-motion-icon dsh-rice-rail-motion-activity',
      style:{ width:iconSize, height:iconSize },
      'aria-hidden':true,
    }, h('svg', {
      className:'dsh-rice-rail-icon dsh-rice-motion-activity-svg',
      width:iconSize,
      height:iconSize,
      viewBox:'0 -960 960 960',
      fill:'currentColor',
      focusable:'false',
      'aria-hidden':true,
    }, [
      h('path', { key:'shell-top', className:'dsh-rice-motion-activity-shell-top', d:RICE_BROWSE_ACTIVITY_PATHS.shellTop }),
      h('path', { key:'shell-bottom', className:'dsh-rice-motion-activity-shell-bottom', d:RICE_BROWSE_ACTIVITY_PATHS.shellBottom }),
      h('path', { key:'baseline', className:'dsh-rice-motion-activity-baseline', d:RICE_BROWSE_ACTIVITY_PATHS.baseline }),
      h('path', { key:'waveform', className:'dsh-rice-motion-activity-waveform', d:RICE_BROWSE_ACTIVITY_PATHS.waveform }),
    ]))
  }

  const parts = [
    riceRailMotionPart('horizontal', 'dsh-rice-motion-add-horizontal', iconPath, iconSize),
    riceRailMotionPart('vertical', 'dsh-rice-motion-add-vertical', iconPath, iconSize),
  ]
  return h('span', {
    className:`dsh-rice-rail-motion-icon dsh-rice-rail-motion-${motion}`,
    style:{ width:iconSize, height:iconSize },
    'aria-hidden':true,
  }, parts)
}

RailButton = function RiceAnimatedRailButton({ label, iconPath, iconSize = 20, badge, onClick }) {
  const motion = riceRailMotionKind(iconPath)
  return h('button', {
    type:'button',
    className:'dsh-rice-rail-button',
    'data-dsh-rice-motion':motion,
    'aria-label':label,
    title:label,
    onClick,
  }, [
    motion === undefined
      ? h(MaterialSymbol, { key:'icon', path:iconPath, size:iconSize })
      : h(RiceRailMotionIcon, { key:'icon', iconPath, iconSize, motion }),
    badge > 0 ? h('span', { key:'badge', className:'dsh-rice-badge' }, badge > 99 ? '99+' : String(badge)) : null,
  ])
}

/** Distinguish duplicate visible rows in the polite live-region announcement. */
activeAnnouncement = function riceActiveAnnouncement(row) {
  if (row === undefined) return ''
  const status = statusLabel(row)
  const identity = `session ${row.id}`
  return status === '' ? `${row.title}, ${identity}` : `${row.title}, ${status}, ${identity}`
}

/** Carry bounded compatibility plus adaptive interaction rules with the rail. */
ApplicationRail = function RiceApplicationRail(props) {
  return h(React.Fragment, null, [
    h('style', { key:'presentation-compat' }, `${RICE_COMPAT_CSS}\n${RICE_ADAPTIVE_CSS}\n${RICE_SIDEBAR_QA_CSS}\n${RICE_RAIL_MOTION_CSS}`),
    h(RiceApplicationRailBase, { ...props, key:'rail' }),
  ])
}

/** Escape closes the modal from any focused descendant; other keys pass through untouched. */
QuickSwitcherOverlay = function RiceQuickSwitcherOverlay(props) {
  const onKeyDownCapture = event => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    props.uiState.close()
  }
  return h('div', { style:{ display:'contents' }, onKeyDownCapture }, h(RiceQuickSwitcherOverlayBase, props))
}

/** Preserve the base rice application and add only the optional compatibility adapter. */
apply = function RiceApply(ctx) {
  RiceApplyBase(ctx)
  installSidebarQaPresentation(ctx)
}