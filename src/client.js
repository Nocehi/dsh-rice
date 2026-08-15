import React from 'react'
import { COMMAND_IDS, attentionCount, deriveSessionGroups, flattenGroups, nextMruId, overviewGroups, updateMru } from './core.js'
import { PULSE_DEFAULTS, PulseTimeline, advancePulseBpm, derivePulseActivity, derivePulseSignal, ecgValue, updatePulseSamples } from './pulse.js'
import { FishLogo } from '@deepseek-ai/dsh-client-ui-primitives'

export const inject = ['slots', 'layout', 'sessions', 'workspaces']

const CSS = `
[data-dsh-rice-rail] { box-sizing:border-box; width:56px; height:100%; display:flex; flex-direction:column; align-items:center; gap:6px; padding:18px 10px 6px; overflow:hidden; color:var(--dsw-alias-label-primary); background:var(--dsw-specific-sidebar-fill); font-family:var(--dsw-font-family,sans-serif); }
[data-dsh-rice-rail] button,[data-dsh-rice-switcher] button,[data-dsh-rice-switcher] input { font:inherit; }
[data-dsh-rice-rail] .dsh-rice-brand { flex:none; width:36px; height:36px; display:grid; place-items:center; margin-bottom:6px; color:var(--dsw-alias-brand-primary); }
[data-dsh-rice-rail] .dsh-rice-brand svg { display:block; }
[data-dsh-rice-rail] .dsh-rice-rail-button { position:relative; width:36px; height:36px; display:grid; place-items:center; border:0; border-radius:12px; background:transparent; color:inherit; cursor:pointer; }
[data-dsh-rice-rail] .dsh-rice-rail-button:hover { background:var(--dsw-alias-interactive-bg-hover); }
[data-dsh-rice-rail] .dsh-rice-rail-button:active { background:var(--dsw-alias-interactive-bg-active); }
[data-dsh-rice-rail] .dsh-rice-rail-button:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }
[data-dsh-rice-rail] .dsh-rice-rail-icon { display:block; fill:currentColor; }
[data-dsh-rice-rail] .dsh-rice-badge { position:absolute; right:1px; top:1px; min-width:16px; height:16px; padding:0 4px; box-sizing:border-box; display:grid; place-items:center; border-radius:999px; background:var(--dsw-alias-brand-primary); color:var(--dsw-alias-label-primary-foreground); font-size:10px; line-height:16px; font-weight:700; }
[data-dsh-rice-rail] .dsh-rice-rail-spacer { flex:1; }
[data-dsh-rice-rail] .dsh-rice-slot { width:36px; display:grid; place-items:center; }
[data-dsh-rice-switcher] { position:absolute; inset:0; z-index:100; display:grid; place-items:start center; padding:min(12vh,104px) 16px 16px; box-sizing:border-box; pointer-events:auto; font-family:var(--dsw-font-family,sans-serif); color:var(--dsw-alias-label-primary); }
[data-dsh-rice-switcher] .dsh-rice-backdrop { position:absolute; inset:0; border:0; border-radius:0; background:var(--dsw-alias-bg-mask-1); backdrop-filter:blur(2px); cursor:default; }
[data-dsh-rice-switcher] .dsh-rice-panel { position:relative; width:min(720px,calc(100vw - 32px)); max-height:min(72vh,760px); display:flex; flex-direction:column; overflow:hidden; border:0; border-radius:20px; background:var(--dsw-specific-menu); box-shadow:var(--dsw-shadow-lv2); }
[data-dsh-rice-switcher] .dsh-rice-topline { display:flex; align-items:center; gap:10px; margin:12px 12px 4px; padding:10px 12px; border:0; border-radius:14px; background:var(--dsw-specific-selector); }
[data-dsh-rice-switcher] .dsh-rice-mode-title { flex:0 0 auto; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; font-weight:700; letter-spacing:.02em; }
[data-dsh-rice-switcher] .dsh-rice-search { min-width:0; flex:1; border:0; outline:0; background:transparent; color:inherit; font-size:15px; line-height:22px; }
[data-dsh-rice-switcher] .dsh-rice-search::placeholder { color:var(--dsw-alias-label-tertiary); }
[data-dsh-rice-switcher] .dsh-rice-search:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:4px; border-radius:6px; }
[data-dsh-rice-switcher] .dsh-rice-new { min-height:34px; border:0; border-radius:10px; padding:7px 10px; background:var(--dsw-alias-button-elevated-fill); color:inherit; line-height:20px; cursor:pointer; white-space:nowrap; }
[data-dsh-rice-switcher] .dsh-rice-new:hover { background:var(--dsw-alias-button-floating-hover); }
[data-dsh-rice-switcher] .dsh-rice-new:active { background:var(--dsw-alias-interactive-bg-active); }
[data-dsh-rice-switcher] .dsh-rice-new:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }
[data-dsh-rice-switcher] .dsh-rice-list { overflow:auto; padding:6px 12px 12px; scrollbar-gutter:stable; }
[data-dsh-rice-switcher] .dsh-rice-group-label { padding:14px 12px 6px; color:var(--dsw-alias-label-secondary); }
[data-dsh-rice-switcher] .dsh-rice-group-name { font-size:12px; line-height:18px; font-weight:650; letter-spacing:.02em; }
[data-dsh-rice-switcher] .dsh-rice-group-path { max-width:60ch; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--dsw-alias-label-tertiary); font-size:11px; line-height:16px; font-weight:400; letter-spacing:0; }
[data-dsh-rice-switcher] .dsh-rice-row { width:100%; min-height:52px; box-sizing:border-box; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; padding:8px 12px; border:0; border-radius:14px; background:transparent; color:inherit; text-align:left; cursor:pointer; }
[data-dsh-rice-switcher] .dsh-rice-row:hover { background:var(--dsw-specific-sidebar-nav-item-hover); }
[data-dsh-rice-switcher] .dsh-rice-row[data-active="true"] { background:var(--dsw-specific-sidebar-nav-item-active); }
[data-dsh-rice-switcher] .dsh-rice-row[data-current="true"] { background:var(--dsw-specific-sidebar-nav-item-active-accent); box-shadow:inset 3px 0 0 var(--dsw-alias-brand-primary); }
[data-dsh-rice-switcher] .dsh-rice-row[data-current="true"][data-active="true"] { background:var(--dsw-specific-sidebar-nav-item-active-accent); }
[data-dsh-rice-switcher] .dsh-rice-row:active { background:var(--dsw-alias-interactive-bg-active); }
[data-dsh-rice-switcher] .dsh-rice-row:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-2px; }
[data-dsh-rice-switcher] .dsh-rice-row-copy { min-width:0; max-width:58ch; }
[data-dsh-rice-switcher] .dsh-rice-row-title { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; line-height:20px; font-weight:500; }
[data-dsh-rice-switcher] .dsh-rice-row-meta { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; }
[data-dsh-rice-switcher] .dsh-rice-status { color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; white-space:nowrap; }
[data-dsh-rice-switcher] .dsh-rice-row[data-current="true"] .dsh-rice-status { color:var(--dsw-alias-brand-primary); font-weight:650; }
[data-dsh-rice-switcher] .dsh-rice-empty { padding:32px 20px; color:var(--dsw-alias-label-secondary); text-align:center; font-size:13px; line-height:20px; }
[data-dsh-rice-switcher] .dsh-rice-sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
[data-dsh-rice-pulse] { --dsh-rice-pulse-ink:var(--dsw-alias-label-tertiary); box-sizing:border-box; width:100%; height:28px; min-height:28px; display:grid; grid-template-columns:52px minmax(100px,1fr) 72px; align-items:center; gap:10px; margin:4px 0; padding:0 10px; border:0; border-radius:12px; background:var(--dsw-specific-selector); color:var(--dsw-alias-label-secondary); font-family:var(--dsw-font-family,sans-serif); overflow:hidden; }
[data-dsh-rice-pulse][data-mode="think"],[data-dsh-rice-pulse][data-mode="run"] { --dsh-rice-pulse-ink:var(--dsw-alias-brand-primary); }
[data-dsh-rice-pulse][data-mode="tool"] { --dsh-rice-pulse-ink:var(--dsw-alias-state-warn-primary); }
[data-dsh-rice-pulse][data-mode="flat"] { --dsh-rice-pulse-ink:var(--dsw-alias-state-error-primary); }
[data-dsh-rice-pulse] .dsh-rice-pulse-bpm { color:var(--dsh-rice-pulse-ink); font-size:12px; line-height:18px; font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; }
[data-dsh-rice-pulse] .dsh-rice-pulse-paper { position:relative; min-width:100px; height:22px; overflow:hidden; color:var(--dsh-rice-pulse-ink); }
[data-dsh-rice-pulse] .dsh-rice-pulse-canvas { position:absolute; inset:0; width:100%; height:100%; display:block; color:inherit; }
[data-dsh-rice-pulse] .dsh-rice-pulse-status { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--dsw-alias-label-secondary); font-size:11px; line-height:16px; text-align:right; }
`

