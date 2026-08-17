/**
 * Isolated surface-topology prototype for the transient Sessions / Activity
 * switcher. This file is concatenated after client-postlude.js, so it can wrap
 * the already-rice-owned rail and overlay without adding another platform
 * module or runtime dependency.
 *
 * The liquid layer is presentation-only: a filtered SVG silhouette sits
 * between the existing backdrop and the real dialog DOM. Text, controls,
 * focus, ARIA, hit targets, and command behavior remain on the real DOM.
 */
const RiceSurfaceMorphRailButtonBase = RailButton
const RiceSurfaceMorphApplicationRailBase = ApplicationRail

const RICE_SURFACE_MORPH_FRESH_MS = 500
const RICE_SURFACE_MORPH_LIFETIME_MS = 340

const RICE_SURFACE_MORPH_CSS = `
[data-dsh-rice-surface-morph-layer] {
  position:fixed; inset:0; width:100vw; height:100vh; overflow:visible;
  pointer-events:none;
}
[data-dsh-rice-surface-morph-layer] .dsh-rice-surface-morph-goo {
  color:var(--dsw-specific-menu);
}
[data-dsh-rice-surface-morph-layer] .dsh-rice-surface-morph-origin,
[data-dsh-rice-surface-morph-layer] .dsh-rice-surface-morph-target {
  fill:currentColor;
  transform-box:fill-box;
  transform-origin:center;
}
[data-dsh-rice-surface-morph-layer] .dsh-rice-surface-morph-tether {
  fill:none; stroke:currentColor; stroke-linecap:round;
  stroke-dasharray:1; stroke-dashoffset:1;
}
[data-dsh-rice-surface-morph-layer] .dsh-rice-surface-morph-target {
  transform:translate(var(--dsh-rice-morph-dx),var(--dsh-rice-morph-dy))
            scale(var(--dsh-rice-morph-sx),var(--dsh-rice-morph-sy));
}

@keyframes dsh-rice-surface-origin-release {
  0%,32% { opacity:1; transform:scale(1); }
  74% { opacity:.76; transform:scale(.82); }
  100% { opacity:0; transform:scale(.58); }
}
@keyframes dsh-rice-surface-tether-grow {
  0% { opacity:.9; stroke-dashoffset:1; stroke-width:28px; }
  58% { opacity:1; stroke-dashoffset:0; stroke-width:24px; }
  82% { opacity:.72; stroke-dashoffset:0; stroke-width:16px; }
  100% { opacity:0; stroke-dashoffset:0; stroke-width:8px; }
}
@keyframes dsh-rice-surface-target-arrive {
  0% {
    opacity:.96;
    transform:translate(var(--dsh-rice-morph-dx),var(--dsh-rice-morph-dy))
              scale(var(--dsh-rice-morph-sx),var(--dsh-rice-morph-sy));
  }
  68% { opacity:1; transform:translate(0,0) scale(1.014,.986); }
  86% { opacity:1; transform:translate(0,0) scale(1); }
  100% { opacity:0; transform:translate(0,0) scale(1); }
}
@keyframes dsh-rice-surface-panel-handoff {
  0%,30% { opacity:0; }
  100% { opacity:1; }
}

@media (prefers-reduced-motion: no-preference) {
  [data-dsh-rice-surface-morph-layer] .dsh-rice-surface-morph-origin {
    animation:dsh-rice-surface-origin-release 300ms cubic-bezier(.2,0,0,1) both;
  }
  [data-dsh-rice-surface-morph-layer] .dsh-rice-surface-morph-tether {
    animation:dsh-rice-surface-tether-grow 300ms cubic-bezier(.2,0,0,1) both;
  }
  [data-dsh-rice-surface-morph-layer] .dsh-rice-surface-morph-target {
    animation:dsh-rice-surface-target-arrive 300ms cubic-bezier(.2,0,0,1) both;
  }
  [data-dsh-rice-surface-morph="true"] .dsh-rice-panel {
    animation:dsh-rice-surface-panel-handoff 300ms cubic-bezier(.2,0,0,1) both;
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-dsh-rice-surface-morph-layer] { display:none; }
  [data-dsh-rice-surface-morph="true"] .dsh-rice-panel { animation:none; }
}
`

