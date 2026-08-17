/**
 * Proximity-gated surface-continuity experiment.
 *
 * This file is concatenated after client-postlude.js. It intentionally stays
 * inside dsh-rice: host surfaces participate through standards-based DOM
 * relations, while dsh-better-sidebar is observed only through its public
 * `betterSidebar` client service.
 */
const RICE_LOCAL_SURFACE_DISTANCE_PX = 56
const RICE_LOCAL_SURFACE_STYLE_ID = 'dsh-rice-local-surface-style'
const RICE_LOCAL_SURFACE_TRIGGER_SELECTOR = '[aria-controls][aria-expanded], summary'
const RICE_LOCAL_SURFACE_SETTLE_FRAMES = 18
const RICE_LOCAL_SURFACE_CSS = `
.rice-local-surface-bridge {
  position: fixed;
  z-index: 2147483000;
  height: 8px;
  min-width: 8px;
  box-sizing: border-box;
  pointer-events: none;
  opacity: 0;
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin);
  border-radius: 999px;
  background: var(--dsw-specific-menu);
  box-shadow: var(--dsw-shadow-lv1);
  transform-origin: center;
  transition: opacity 140ms cubic-bezier(.2, 0, 0, 1);
}
.rice-local-surface-bridge[data-active="true"] {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .rice-local-surface-bridge {
    transition: none;
  }
}
`

function riceLocalSurfaceGap(a, b) {
  const dx = Math.max(a.left - b.right, b.left - a.right, 0)
  const dy = Math.max(a.top - b.bottom, b.top - a.bottom, 0)
  return Math.hypot(dx, dy)
}

function riceFacingAxisPoints(aMin, aMax, bMin, bMax) {
  if (aMax < bMin) return [aMax, bMin]
  if (bMax < aMin) return [aMin, bMax]

  const overlapStart = Math.max(aMin, bMin)
  const overlapEnd = Math.min(aMax, bMax)
  const center = (overlapStart + overlapEnd) / 2
  return [center, center]
}

function riceLocalSurfaceGeometry(sourceRect, targetRect) {
  const [sourceX, targetX] = riceFacingAxisPoints(
    sourceRect.left,
    sourceRect.right,
    targetRect.left,
    targetRect.right,
  )
  const [sourceY, targetY] = riceFacingAxisPoints(
    sourceRect.top,
    sourceRect.bottom,
    targetRect.top,
    targetRect.bottom,
  )
  const distance = Math.hypot(targetX - sourceX, targetY - sourceY)

  return {
    sourceX,
    sourceY,
    targetX,
    targetY,
    distance,
    left: (sourceX + targetX) / 2,
    top: (sourceY + targetY) / 2,
    angle: Math.atan2(targetY - sourceY, targetX - sourceX),
  }
}

function riceLocalSurfaceVisible(element) {
  return Boolean(
    element &&
      element.isConnected &&
      typeof element.getClientRects === 'function' &&
      element.getClientRects().length > 0,
  )
}

function riceLocalSurfaceHover(element) {
  if (!element || typeof element.matches !== 'function') return false
  try {
    return element.matches(':hover')
  } catch {
    return false
  }
}

function riceLocalSurfaceFindTrigger(node, doc) {
  const ElementCtor = doc.defaultView?.Element
  if (ElementCtor && !(node instanceof ElementCtor)) return null
  if (!node || typeof node.closest !== 'function') return null
  return node.closest(RICE_LOCAL_SURFACE_TRIGGER_SELECTOR)
}

function riceLocalSurfaceDetailsTarget(summary) {
  const details = summary?.closest?.('details')
  if (!details?.open) return null

  let candidate = summary.nextElementSibling
  while (candidate) {
    if (riceLocalSurfaceVisible(candidate)) return candidate
    candidate = candidate.nextElementSibling
  }

  return riceLocalSurfaceVisible(details) ? details : null
}

function riceLocalSurfaceControlledTargets(source, doc) {
  const ids = (source.getAttribute?.('aria-controls') ?? '')
    .trim()
    .split(/\s+/u)
    .filter(Boolean)

  return ids
    .map(id => doc.getElementById(id))
    .filter(riceLocalSurfaceVisible)
}

function riceLocalSurfaceChooseTarget(source, doc) {
  if (!source?.isConnected) return null
  if (source.tagName === 'SUMMARY') return riceLocalSurfaceDetailsTarget(source)

  const candidates = riceLocalSurfaceControlledTargets(source, doc)
  if (candidates.length <= 1) return candidates[0] ?? null

  const sourceRect = source.getBoundingClientRect()
  let bestTarget = null
  let bestGap = Infinity

  for (const candidate of candidates) {
    const gap = riceLocalSurfaceGap(sourceRect, candidate.getBoundingClientRect())
    if (gap < bestGap) {
      bestGap = gap
      bestTarget = candidate
    }
  }

  return bestTarget
}

function riceLocalSurfaceExpanded(source) {
  if (!source) return false
  if (source.tagName === 'SUMMARY') return Boolean(source.closest?.('details')?.open)
  return source.getAttribute?.('aria-expanded') === 'true'
}