const h = React.createElement

// Material Symbols Rounded 20px path data from google/material-design-icons.
// Licensed under Apache-2.0; see THIRD_PARTY_NOTICES.md.
const MATERIAL_SYMBOL_PATHS = Object.freeze({
  search: 'M384.03-336Q284-336 214-406t-70-170q0-100 70-170t170-70q100 0 170 70t70 170.03q0 40.39-12.5 76.18Q599-464 577-434l214 214q11 11 11 25t-11 25q-11 11-25.5 11T740-170L526-383q-30 22-65.79 34.5-35.79 12.5-76.18 12.5Zm-.03-72q70 0 119-49t49-119q0-70-49-119t-119-49q-70 0-119 49t-49 119q0 70 49 119t119 49Z',
  add: 'M444-444H276q-15.3 0-25.65-10.29Q240-464.58 240-479.79t10.35-25.71Q260.7-516 276-516h168v-168q0-15.3 10.29-25.65Q464.58-720 479.79-720t25.71 10.35Q516-699.3 516-684v168h168q15.3 0 25.65 10.29Q720-495.42 720-480.21t-10.35 25.71Q699.3-444 684-444H516v168q0 15.3-10.29 25.65Q495.42-240 480.21-240t-25.71-10.35Q444-260.7 444-276v-168Z',
  browseActivity: 'M96-588v-155.85Q96-776 118.56-796q22.57-20 54.25-20h614.5q31.69 0 54.19 20 22.5 20 22.5 52.15V-588h-72v-156H168v156H96Zm76.69 324q-31.69 0-54.19-20Q96-304 96-336v-180h72v180h624v-180h72v180q0 32-22.56 52-22.57 20-54.25 20h-614.5ZM84-144q-15.3 0-25.65-10.29Q48-164.58 48-179.79t10.35-25.71Q68.7-216 84-216h792q15.3 0 25.65 10.29Q912-195.42 912-180.21t-10.35 25.71Q891.3-144 876-144H84Zm396-396ZM96-516v-72h233q14 0 25 7t17 18l39 72 112-176q5-8 12.42-12.5 7.43-4.5 16.5-4.5 9.08 0 17.08 3.5 8 3.5 13 10.5l61 82h222v72H629q-11 0-21-5t-17-14l-37-50-116 184q-5 8-13.06 12.5-8.07 4.5-16.94 4.5-9.9 0-18.45-5.5Q381-395 376-403l-62-113H96Z',
})

