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

/** Distinguish duplicate visible rows in the polite live-region announcement. */
activeAnnouncement = function riceActiveAnnouncement(row) {
  if (row === undefined) return ''
  const status = statusLabel(row)
  const identity = `session ${row.id}`
  return status === '' ? `${row.title}, ${identity}` : `${row.title}, ${status}, ${identity}`
}

/** Carry bounded upstream presentation compatibility rules with the rail. */
ApplicationRail = function RiceApplicationRail(props) {
  return h(React.Fragment, null, [
    h('style', { key:'presentation-compat' }, RICE_COMPAT_CSS),
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
