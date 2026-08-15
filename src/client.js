import React from 'react'
import { COMMAND_IDS, attentionCount, deriveSessionGroups, flattenGroups, nextMruId, overviewGroups, updateMru } from './core.js'

export const inject = ['slots', 'layout', 'sessions', 'workspaces']

const CSS = `
[data-dsh-rice-rail] { box-sizing:border-box; width:56px; height:100%; display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 8px; overflow:hidden; color:var(--dsw-alias-label-primary,#e8e8e8); background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-base,#171717)); border-right:1px solid var(--dsw-alias-border-l2-darkmode-thin,rgba(127,127,127,.18)); font-family:var(--dsw-font-family,sans-serif); }
[data-dsh-rice-rail] button,[data-dsh-rice-switcher] button,[data-dsh-rice-switcher] input { font:inherit; }
[data-dsh-rice-rail] .dsh-rice-rail-button { position:relative; width:40px; height:40px; display:grid; place-items:center; border:0; border-radius:12px; background:transparent; color:inherit; cursor:pointer; }
[data-dsh-rice-rail] .dsh-rice-rail-button:hover,[data-dsh-rice-rail] .dsh-rice-rail-button:focus-visible { outline:none; background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.14)); }
[data-dsh-rice-rail] .dsh-rice-rail-mark { font-size:15px; font-weight:650; line-height:1; }
[data-dsh-rice-rail] .dsh-rice-badge { position:absolute; right:1px; top:1px; min-width:16px; height:16px; padding:0 4px; box-sizing:border-box; display:grid; place-items:center; border-radius:999px; background:var(--dsw-alias-label-primary,#e8e8e8); color:var(--dsw-alias-bg-base,#171717); font-size:10px; font-weight:700; }
[data-dsh-rice-rail] .dsh-rice-rail-spacer { flex:1; }
[data-dsh-rice-rail] .dsh-rice-slot { width:40px; display:grid; place-items:center; }
[data-dsh-rice-switcher] { position:absolute; inset:0; z-index:100; display:grid; place-items:start center; padding:min(12vh,104px) 16px 16px; box-sizing:border-box; pointer-events:auto; font-family:var(--dsw-font-family,sans-serif); color:var(--dsw-alias-label-primary,#e8e8e8); }
[data-dsh-rice-switcher] .dsh-rice-backdrop { position:absolute; inset:0; border:0; border-radius:0; background:rgba(0,0,0,.34); backdrop-filter:blur(2px); cursor:default; }
[data-dsh-rice-switcher] .dsh-rice-panel { position:relative; width:min(720px,calc(100vw - 32px)); max-height:min(72vh,760px); display:flex; flex-direction:column; overflow:hidden; border:1px solid var(--dsw-alias-border-l2-darkmode-thin,rgba(127,127,127,.24)); border-radius:18px; background:var(--dsw-alias-bg-base,#181818); box-shadow:var(--dsw-shadow-lv2,0 18px 60px rgba(0,0,0,.34)); }
[data-dsh-rice-switcher] .dsh-rice-topline { display:flex; align-items:center; gap:8px; padding:12px; border-bottom:1px solid var(--dsw-alias-border-l2-darkmode-thin,rgba(127,127,127,.18)); }
[data-dsh-rice-switcher] .dsh-rice-search { min-width:0; flex:1; border:0; outline:0; background:transparent; color:inherit; font-size:16px; line-height:24px; }
[data-dsh-rice-switcher] .dsh-rice-new { border:0; border-radius:10px; padding:7px 10px; background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.14)); color:inherit; cursor:pointer; white-space:nowrap; }
[data-dsh-rice-switcher] .dsh-rice-list { overflow:auto; padding:8px; scrollbar-gutter:stable; }
[data-dsh-rice-switcher] .dsh-rice-group-label { padding:9px 10px 5px; color:var(--dsw-alias-label-secondary,rgba(232,232,232,.62)); font-size:11px; line-height:16px; font-weight:650; letter-spacing:.03em; }
[data-dsh-rice-switcher] .dsh-rice-row { width:100%; min-height:48px; box-sizing:border-box; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; padding:8px 10px; border:0; border-radius:12px; background:transparent; color:inherit; text-align:left; cursor:pointer; }
[data-dsh-rice-switcher] .dsh-rice-row:hover,[data-dsh-rice-switcher] .dsh-rice-row[data-active="true"] { background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.14)); }
[data-dsh-rice-switcher] .dsh-rice-row-title { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; line-height:20px; }
[data-dsh-rice-switcher] .dsh-rice-row-meta { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--dsw-alias-label-secondary,rgba(232,232,232,.62)); font-size:11px; line-height:16px; }
[data-dsh-rice-switcher] .dsh-rice-status { color:var(--dsw-alias-label-secondary,rgba(232,232,232,.62)); font-size:11px; line-height:16px; white-space:nowrap; }
[data-dsh-rice-switcher] .dsh-rice-empty { padding:28px 18px; color:var(--dsw-alias-label-secondary,rgba(232,232,232,.62)); text-align:center; font-size:13px; }
`

