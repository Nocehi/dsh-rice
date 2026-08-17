/**
 * Candidate adapters for the local surface-continuity experiment.
 *
 * The core prototype in surface-morph.js only binds stable accessible
 * source→target relationships. This companion script explores two additional
 * presentation seams without introducing host-private class selectors:
 *
 * 1. a recently activated compact control may connect to a newly-visible,
 *    nearby semantic popup surface (menu/listbox/dialog/popover);
 * 2. dsh-better-sidebar's public service state may drive a short, local
 *    top-right corner bloom when its right workbench opens/closes.
 *
 * Both experiments are presentation-only, proximity/locality gated, and live
 * entirely inside dsh-rice.
 */
const RICE_CANDIDATE_ROLE_SELECTOR = '[role="menu"],[role="listbox"],[role="dialog"]'
const RICE_CANDIDATE_SOURCE_SELECTOR = 'button,[role="button"],[aria-haspopup]'
const RICE_CANDIDATE_SETTLE_FRAMES = 18
const RICE_CANDIDATE_SOURCE_MAX_WIDTH_PX = 180
const RICE_CANDIDATE_SOURCE_MAX_HEIGHT_PX = 72
const RICE_CANDIDATE_BRIDGE_STYLE_ID = 'dsh-rice-candidate-surface-style'
const RICE_BETTER_SIDEBAR_EDGE_PX = 112
const RICE_BETTER_SIDEBAR_TOP_PX = 112
const RICE_BETTER_SIDEBAR_FRESH_MS = 800
const RICE_BETTER_SIDEBAR_BLOOM_MS = 180

const RICE_CANDIDATE_SURFACE_CSS = `
.rice-candidate-surface-bridge {
  position:fixed;
  z-index:2147483001;
  height:8px;
  min-width:8px;
  box-sizing:border-box;
  pointer-events:none;
  border:1px solid var(--dsw-alias-border-l2-darkmode-thin);
  border-radius:999px;
  background:var(--dsw-specific-menu);
  box-shadow:var(--dsw-shadow-lv1);
  transform-origin:center;
  opacity:1;
  transition:opacity 120ms cubic-bezier(.2,0,0,1);
}
.rice-candidate-surface-bridge[data-leaving="true"] { opacity:0; }
.rice-better-sidebar-bloom {
  position:fixed;
  z-index:2147483000;
  box-sizing:border-box;
  pointer-events:none;
  background:var(--dsw-specific-menu);
  border:1px solid var(--dsw-alias-border-l2-darkmode-thin);
  box-shadow:var(--dsw-shadow-lv1);
  will-change:left,top,width,height,border-radius,opacity;
}
@media (prefers-reduced-motion: reduce) {
  .rice-candidate-surface-bridge { transition:none; }
}
`

function riceCandidateVisible(element) {
  return Boolean(
    element &&
      element.isConnected &&
      typeof element.getClientRects === 'function' &&
      element.getClientRects().length > 0,
  )
}

function riceCandidateNow(win) {
  return win.performance?.now?.() ?? Date.now()
}

function riceCandidateReducedMotion(win) {
  return Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
}

function riceCandidateLocalLimit() {
  return globalThis.RiceSurfaceMorph?.LOCAL_SURFACE_DISTANCE_PX ?? 56
}

function riceCandidateGeometry(sourceRect, targetRect) {
  const helper = globalThis.RiceSurfaceMorph?.geometry
  if (typeof helper === 'function') return helper(sourceRect, targetRect)

  const sourceX = sourceRect.right < targetRect.left
    ? sourceRect.right
    : targetRect.right < sourceRect.left
      ? sourceRect.left
      : (Math.max(sourceRect.left, targetRect.left) + Math.min(sourceRect.right, targetRect.right)) / 2
  const targetX = sourceRect.right < targetRect.left
    ? targetRect.left
    : targetRect.right < sourceRect.left
      ? targetRect.right
      : sourceX
  const sourceY = sourceRect.bottom < targetRect.top
    ? sourceRect.bottom
    : targetRect.bottom < sourceRect.top
      ? sourceRect.top
      : (Math.max(sourceRect.top, targetRect.top) + Math.min(sourceRect.bottom, targetRect.bottom)) / 2
  const targetY = sourceRect.bottom < targetRect.top
    ? targetRect.top
    : targetRect.bottom < sourceRect.top
      ? targetRect.bottom
      : sourceY
  const distance = Math.hypot(targetX - sourceX, targetY - sourceY)

  return {
    sourceX,
    sourceY,
    targetX,
    targetY,
    distance,
    left:(sourceX + targetX) / 2,
    top:(sourceY + targetY) / 2,
    angle:Math.atan2(targetY - sourceY, targetX - sourceX),
  }
}

