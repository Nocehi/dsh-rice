/**
 * Small browser postlude for compatibility/a11y behavior that must wrap the
 * v0 presentation components without adding another platform-module require.
 * The repo builder concatenates this file after src/client.js in the same
 * namespace-module factory, so these wrappers reuse the existing DSH runtime
 * and React identity.
 */
const RiceApplicationRailBase = ApplicationRail
const RiceQuickSwitcherOverlayBase = QuickSwitcherOverlay

const RICE_COMPAT_CSS = `
span[role="tooltip"] { color:var(--dsw-alias-label-primary-inverted); }
/* rc.6 blank-session hero: keep upstream geometry/opacity, but let the DSH
   semantic theme own the ambient hue and Preview accent. */
[data-phase="hero"] [data-composer-seat] svg[viewBox="0 0 1051 468"] { color:var(--dsw-alias-state-business-primary); }
[data-phase="hero"] [data-composer-seat] svg[viewBox="0 0 1051 468"] ellipse { fill:currentColor; }
[data-phase="hero"] [data-composer-seat] div:has(> span:first-child > svg[viewBox="0 0 23.16 17.04"]) { position:relative; grid-template-columns:34px auto 0; transform:translateX(5px); }
[data-phase="hero"] [data-composer-seat] div:has(> span:first-child > svg[viewBox="0 0 23.16 17.04"]) > span:nth-child(3) { position:absolute; justify-self:start; background:transparent; color:var(--dsw-alias-state-business-tertiary); border-color:var(--dsw-alias-border-l2-darkmode-thin); }
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
    h('style', { key:'presentation-compat' }, `${RICE_COMPAT_CSS}\n${RICE_ADAPTIVE_CSS}`),
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