function riceLocalSurfaceFocused(source, target, doc) {
  const active = doc.activeElement
  if (!active) return false

  return Boolean(
    active === source ||
      source?.contains?.(active) ||
      active === target ||
      target?.contains?.(active),
  )
}

function riceLocalSurfaceIntentional(source, target, doc) {
  return Boolean(
    riceLocalSurfaceExpanded(source) ||
      riceLocalSurfaceHover(source) ||
      riceLocalSurfaceHover(target) ||
      riceLocalSurfaceFocused(source, target, doc),
  )
}

function riceInstallLocalSurfaceStyle(doc) {
  if (doc.getElementById(RICE_LOCAL_SURFACE_STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = RICE_LOCAL_SURFACE_STYLE_ID
  style.textContent = RICE_LOCAL_SURFACE_CSS
  ;(doc.head || doc.documentElement).append(style)
}

function riceInstallLocalSurfaceContinuity(doc) {
  const win = doc.defaultView
  if (!win || !doc.documentElement) return () => {}

  riceInstallLocalSurfaceStyle(doc)

  const bridge = doc.createElement('div')
  bridge.className = 'rice-local-surface-bridge'
  bridge.setAttribute('aria-hidden', 'true')
  ;(doc.body || doc.documentElement).append(bridge)

  const root = doc.documentElement
  let source = null
  let target = null
  let frameId = 0
  let settleFrames = 0
  let resizeObserver = null

  function clearMarks() {
    source?.removeAttribute?.('data-rice-local-surface-source')
    target?.removeAttribute?.('data-rice-local-surface-target')
    root.removeAttribute('data-rice-local-surface-engaged')
    root.style.removeProperty('--rice-local-surface-gap')
    bridge.removeAttribute('data-active')
  }

  function observePair() {
    resizeObserver?.disconnect?.()
    if (typeof win.ResizeObserver !== 'function') return

    resizeObserver = new win.ResizeObserver(() => schedule(false))
    if (source?.isConnected) resizeObserver.observe(source)
    if (target?.isConnected) resizeObserver.observe(target)
  }

  function dropPair() {
    clearMarks()
    resizeObserver?.disconnect?.()
    resizeObserver = null
    source = null
    target = null
    settleFrames = 0
  }

  function applyBridgeGeometry(geometry) {
    bridge.style.left = `${geometry.left}px`
    bridge.style.top = `${geometry.top}px`
    bridge.style.width = `${Math.max(geometry.distance + 8, 8)}px`
    bridge.style.transform = `translate(-50%, -50%) rotate(${geometry.angle}rad)`
  }

  function render() {
    frameId = 0

    if (!source?.isConnected) {
      dropPair()
      return
    }

    if (!riceLocalSurfaceIntentional(source, target, doc)) {
      dropPair()
      return
    }

    const nextTarget = riceLocalSurfaceChooseTarget(source, doc)
    if (nextTarget !== target) {
      target?.removeAttribute?.('data-rice-local-surface-target')
      target = nextTarget
      observePair()
    }

    if (!target?.isConnected) {
      clearMarks()
      if (settleFrames > 0) {
        settleFrames -= 1
        schedule(false)
      }
      return
    }

    const sourceRect = source.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const geometry = riceLocalSurfaceGeometry(sourceRect, targetRect)
    const engaged = geometry.distance <= RICE_LOCAL_SURFACE_DISTANCE_PX

    clearMarks()
    if (engaged) {
      source.setAttribute('data-rice-local-surface-source', 'true')
      target.setAttribute('data-rice-local-surface-target', 'true')
      root.setAttribute('data-rice-local-surface-engaged', 'true')
      root.style.setProperty('--rice-local-surface-gap', `${geometry.distance}px`)

      if (geometry.distance > 0.5) {
        applyBridgeGeometry(geometry)
        bridge.setAttribute('data-active', 'true')
      }
    }

    if (settleFrames > 0) {
      settleFrames -= 1
      schedule(false)
    }
  }

  function schedule(settle = false) {
    if (settle) settleFrames = Math.max(settleFrames, RICE_LOCAL_SURFACE_SETTLE_FRAMES)
    if (!frameId) frameId = win.requestAnimationFrame(render)
  }

  function activate(nextSource) {
    if (!nextSource?.isConnected) return
    if (nextSource !== source) {
      clearMarks()
      resizeObserver?.disconnect?.()
      resizeObserver = null
      source = nextSource
      target = null
    }
    observePair()
    schedule(true)
  }

  function onPointerOver(event) {
    const trigger = riceLocalSurfaceFindTrigger(event.target, doc)
    if (trigger) {
      activate(trigger)
      return
    }
    if (target?.contains?.(event.target)) schedule(false)
  }

  function onFocusIn(event) {
    const trigger = riceLocalSurfaceFindTrigger(event.target, doc)
    if (trigger) {
      activate(trigger)
      return
    }
    if (target?.contains?.(event.target)) schedule(false)
  }

  function onInteractionOut() {
    schedule(false)
  }

  function onClick(event) {
    const trigger = riceLocalSurfaceFindTrigger(event.target, doc)
    if (trigger) activate(trigger)
  }

  doc.addEventListener('pointerover', onPointerOver, true)
  doc.addEventListener('pointerout', onInteractionOut, true)
  doc.addEventListener('focusin', onFocusIn, true)
  doc.addEventListener('focusout', onInteractionOut, true)
  doc.addEventListener('click', onClick, true)
  doc.addEventListener('scroll', onInteractionOut, true)
  win.addEventListener('resize', onInteractionOut, { passive: true })

  const mutationObserver = new win.MutationObserver(() => schedule(true))
  mutationObserver.observe(doc.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-controls', 'aria-expanded', 'open'],
  })

  return () => {
    if (frameId) win.cancelAnimationFrame(frameId)
    mutationObserver.disconnect()
    resizeObserver?.disconnect?.()
    doc.removeEventListener('pointerover', onPointerOver, true)
    doc.removeEventListener('pointerout', onInteractionOut, true)
    doc.removeEventListener('focusin', onFocusIn, true)
    doc.removeEventListener('focusout', onInteractionOut, true)
    doc.removeEventListener('click', onClick, true)
    doc.removeEventListener('scroll', onInteractionOut, true)
    win.removeEventListener('resize', onInteractionOut)
    dropPair()
    bridge.remove()
  }
}

function riceAttachBetterSidebarSurfaceState(service, doc) {
  if (
    !service ||
    typeof service.getSnapshot !== 'function' ||
    typeof service.subscribeState !== 'function'
  ) {
    return () => {}
  }

  const root = doc.documentElement

  function clearState() {
    root.removeAttribute('data-rice-better-sidebar-panel-open')
    root.removeAttribute('data-rice-better-sidebar-bottom-open')
    root.removeAttribute('data-rice-better-sidebar-mode')
    root.removeAttribute('data-rice-better-sidebar-maximized')
    root.style.removeProperty('--rice-better-sidebar-width')
    root.style.removeProperty('--rice-better-sidebar-bottom-height')
  }

  function applySnapshot(snapshot) {
    const state = snapshot?.state ?? {}
    const panelOpen = Boolean(state.panelOpen)
    const bottomOpen = Boolean(state.bottomOpen)
    const mode = panelOpen && bottomOpen
      ? 'split'
      : panelOpen
        ? 'side'
        : bottomOpen
          ? 'bottom'
          : 'closed'

    root.toggleAttribute('data-rice-better-sidebar-panel-open', panelOpen)
    root.toggleAttribute('data-rice-better-sidebar-bottom-open', bottomOpen)
    root.setAttribute('data-rice-better-sidebar-mode', mode)

    if (typeof state.maximized === 'string' && state.maximized) {
      root.setAttribute('data-rice-better-sidebar-maximized', state.maximized)
    } else {
      root.removeAttribute('data-rice-better-sidebar-maximized')
    }

    const width = Number(state.width)
    if (Number.isFinite(width) && width >= 0) {
      root.style.setProperty('--rice-better-sidebar-width', `${width}px`)
    } else {
      root.style.removeProperty('--rice-better-sidebar-width')
    }

    const bottomHeight = Number(state.bottomHeight)
    if (Number.isFinite(bottomHeight) && bottomHeight >= 0) {
      root.style.setProperty('--rice-better-sidebar-bottom-height', `${bottomHeight}px`)
    } else {
      root.style.removeProperty('--rice-better-sidebar-bottom-height')
    }
  }

  function refresh() {
    applySnapshot(service.getSnapshot())
  }

  refresh()
  const unsubscribe = service.subscribeState(refresh)

  return () => {
    if (typeof unsubscribe === 'function') unsubscribe()
    clearState()
  }
}

function riceInstallBetterSidebarSurfaceState(ctx, doc) {
  if (!ctx || typeof ctx.inject !== 'function') return

  ctx.inject(['betterSidebar'], injectedCtx =>
    riceAttachBetterSidebarSurfaceState(
      injectedCtx?.betterSidebar ?? ctx.betterSidebar,
      doc,
    ),
  )
}

const RiceLocalSurfaceApplyBase = apply
apply = function RiceApplyWithLocalSurface(ctx) {
  RiceLocalSurfaceApplyBase(ctx)
  if (typeof document === 'undefined') return

  if (ctx && typeof ctx.effect === 'function') {
    ctx.effect(() => riceInstallLocalSurfaceContinuity(document))
  }
  riceInstallBetterSidebarSurfaceState(ctx, document)
}

globalThis.RiceSurfaceMorph = {
  LOCAL_SURFACE_DISTANCE_PX: RICE_LOCAL_SURFACE_DISTANCE_PX,
  edgeGap: riceLocalSurfaceGap,
  geometry: riceLocalSurfaceGeometry,
  install: riceInstallLocalSurfaceContinuity,
  attachBetterSidebarState: riceAttachBetterSidebarSurfaceState,
}