function riceCandidateInstallStyle(doc) {
  if (doc.getElementById(RICE_CANDIDATE_BRIDGE_STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = RICE_CANDIDATE_BRIDGE_STYLE_ID
  style.textContent = RICE_CANDIDATE_SURFACE_CSS
  ;(doc.head || doc.documentElement).append(style)
}

function riceCandidatePopoverOpen(element) {
  if (!element?.hasAttribute?.('popover')) return false
  try {
    return element.matches(':popover-open')
  } catch {
    return false
  }
}

function riceCandidateSemanticSurfaces(doc) {
  const result = []
  for (const element of doc.querySelectorAll(RICE_CANDIDATE_ROLE_SELECTOR)) {
    if (riceCandidateVisible(element)) result.push(element)
  }
  for (const element of doc.querySelectorAll('[popover]')) {
    if (riceCandidateVisible(element) && riceCandidatePopoverOpen(element)) result.push(element)
  }
  return result
}

function riceCandidateSource(node, doc) {
  const ElementCtor = doc.defaultView?.Element
  if (ElementCtor && !(node instanceof ElementCtor)) return null
  const source = node?.closest?.(RICE_CANDIDATE_SOURCE_SELECTOR)
  if (!riceCandidateVisible(source)) return null

  const rect = source.getBoundingClientRect()
  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.width > RICE_CANDIDATE_SOURCE_MAX_WIDTH_PX ||
    rect.height > RICE_CANDIDATE_SOURCE_MAX_HEIGHT_PX
  ) return null

  return source
}

function riceCandidateBridge(source, target, doc) {
  const sourceRect = source.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const geometry = riceCandidateGeometry(sourceRect, targetRect)
  if (geometry.distance > riceCandidateLocalLimit()) return null

  source.setAttribute('data-rice-candidate-surface-source', 'true')
  target.setAttribute('data-rice-candidate-surface-target', 'true')

  if (geometry.distance <= 0.5) {
    return {
      update() {},
      dispose() {
        source.removeAttribute('data-rice-candidate-surface-source')
        target.removeAttribute('data-rice-candidate-surface-target')
      },
    }
  }

  const bridge = doc.createElement('div')
  bridge.className = 'rice-candidate-surface-bridge'
  bridge.setAttribute('aria-hidden', 'true')
  ;(doc.body || doc.documentElement).append(bridge)

  function update() {
    if (!source.isConnected || !target.isConnected || !riceCandidateVisible(target)) return false
    const next = riceCandidateGeometry(source.getBoundingClientRect(), target.getBoundingClientRect())
    if (next.distance > riceCandidateLocalLimit()) return false
    bridge.style.left = `${next.left}px`
    bridge.style.top = `${next.top}px`
    bridge.style.width = `${Math.max(next.distance + 8, 8)}px`
    bridge.style.transform = `translate(-50%,-50%) rotate(${next.angle}rad)`
    return true
  }

  update()

  return {
    update,
    dispose() {
      source.removeAttribute('data-rice-candidate-surface-source')
      target.removeAttribute('data-rice-candidate-surface-target')
      bridge.setAttribute('data-leaving', 'true')
      const remove = () => { bridge.remove() }
      bridge.addEventListener('transitionend', remove, { once:true })
      if (riceCandidateReducedMotion(doc.defaultView)) remove()
    },
  }
}

function riceInstallSemanticSurfaceEmergence(doc) {
  const win = doc.defaultView
  if (!win || !doc.documentElement) return () => {}
  riceCandidateInstallStyle(doc)

  let source = null
  let baseline = new Set()
  let frameId = 0
  let settleFrames = 0
  let pair = null
  let resizeObserver = null

  function dropPair() {
    resizeObserver?.disconnect?.()
    resizeObserver = null
    pair?.dispose?.()
    pair = null
  }

  function observePair() {
    resizeObserver?.disconnect?.()
    if (typeof win.ResizeObserver !== 'function' || !pair) return
    resizeObserver = new win.ResizeObserver(() => {
      if (pair && pair.update() === false) dropPair()
    })
    if (source?.isConnected) resizeObserver.observe(source)
    const target = doc.querySelector('[data-rice-candidate-surface-target="true"]')
    if (target?.isConnected) resizeObserver.observe(target)
  }

  function discover() {
    frameId = 0
    if (!source?.isConnected) {
      dropPair()
      source = null
      return
    }

    if (pair) {
      if (pair.update() === false) dropPair()
    } else {
      let best = null
      let bestDistance = Infinity
      for (const target of riceCandidateSemanticSurfaces(doc)) {
        if (baseline.has(target)) continue
        if (target.contains?.(source) || source.contains?.(target)) continue
        if (
          source.hasAttribute('data-rice-local-surface-source') ||
          target.hasAttribute('data-rice-local-surface-target')
        ) continue

        const geometry = riceCandidateGeometry(source.getBoundingClientRect(), target.getBoundingClientRect())
        if (geometry.distance <= riceCandidateLocalLimit() && geometry.distance < bestDistance) {
          best = target
          bestDistance = geometry.distance
        }
      }

      if (best) {
        pair = riceCandidateBridge(source, best, doc)
        observePair()
      }
    }

    if (settleFrames > 0) {
      settleFrames -= 1
      frameId = win.requestAnimationFrame(discover)
    }
  }

  function activate(nextSource) {
    dropPair()
    source = nextSource
    baseline = new Set(riceCandidateSemanticSurfaces(doc))
    settleFrames = RICE_CANDIDATE_SETTLE_FRAMES
    if (!frameId) frameId = win.requestAnimationFrame(discover)
  }

  function onPointerDown(event) {
    const nextSource = riceCandidateSource(event.target, doc)
    if (nextSource) activate(nextSource)
  }

  function onKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const nextSource = riceCandidateSource(event.target, doc)
    if (nextSource) activate(nextSource)
  }

  function onMutation() {
    if (!source || pair) return
    if (!frameId) frameId = win.requestAnimationFrame(discover)
  }

  doc.addEventListener('pointerdown', onPointerDown, true)
  doc.addEventListener('keydown', onKeyDown, true)

  const mutationObserver = new win.MutationObserver(onMutation)
  mutationObserver.observe(doc.documentElement, {
    subtree:true,
    childList:true,
    attributes:true,
    attributeFilter:['role', 'popover', 'open', 'hidden', 'aria-hidden'],
  })

  return () => {
    if (frameId) win.cancelAnimationFrame(frameId)
    mutationObserver.disconnect()
    resizeObserver?.disconnect?.()
    doc.removeEventListener('pointerdown', onPointerDown, true)
    doc.removeEventListener('keydown', onKeyDown, true)
    dropPair()
  }
}