const PULSE_STATUS = Object.freeze({ idle:'idle', think:'thinking', tool:'tool', run:'running', flat:'stalled' })
const PULSE_HEIGHT = 22

function MaterialSymbol({ path, size = 20 }) {
  return h('svg', {
    className:'dsh-rice-rail-icon', width:size, height:size, viewBox:'0 -960 960 960',
    fill:'currentColor', focusable:'false', 'aria-hidden':true,
  }, h('path', { d:path }))
}

function useSource(source) {
  return React.useSyncExternalStore(listener => source.subscribe(listener), () => source.getSnapshot(), () => source.getSnapshot())
}

function createUiState() {
  let snapshot = Object.freeze({ open: false, mode: 'all', query: '' })
  const listeners = new Set()
  const publish = next => { snapshot = Object.freeze(next); for (const listener of [...listeners]) listener() }
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
    open: mode => publish({ open: true, mode, query: '' }),
    close: () => publish({ ...snapshot, open: false, query: '' }),
    setQuery: query => publish({ ...snapshot, query }),
  }
}

function visibleIds(sessionSource, workspaceSource) {
  return flattenGroups(deriveSessionGroups(sessionSource.getSnapshot(), workspaceSource.getSnapshot(), '')).map(row => row.id)
}

function createMruTracker(sessionSource, workspaceSource) {
  let history = Object.freeze([])
  let lastCurrent
  const sync = () => {
    const sessions = sessionSource.getSnapshot()
    const ids = visibleIds(sessionSource, workspaceSource)
    if (sessions.current !== lastCurrent) {
      history = updateMru(history, sessions.current, ids)
      lastCurrent = sessions.current
    } else {
      history = updateMru(history, undefined, ids)
    }
  }
  sync()
  const offSessions = sessionSource.subscribe(sync)
  const offWorkspaces = workspaceSource.subscribe(sync)
  return { step: direction => nextMruId(history, sessionSource.getSnapshot().current, direction), dispose: () => { offSessions(); offWorkspaces() } }
}

