/**
 * Small browser postlude for compatibility/a11y behavior that must wrap the
 * v0 presentation components without adding another platform-module require.
 * The repo builder concatenates this file after src/client.js in the same
 * namespace-module factory, so these wrappers reuse the existing DSH runtime
 * and React identity.
 */
const RiceApplicationRailBase = ApplicationRail
const RiceQuickSwitcherOverlayBase = QuickSwitcherOverlay

/** Distinguish duplicate visible rows in the polite live-region announcement. */
activeAnnouncement = function riceActiveAnnouncement(row) {
  if (row === undefined) return ''
  const status = statusLabel(row)
  const identity = `session ${row.id}`
  return status === '' ? `${row.title}, ${identity}` : `${row.title}, ${status}, ${identity}`
}

/** Carry the rc.6 semantic tooltip foreground compatibility rule with the rail. */
ApplicationRail = function RiceApplicationRail(props) {
  return h(React.Fragment, null, [
    h('style', { key:'tooltip-compat' }, 'span[role="tooltip"] { color:var(--dsw-alias-label-primary-inverted); }'),
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