let riceSurfaceMorphAnchor
let riceSurfaceMorphSequence = 0

function riceSurfaceMorphNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

function riceSurfaceMorphRect(rect) {
  return Object.freeze({
    left:rect.left,
    top:rect.top,
    right:rect.right,
    bottom:rect.bottom,
    width:rect.width,
    height:rect.height,
  })
}

function riceSurfaceMorphOpticalRect(rect) {
  const width = Math.min(36, rect.width)
  const height = Math.min(36, rect.height)
  const left = rect.left + (rect.width - width) / 2
  const top = rect.top + (rect.height - height) / 2
  return Object.freeze({
    left,
    top,
    right:left + width,
    bottom:top + height,
    width,
    height,
  })
}

function riceArmSurfaceMorph(element, motion) {
  if ((motion !== 'search' && motion !== 'activity') || typeof element?.getBoundingClientRect !== 'function') return
  riceSurfaceMorphAnchor = Object.freeze({
    motion,
    at:riceSurfaceMorphNow(),
    rect:riceSurfaceMorphOpticalRect(element.getBoundingClientRect()),
  })
}

function ricePeekSurfaceMorphAnchor() {
  const anchor = riceSurfaceMorphAnchor
  if (anchor === undefined) return undefined
  if (riceSurfaceMorphNow() - anchor.at <= RICE_SURFACE_MORPH_FRESH_MS) return anchor
  riceSurfaceMorphAnchor = undefined
  return undefined
}

function riceConsumeSurfaceMorphAnchor() {
  const anchor = ricePeekSurfaceMorphAnchor()
  riceSurfaceMorphAnchor = undefined
  return anchor
}

function riceClamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function riceNearestPanelPoint(anchor, target) {
  const ax = (anchor.left + anchor.right) / 2
  const ay = (anchor.top + anchor.bottom) / 2
  const insetX = Math.min(20, target.width / 2)
  const insetY = Math.min(20, target.height / 2)
  const candidates = [
    { x:target.left, y:riceClamp(ay, target.top + insetY, target.bottom - insetY) },
    { x:target.right, y:riceClamp(ay, target.top + insetY, target.bottom - insetY) },
    { x:riceClamp(ax, target.left + insetX, target.right - insetX), y:target.top },
    { x:riceClamp(ax, target.left + insetX, target.right - insetX), y:target.bottom },
  ]
  let best = candidates[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const dx = candidate.x - ax
    const dy = candidate.y - ay
    const distance = dx * dx + dy * dy
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return best
}

function RiceSurfaceMorphLayer({ morph }) {
  const { anchor, target, motion } = morph
  const ax = (anchor.left + anchor.right) / 2
  const ay = (anchor.top + anchor.bottom) / 2
  const txCenter = (target.left + target.right) / 2
  const tyCenter = (target.top + target.bottom) / 2
  const endpoint = riceNearestPanelPoint(anchor, target)
  const dx = endpoint.x - ax
  const dy = endpoint.y - ay
  const path = `M${ax} ${ay} C${ax + dx * .42} ${ay}, ${endpoint.x - dx * .22} ${endpoint.y}, ${endpoint.x} ${endpoint.y}`
  const style = {
    '--dsh-rice-morph-dx':`${ax - txCenter}px`,
    '--dsh-rice-morph-dy':`${ay - tyCenter}px`,
    '--dsh-rice-morph-sx':String(Math.max(.03, anchor.width / target.width)),
    '--dsh-rice-morph-sy':String(Math.max(.03, anchor.height / target.height)),
  }
  return h('svg', {
    'data-dsh-rice-surface-morph-layer':'',
    'data-origin':motion,
    className:'dsh-rice-surface-morph-layer',
    width:window.innerWidth,
    height:window.innerHeight,
    viewBox:`0 0 ${window.innerWidth} ${window.innerHeight}`,
    preserveAspectRatio:'none',
    focusable:'false',
    'aria-hidden':true,
  }, [
    h('defs', { key:'defs' }, h('filter', {
      id:'dsh-rice-surface-goo',
      x:'-30%', y:'-30%', width:'160%', height:'160%',
      colorInterpolationFilters:'sRGB',
    }, [
      h('feGaussianBlur', { key:'blur', in:'SourceGraphic', stdDeviation:'7', result:'blur' }),
      h('feColorMatrix', {
        key:'matrix',
        in:'blur',
        mode:'matrix',
        values:'1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7',
        result:'goo',
      }),
      h('feBlend', { key:'blend', in:'SourceGraphic', in2:'goo' }),
    ])),
    h('g', { key:'goo', className:'dsh-rice-surface-morph-goo', filter:'url(#dsh-rice-surface-goo)' }, [
      h('rect', {
        key:'origin',
        className:'dsh-rice-surface-morph-origin',
        x:anchor.left, y:anchor.top, width:anchor.width, height:anchor.height,
        rx:12, ry:12,
      }),
      h('path', {
        key:'tether',
        className:'dsh-rice-surface-morph-tether',
        d:path,
        pathLength:1,
      }),
      h('rect', {
        key:'target',
        className:'dsh-rice-surface-morph-target',
        x:target.left, y:target.top, width:target.width, height:target.height,
        rx:20, ry:20,
        style,
      }),
    ]),
  ])
}

RailButton = function RiceSurfaceMorphRailButton(props) {
  const motion = riceRailMotionKind(props.iconPath)
  if (motion !== 'search' && motion !== 'activity') {
    return h(RiceSurfaceMorphRailButtonBase, props)
  }
  const onClick = event => {
    riceArmSurfaceMorph(event.currentTarget, motion)
    props.onClick?.(event)
  }
  return h(RiceSurfaceMorphRailButtonBase, { ...props, onClick })
}

ApplicationRail = function RiceSurfaceMorphApplicationRail(props) {
  return h(React.Fragment, null, [
    h('style', { key:'surface-morph' }, RICE_SURFACE_MORPH_CSS),
    h(RiceSurfaceMorphApplicationRailBase, { ...props, key:'rail' }),
  ])
}

QuickSwitcherOverlay = function RiceSurfaceMorphQuickSwitcherOverlay(props) {
  /*
   * Invoke the original switcher function unconditionally so its existing hook
   * order remains stable, then clone only the root presentation element.
   * client-postlude's dialog-wide Escape behavior is reproduced below.
   */
  const base = RiceQuickSwitcherOverlayBase(props)
  const ui = props.uiState.getSnapshot()
  const [morph, setMorph] = React.useState(null)
  const wasOpenRef = React.useRef(false)

  React.useLayoutEffect(() => {
    if (!ui.open) {
      wasOpenRef.current = false
      setMorph(null)
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true
    const anchor = riceConsumeSurfaceMorphAnchor()
    if (anchor === undefined) return
    const panel = document.querySelector('[data-dsh-rice-switcher] .dsh-rice-panel')
    if (panel === null) return
    const target = riceSurfaceMorphRect(panel.getBoundingClientRect())
    if (target.width <= 0 || target.height <= 0) return
    const id = ++riceSurfaceMorphSequence
    setMorph(Object.freeze({ id, motion:anchor.motion, anchor:anchor.rect, target }))
    const timer = window.setTimeout(() => {
      setMorph(current => current?.id === id ? null : current)
    }, RICE_SURFACE_MORPH_LIFETIME_MS)
    return () => { window.clearTimeout(timer) }
  }, [ui.open])

  if (base === null) return null

  const armed = ui.open && ricePeekSurfaceMorphAnchor() !== undefined
  const active = armed || morph !== null
  let overlay = base
  if (active) {
    const children = React.Children.toArray(base.props.children)
    const panelIndex = children.findIndex(child => child?.props?.className === 'dsh-rice-panel')
    if (morph !== null && panelIndex >= 0) {
      children.splice(panelIndex, 0, h(RiceSurfaceMorphLayer, { key:`surface:${morph.id}`, morph }))
    }
    overlay = React.cloneElement(base, { 'data-dsh-rice-surface-morph':'true' }, children)
  }

  const onKeyDownCapture = event => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    props.uiState.close()
  }
  return h('div', { style:{ display:'contents' }, onKeyDownCapture }, overlay)
}