function createCommands(ctx, uiState, mru) {
  return Object.freeze({ execute(id) {
    switch (id) {
      case COMMAND_IDS.quickSwitcher: uiState.open('all'); return true
      case COMMAND_IDS.sessionOverview: uiState.open('attention'); return true
      case COMMAND_IDS.sessionMruNext:
      case COMMAND_IDS.sessionMruPrevious: {
        const target = mru.step(id === COMMAND_IDS.sessionMruPrevious ? -1 : 1)
        if (target !== undefined) ctx.sessions.open(target)
        return target !== undefined
      }
      default: return false
    }
  } })
}

function RailButton({ label, iconPath, iconSize = 20, badge, onClick }) {
  return h('button', { type:'button', className:'dsh-rice-rail-button', 'aria-label':label, title:label, onClick }, [
    h(MaterialSymbol, { key:'icon', path:iconPath, size:iconSize }),
    badge > 0 ? h('span', { key:'badge', className:'dsh-rice-badge' }, badge > 99 ? '99+' : String(badge)) : null,
  ])
}

function ApplicationRail({ collapsed, renderSlot, sessionSource, workspaceSource, commands, startSession, forceRail }) {
  const sessions = useSource(sessionSource)
  const workspaces = useSource(workspaceSource)
  const groups = React.useMemo(() => deriveSessionGroups(sessions, workspaces, ''), [sessions, workspaces])
  const attention = attentionCount(groups)
  React.useLayoutEffect(() => { if (!collapsed) forceRail() }, [collapsed, forceRail])
  return h(React.Fragment, null, [
    h('style', { key:'style' }, CSS),
    h('nav', { key:'rail', 'data-dsh-rice-rail':'', 'aria-label':'Application rail' }, [
      h('div', { key:'brand', className:'dsh-rice-brand', role:'img', 'aria-label':'DeepSeek' }, h(FishLogo, { size:24 })),
      h(RailButton, { key:'switcher', label:'Switch sessions', iconPath:MATERIAL_SYMBOL_PATHS.search, iconSize:22, badge:0, onClick:() => { commands.execute(COMMAND_IDS.quickSwitcher) } }),
      h(RailButton, { key:'new', label:'New session', iconPath:MATERIAL_SYMBOL_PATHS.add, iconSize:24, badge:0, onClick:() => { startSession() } }),
      h('div', { key:'spacer', className:'dsh-rice-rail-spacer' }),
      h(RailButton, { key:'attention', label:'Session activity', iconPath:MATERIAL_SYMBOL_PATHS.browseActivity, iconSize:20, badge:attention, onClick:() => { commands.execute(COMMAND_IDS.sessionOverview) } }),
      h('div', { key:'footer-actions', className:'dsh-rice-slot' }, renderSlot('sidebar.footer.action', { wide:false })),
      h('div', { key:'settings', className:'dsh-rice-slot' }, renderSlot('sidebar.settings', { wide:false })),
    ]),
  ])
}