const h = React.createElement

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

function RailButton({ label, mark, badge, onClick }) {
  return h('button', { type:'button', className:'dsh-rice-rail-button', 'aria-label':label, title:label, onClick }, [
    h('span', { key:'mark', className:'dsh-rice-rail-mark', 'aria-hidden':true }, mark),
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
      h(RailButton, { key:'switcher', label:'Switch sessions', mark:'⌕', badge:0, onClick:() => { commands.execute(COMMAND_IDS.quickSwitcher) } }),
      h(RailButton, { key:'new', label:'New session', mark:'+', badge:0, onClick:() => { startSession() } }),
      h('div', { key:'spacer', className:'dsh-rice-rail-spacer' }),
      h(RailButton, { key:'attention', label:'Session activity', mark:'•', badge:attention, onClick:() => { commands.execute(COMMAND_IDS.sessionOverview) } }),
      h('div', { key:'footer-actions', className:'dsh-rice-slot' }, renderSlot('sidebar.footer.action', { wide:false })),
      h('div', { key:'settings', className:'dsh-rice-slot' }, renderSlot('sidebar.settings', { wide:false })),
    ]),
  ])
}

function statusLabel(row) {
  if (row.pendingInteraction !== undefined) return 'waiting'
  if (row.completed) return 'done'
  if (row.running) return 'running'
  if (row.current) return 'current'
  return ''
}

function QuickSwitcherOverlay({ uiState, sessionSource, workspaceSource, openSession, startSession }) {
  const ui = useSource(uiState)
  const sessions = useSource(sessionSource)
  const workspaces = useSource(workspaceSource)
  const inputRef = React.useRef(null)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const allGroups = React.useMemo(() => deriveSessionGroups(sessions, workspaces, ui.query), [sessions, workspaces, ui.query])
  const groups = React.useMemo(() => ui.mode === 'attention' && ui.query.trim() === '' ? overviewGroups(allGroups) : allGroups, [allGroups, ui.mode, ui.query])
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
  return h('div', { 'data-dsh-rice-switcher':'', role:'presentation' }, [
    h('style', { key:'style' }, CSS),
    h('button', { key:'backdrop', type:'button', className:'dsh-rice-backdrop', 'aria-label':'Close session switcher', onClick:() => { uiState.close() } }),
    h('section', { key:'panel', className:'dsh-rice-panel', role:'dialog', 'aria-modal':true, 'aria-label':ui.mode === 'attention' ? 'Session activity' : 'Session switcher' }, [
      h('div', { key:'top', className:'dsh-rice-topline' }, [
        h('input', { key:'input', ref:inputRef, className:'dsh-rice-search', type:'search', value:ui.query, placeholder:'Search visible sessions', 'aria-label':'Search visible sessions', onChange:event => { uiState.setQuery(event.currentTarget.value); setActiveIndex(0) }, onKeyDown }),
        h('button', { key:'new', type:'button', className:'dsh-rice-new', onClick:() => { uiState.close(); startSession() } }, '+ New session'),
      ]),
      h('div', { key:'list', className:'dsh-rice-list' }, groups.length === 0
        ? h('div', { className:'dsh-rice-empty' }, ui.mode === 'attention' && ui.query.trim() === '' ? 'No active or attention-needed sessions.' : 'No matching sessions.')
        : groups.flatMap(group => {
          const label = h('div', { key:`g:${group.key}`, className:'dsh-rice-group-label' }, group.label)
          const items = group.sessions.map(row => {
            const index = rowCursor++
            const status = statusLabel(row)
            return h('button', { key:`s:${row.id}`, type:'button', className:'dsh-rice-row', 'data-active':index === activeIndex ? 'true' : undefined, onMouseEnter:() => { setActiveIndex(index) }, onClick:() => { activate(row) } }, [
              h('span', { key:'copy', style:{ minWidth:0 } }, [
                h('div', { key:'title', className:'dsh-rice-row-title' }, `${row.current ? '● ' : ''}${row.title}`),
                h('div', { key:'meta', className:'dsh-rice-row-meta' }, row.cwd || row.workspace),
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
}