function riceBetterSidebarActivator(node, doc) {
  const source = riceCandidateSource(node, doc)
  if (!source) return null
  const win = doc.defaultView
  const rect = source.getBoundingClientRect()
  if (win.innerWidth - rect.right > RICE_BETTER_SIDEBAR_EDGE_PX) return null
  if (rect.top > RICE_BETTER_SIDEBAR_TOP_PX) return null
  return {
    rect:{
      left:rect.left,
      top:rect.top,
      right:rect.right,
      bottom:rect.bottom,
      width:rect.width,
      height:rect.height,
    },
    at:riceCandidateNow(win),
  }
}

function riceBetterSidebarCornerPatch(sourceRect, panelWidth, win) {
  const width = Number.isFinite(panelWidth) && panelWidth > 0 ? panelWidth : 360
  const panelLeft = Math.max(0, win.innerWidth - width)
  const left = Math.max(panelLeft, Math.min(sourceRect.left - 20, win.innerWidth - 72))
  const bottom = Math.min(win.innerHeight, Math.max(sourceRect.bottom + 20, 72))
  return {
    left,
    top:0,
    right:win.innerWidth,
    bottom,
    width:win.innerWidth - left,
    height:bottom,
  }
}

function riceBetterSidebarRectFrame(rect, borderRadius, opacity) {
  return {
    left:`${rect.left}px`,
    top:`${rect.top}px`,
    width:`${rect.width}px`,
    height:`${rect.height}px`,
    borderRadius,
    opacity,
  }
}