function semanticPulseInk(mode) {
  const style = getComputedStyle(document.body)
  const token = mode === 'tool'
    ? '--dsw-alias-state-warn-primary'
    : mode === 'flat'
      ? '--dsw-alias-state-error-primary'
      : mode === 'idle'
        ? '--dsw-alias-label-tertiary'
        : '--dsw-alias-brand-primary'
  const value = style.getPropertyValue(token).trim()
  return value === '' ? style.color : value
}

function SessionPulse({ session, useProjection }) {
  const projected = useProjection('sessionStats')
  const sessionRef = React.useRef(session)
  const projectedStepsRef = React.useRef(projected?.steps)
  const samplesRef = React.useRef(Object.freeze([]))
  const bpmRef = React.useRef(PULSE_DEFAULTS.floorBpm)
  const targetRef = React.useRef(PULSE_DEFAULTS.floorBpm)
  const modeRef = React.useRef('idle')
  const reducedRef = React.useRef(false)
  const staticPaintRef = React.useRef(null)
  const inkRef = React.useRef('')
  const [ui, setUi] = React.useState({ bpm:PULSE_DEFAULTS.floorBpm, mode:'idle' })
  sessionRef.current = session
  projectedStepsRef.current = projected?.steps

  React.useEffect(() => {
    const tick = () => {
      const now = performance.now()
      const signal = derivePulseSignal(sessionRef.current, projectedStepsRef.current, Date.now())
      samplesRef.current = updatePulseSamples(samplesRef.current, signal.steps, now)
      const activity = derivePulseActivity(signal, samplesRef.current, now)
      targetRef.current = activity.targetBpm
      modeRef.current = activity.mode
      inkRef.current = semanticPulseInk(activity.mode)
      if (reducedRef.current) {
        bpmRef.current = activity.targetBpm === 0 ? PULSE_DEFAULTS.floorBpm : activity.targetBpm
        staticPaintRef.current?.()
      }
      setUi({ bpm:activity.mode === 'flat' ? 0 : Math.round(bpmRef.current), mode:activity.mode })
    }
    tick()
    const id = window.setInterval(tick, 1_000)
    return () => { window.clearInterval(id) }
  }, [])

  const canvasRef = React.useRef(null)
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const context = canvas.getContext('2d')
    if (context === null) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    reducedRef.current = reduced
    inkRef.current = semanticPulseInk(modeRef.current)

    let width = 640
    let dpr = window.devicePixelRatio || 1
    let trace = []
    let lastScanX = -1
    let lastReal = 0
    let displayNow = 0
    let framePeriodMs = 16.7
    let raf = 0
    const timeline = new PulseTimeline(0, bpmRef.current, 30)

    const applySize = () => {
      const measured = Math.round(canvas.getBoundingClientRect().width)
      width = Math.max(100, measured || width)
      dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(PULSE_HEIGHT * dpr))
      trace = []
      lastScanX = -1
    }

    const drawTrace = (ink, scanX = null) => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, PULSE_HEIGHT)
      if (trace.length === 0) return
      context.beginPath()
      for (let x = 0; x < trace.length; x += 1) {
        if (x === 0) context.moveTo(x, trace[x])
        else context.lineTo(x, trace[x])
      }
      context.strokeStyle = ink
      context.lineWidth = 1.4
      context.lineJoin = 'round'
      context.lineCap = 'round'
      context.stroke()
      if (scanX !== null) {
        context.globalAlpha = 0.16
        context.fillStyle = ink
        context.fillRect(scanX - 4, 0, 8, PULSE_HEIGHT)
        context.globalAlpha = 0.9
        context.fillRect(scanX - 1, 0, 2, PULSE_HEIGHT)
        context.globalAlpha = 1
      }
    }

    const paintStatic = () => {
      applySize()
      const bpm = Math.max(PULSE_DEFAULTS.floorBpm, targetRef.current)
      const seconds = width / PULSE_DEFAULTS.paperSpeedPxPerSecond
      const cycles = seconds * bpm / 60
      const middle = PULSE_HEIGHT / 2
      const amplitude = PULSE_HEIGHT * 0.45
      trace = new Array(width + 1)
      for (let x = 0; x <= width; x += 1) {
        const phase = ((x / Math.max(1, width)) * cycles) % 1
        trace[x] = modeRef.current === 'flat' ? middle : middle - ecgValue(phase) * amplitude
      }
      drawTrace(inkRef.current || semanticPulseInk(modeRef.current))
    }
    staticPaintRef.current = paintStatic

    applySize()
    let observer = null
    const onResize = () => { applySize(); if (reduced) paintStatic() }
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(onResize)
      observer.observe(canvas)
    } else {
      window.addEventListener('resize', onResize)
    }

    const paint = now => {
      if (lastReal === 0) {
        lastReal = now
        displayNow = now
        timeline.reset(now / 1_000, bpmRef.current, 30)
      }
      const realDt = Math.max(0, (now - lastReal) / 1_000)
      lastReal = now
      if (realDt > 0 && realDt < 0.05) framePeriodMs = realDt * 1_000
      const dt = framePeriodMs / 1_000
      displayNow += framePeriodMs
      bpmRef.current = advancePulseBpm(bpmRef.current, targetRef.current, dt)
      const tNow = displayNow / 1_000
      timeline.advance(tNow, bpmRef.current)
      const sweepPeriod = width / PULSE_DEFAULTS.paperSpeedPxPerSecond
      timeline.trimBefore(tNow - 2 * sweepPeriod - 2)
      const tInSweep = ((tNow % sweepPeriod) + sweepPeriod) % sweepPeriod
      const scanX = width - tInSweep * PULSE_DEFAULTS.paperSpeedPxPerSecond
      const scanXInt = Math.round(scanX)
      const middle = PULSE_HEIGHT / 2
      const amplitude = PULSE_HEIGHT * 0.45
      const sampleY = x => {
        if (modeRef.current === 'flat') return middle
        let peak = Number.NEGATIVE_INFINITY
        for (let sub = 0; sub < 4; sub += 1) {
          const sampleTime = (tNow - tInSweep) - (width - (x + sub * 0.25)) / PULSE_DEFAULTS.paperSpeedPxPerSecond
          const phase = timeline.phaseAt(sampleTime)
          const wrapped = phase - Math.floor(phase)
          peak = Math.max(peak, ecgValue(wrapped))
        }
        return middle - peak * amplitude
      }

      if (trace.length !== width + 1) {
        trace = new Array(width + 1)
        for (let x = 0; x <= width; x += 1) trace[x] = sampleY(x)
        lastScanX = scanXInt
      } else if (lastScanX > scanXInt) {
        for (let x = scanXInt; x <= lastScanX && x <= width; x += 1) trace[x] = sampleY(x)
        lastScanX = scanXInt
      } else if (lastScanX < scanXInt) {
        trace[scanXInt] = sampleY(scanXInt)
        lastScanX = scanXInt
      }
      drawTrace(inkRef.current || semanticPulseInk(modeRef.current), scanX)
    }

    if (reduced) {
      paintStatic()
    } else {
      const loop = now => { paint(now); raf = requestAnimationFrame(loop) }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      staticPaintRef.current = null
      if (observer !== null) observer.disconnect()
      else window.removeEventListener('resize', onResize)
      if (raf !== 0) cancelAnimationFrame(raf)
    }
  }, [])

  const status = PULSE_STATUS[ui.mode]
  const pulseText = ui.mode === 'flat' ? '0 bpm' : `${ui.bpm} bpm`
  return h('div', {
    'data-dsh-rice-pulse':'',
    'data-mode':ui.mode,
    role:'group',
    'aria-label':`Session activity pulse: ${pulseText}, ${status}`,
  }, [
    h('span', { key:'bpm', className:'dsh-rice-pulse-bpm' }, pulseText),
    h('span', { key:'paper', className:'dsh-rice-pulse-paper' }, h('canvas', { ref:canvasRef, className:'dsh-rice-pulse-canvas', 'aria-hidden':true })),
    h('span', { key:'status', className:'dsh-rice-pulse-status' }, status),
  ])
}

