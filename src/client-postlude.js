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

/* Composer: one seat, one embedded action. The original textarea/button stay
   in the DOM with their keyboard behavior and accessible text unchanged. */
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) {
  position:relative; display:block; padding:8px 10px 10px; border-top:0;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > textarea {
  box-sizing:border-box; width:100%; min-height:46px; max-height:160px;
  resize:none; border:0; border-radius:14px;
  background:var(--dsw-specific-selector); color:var(--dsw-alias-label-primary);
  padding:11px 52px 11px 12px; box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2);
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > textarea:focus {
  outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-2px;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button {
  position:absolute; right:16px; bottom:17px; width:32px; height:32px;
  display:grid; place-items:center; padding:0; border:0; border-radius:10px;
  background:var(--dsw-alias-brand-primary); color:var(--dsw-alias-label-primary-foreground);
  font-size:0; line-height:1; box-shadow:none; cursor:pointer;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button::before {
  content:'↑'; font-size:18px; line-height:1;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button:hover:not(:disabled) {
  background:var(--dsw-alias-button-floating-hover); color:var(--dsw-alias-label-primary);
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button:focus-visible {
  outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px;
}
[data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button:disabled {
  opacity:.45; cursor:default;
}

@media (any-pointer: coarse) {
  [data-dsh-sidebar-qa] button { min-width:44px; min-height:44px; padding-inline:12px; }
  [data-dsh-rice-sidebar-qa] > div > div:has(> button):not(:has(> textarea)) > button { min-height:44px; }
  [data-dsh-rice-sidebar-qa] > div > div:has(> button):not(:has(> textarea)) > button:last-child { inline-size:44px; min-width:44px; }
  [data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > textarea { min-height:52px; padding-right:58px; }
  [data-dsh-rice-sidebar-qa] > div > div:has(> textarea) > button { right:14px; bottom:12px; width:44px; height:44px; }
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
    h('style', { key:'presentation-compat' }, `${RICE_COMPAT_CSS}\n${RICE_ADAPTIVE_CSS}\n${RICE_SIDEBAR_QA_CSS}`),
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