function ricePlayBetterSidebarBloom(doc, sourceRect, panelWidth, opening) {
  const win = doc.defaultView
  if (!win || riceCandidateReducedMotion(win)) return null

  const targetRect = riceBetterSidebarCornerPatch(sourceRect, panelWidth, win)
  const layer = doc.createElement('div')
  layer.className = 'rice-better-sidebar-bloom'
  layer.setAttribute('aria-hidden', 'true')
  layer.setAttribute('data-rice-better-sidebar-bloom', opening ? 'open' : 'close')
  ;(doc.body || doc.documentElement).append(layer)

  if (typeof layer.animate !== 'function') {
    layer.remove()
    return null
  }

  const sourceFrame = riceBetterSidebarRectFrame(sourceRect, '12px', 0.9)
  const targetFrame = riceBetterSidebarRectFrame(targetRect, '0 0 0 22px', 0.48)
  const frames = opening
    ? [sourceFrame, { ...targetFrame, offset:0.72 }, { ...targetFrame, opacity:0, offset:1 }]
    : [targetFrame, { ...sourceFrame, offset:0.72 }, { ...sourceFrame, opacity:0, offset:1 }]

  const animation = layer.animate(frames, {
    duration:RICE_BETTER_SIDEBAR_BLOOM_MS,
    easing:'cubic-bezier(.2,0,0,1)',
    fill:'both',
  })
  const cleanup = () => { layer.remove() }
  animation.finished.then(cleanup, cleanup)
  return animation
}

function riceAttachBetterSidebarBloom(service, doc) {
  if (
    !service ||
    typeof service.getSnapshot !== 'function' ||
    typeof service.subscribeState !== 'function'
  ) return () => {}

  const win = doc.defaultView
  if (!win) return () => {}
  riceCandidateInstallStyle(doc)

  let lastActivator = null
  let previous = service.getSnapshot()

  function remember(node) {
    const next = riceBetterSidebarActivator(node, doc)
    if (next) lastActivator = next
  }

  function onPointerDown(event) {
    remember(event.target)
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') remember(event.target)
  }

  function freshActivator() {
    if (!lastActivator) return null
    if (riceCandidateNow(win) - lastActivator.at > RICE_BETTER_SIDEBAR_FRESH_MS) return null
    return lastActivator
  }

  function refresh() {
    const next = service.getSnapshot()
    const wasOpen = Boolean(previous?.state?.panelOpen)
    const isOpen = Boolean(next?.state?.panelOpen)

    if (wasOpen !== isOpen) {
      const activator = freshActivator()
      if (activator) {
        const panelWidth = Number((isOpen ? next : previous)?.state?.width)
        ricePlayBetterSidebarBloom(doc, activator.rect, panelWidth, isOpen)
      }
      lastActivator = null
    }

    previous = next
  }

  doc.addEventListener('pointerdown', onPointerDown, true)
  doc.addEventListener('keydown', onKeyDown, true)
  const unsubscribe = service.subscribeState(refresh)

  return () => {
    doc.removeEventListener('pointerdown', onPointerDown, true)
    doc.removeEventListener('keydown', onKeyDown, true)
    if (typeof unsubscribe === 'function') unsubscribe()
  }
}

function riceInstallBetterSidebarBloom(ctx, doc) {
  if (!ctx || typeof ctx.inject !== 'function') return
  ctx.inject(['betterSidebar'], injectedCtx =>
    riceAttachBetterSidebarBloom(
      injectedCtx?.betterSidebar ?? ctx.betterSidebar,
      doc,
    ),
  )
}

const RiceSurfaceCandidatesApplyBase = apply
apply = function RiceApplyWithSurfaceCandidates(ctx) {
  RiceSurfaceCandidatesApplyBase(ctx)
  if (typeof document === 'undefined') return

  if (ctx && typeof ctx.effect === 'function') {
    ctx.effect(() => riceInstallSemanticSurfaceEmergence(document))
  }
  riceInstallBetterSidebarBloom(ctx, document)
}

globalThis.RiceSurfaceCandidates = {
  ROLE_SELECTOR:RICE_CANDIDATE_ROLE_SELECTOR,
  installEmergence:riceInstallSemanticSurfaceEmergence,
  attachBetterSidebarBloom:riceAttachBetterSidebarBloom,
  playBetterSidebarBloom:ricePlayBetterSidebarBloom,
  betterSidebarCornerPatch:riceBetterSidebarCornerPatch,
}