function statusLabel(row) {
  if (row.pendingInteraction !== undefined) return 'waiting'
  if (row.completed) return 'done'
  if (row.running) return 'running'
  if (row.current) return 'current'
  return ''
}

function rowMeta(row, group) {
  if (row.agentPreset) return row.agentPreset
  if (group.path !== '' && row.cwd === group.path) return ''
  return row.cwd || row.workspace
}

function activeAnnouncement(row) {
  if (row === undefined) return ''
  const status = statusLabel(row)
  return status === '' ? row.title : `${row.title}, ${status}`
}

function QuickSwitcherOverlay({ uiState, sessionSource, workspaceSource, openSession, startSession }) {
  const ui = useSource(uiState)
  const sessions = useSource(sessionSource)
  const workspaces = useSource(workspaceSource)
  const inputRef = React.useRef(null)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const allGroups = React.useMemo(() => deriveSessionGroups(sessions, workspaces, ui.query), [sessions, workspaces, ui.query])
  const attentionMode = ui.mode === 'attention'
  const groups = React.useMemo(() => attentionMode ? overviewGroups(allGroups) : allGroups, [allGroups, attentionMode])
  const rows = React.useMemo(() => flattenGroups(groups), [groups])
  React.useEffect(() => {
    if (!ui.open) return
    setActiveIndex(0)
    const frame = requestAnimationFrame(() => { inputRef.current?.focus() })
    return () => { cancelAnimationFrame(frame) }
  }, [ui.open, ui.mode])
  React.useEffect(() => { if (activeIndex >= rows.length) setActiveIndex(Math.max(0, rows.length - 1)) }, [activeIndex, rows.length])
  if (!ui.open) return null
  const activate = row => { openSession(row.id); uiState.close() }
  const onKeyDown = event => {
    if (event.key === 'Escape') { event.preventDefault(); uiState.close(); return }
    if (event.key === 'ArrowDown' && rows.length > 0) { event.preventDefault(); setActiveIndex(index => (index + 1) % rows.length); return }
    if (event.key === 'ArrowUp' && rows.length > 0) { event.preventDefault(); setActiveIndex(index => (index - 1 + rows.length) % rows.length); return }
    if (event.key === 'Enter' && rows[activeIndex] !== undefined) { event.preventDefault(); activate(rows[activeIndex]) }
  }
  let rowCursor = 0
  const panelLabel = attentionMode ? 'Session activity' : 'Session switcher'
  const placeholder = attentionMode ? 'Search activity' : 'Search visible sessions'
  const resultLabel = attentionMode ? 'Session activity results' : 'Visible sessions'
  return h('div', { 'data-dsh-rice-switcher':'', role:'presentation' }, [
    h('style', { key:'style' }, CSS),
    h('button', { key:'backdrop', type:'button', tabIndex:-1, className:'dsh-rice-backdrop', 'aria-label':`Close ${panelLabel.toLowerCase()}`, onClick:() => { uiState.close() } }),
    h('section', { key:'panel', className:'dsh-rice-panel', role:'dialog', 'aria-modal':true, 'aria-labelledby':'dsh-rice-switcher-title' }, [
      h('div', { key:'top', className:'dsh-rice-topline' }, [
        h('div', { key:'mode', id:'dsh-rice-switcher-title', className:'dsh-rice-mode-title' }, attentionMode ? 'Activity' : 'Sessions'),
        h('input', { key:'input', ref:inputRef, className:'dsh-rice-search', type:'search', value:ui.query, placeholder, 'aria-label':placeholder, 'aria-controls':'dsh-rice-session-results', onChange:event => { uiState.setQuery(event.currentTarget.value); setActiveIndex(0) }, onKeyDown }),
        attentionMode ? null : h('button', { key:'new', type:'button', className:'dsh-rice-new', onClick:() => { uiState.close(); startSession() } }, '+ New session'),
      ]),
      h('div', { key:'announce', className:'dsh-rice-sr-only', 'aria-live':'polite', 'aria-atomic':true }, activeAnnouncement(rows[activeIndex])),
      h('div', { key:'list', id:'dsh-rice-session-results', className:'dsh-rice-list', role:'region', 'aria-label':resultLabel }, groups.length === 0
        ? h('div', { className:'dsh-rice-empty', role:'status' }, attentionMode ? 'No active or attention-needed sessions.' : 'No matching sessions.')
        : groups.flatMap(group => {
          const label = h('div', { key:`g:${group.key}`, className:'dsh-rice-group-label' }, [
            h('div', { key:'name', className:'dsh-rice-group-name' }, group.label),
            group.path ? h('div', { key:'path', className:'dsh-rice-group-path', title:group.path }, group.path) : null,
          ])
          const items = group.sessions.map(row => {
            const index = rowCursor++
            const status = statusLabel(row)
            const meta = rowMeta(row, group)
            return h('button', {
              key:`s:${row.id}`,
              type:'button',
              className:'dsh-rice-row',
              'data-active':index === activeIndex ? 'true' : undefined,
              'data-current':row.current ? 'true' : undefined,
              'aria-current':row.current ? 'page' : undefined,
              onMouseEnter:() => { setActiveIndex(index) },
              onFocus:() => { setActiveIndex(index) },
              onClick:() => { activate(row) },
            }, [
              h('span', { key:'copy', className:'dsh-rice-row-copy' }, [
                h('div', { key:'title', className:'dsh-rice-row-title' }, row.title),
                meta ? h('div', { key:'meta', className:'dsh-rice-row-meta', title:meta }, meta) : null,
              ]),
              h('span', { key:'status', className:'dsh-rice-status' }, status),
            ])
          })
          return [label, ...items]
        })),
    ]),
  ])
}

export function apply(ctx) {
  const uiState = createUiState()
  const mru = createMruTracker(ctx.sessions.list, ctx.workspaces.list)
  const commands = createCommands(ctx, uiState, mru)
  ctx.effect(() => () => { mru.dispose() }, 'dsh-rice: mru tracker')
  ctx.slots.inject('sidebar', () => {
    const existing = ctx.slots.entries('sidebar')
    if (existing.length > 0) throw new Error('dsh-rice v0: disable the ui-sidebar row before mounting dsh-rice')
    return ctx.slots.register({
      name:'sidebar',
      children:{
        'sidebar.workspaces':{ kind:'single', scope:'root' },
        'sidebar.settings':{ kind:'single', scope:'root' },
        'sidebar.footer.action':{ kind:'list', scope:'root' },
      },
      inject:() => ({ sessionSource:ctx.sessions.list, workspaceSource:ctx.workspaces.list, commands, startSession:() => { ctx.workspaces.startSession() }, forceRail:() => { ctx.layout.toggleSidebar() } }),
    }, ApplicationRail)
  })
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name:'shell.overlay', id:'dsh-rice.switcher', order:20,
    inject:() => ({ uiState, sessionSource:ctx.sessions.list, workspaceSource:ctx.workspaces.list, openSession:id => { ctx.sessions.open(id) }, startSession:() => { ctx.workspaces.startSession() } }),
  }, QuickSwitcherOverlay))
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name:'conversation.input.dock', id:'dsh-rice.pulse', order:20,
  }, SessionPulse))
}
