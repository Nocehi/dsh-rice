export const COMMAND_IDS = Object.freeze({
  quickSwitcher: 'quickSwitcher',
  sessionMruNext: 'sessionMruNext',
  sessionMruPrevious: 'sessionMruPrevious',
  sessionOverview: 'sessionOverview',
})

export const UNGROUPED_KEY = ''
export const UNGROUPED_LABEL = 'Ungrouped'

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function basename(path) {
  const value = text(path)
  if (value === '') return ''
  const stripped = value.replace(/[/\\]+$/u, '')
  const part = stripped.split(/[/\\]/u).pop()
  return part === undefined || part === '' ? value : part
}

export function workspaceLabel(workspace) {
  const title = text(workspace?.title)
  if (title !== '') return title
  const pathLabel = basename(workspace?.path)
  return pathLabel === '' ? UNGROUPED_LABEL : pathLabel
}

export function sessionVisible(summary, current, archived) {
  return summary !== undefined
    && summary.origin !== 'subagent'
    && !archived.has(summary.id)
    && (!summary.blank || summary.id === current)
}

function normalized(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase()
}

/** Lightweight fuzzy score over already-visible metadata; it is not a second index authority. */
export function fuzzyScore(haystack, query) {
  const source = normalized(haystack)
  const needle = normalized(query).trim()
  if (needle === '') return 0
  const direct = source.indexOf(needle)
  if (direct !== -1) {
    const prefixBonus = direct === 0 ? 200 : 0
    return 1000 + prefixBonus - direct - Math.max(0, source.length - needle.length) * 0.01
  }
  let cursor = 0
  let first = -1
  let gaps = 0
  for (const char of needle) {
    const found = source.indexOf(char, cursor)
    if (found === -1) return Number.NEGATIVE_INFINITY
    if (first === -1) first = found
    gaps += found - cursor
    cursor = found + 1
  }
  return 200 - first - gaps * 2 - Math.max(0, source.length - needle.length) * 0.01
}

function rowFor(summary, workspace, current) {
  const label = workspace === undefined ? UNGROUPED_LABEL : workspaceLabel(workspace)
  return Object.freeze({
    id: summary.id,
    title: summary.blank ? 'New Session' : summary.displayTitle,
    workspaceId: workspace?.workspaceId,
    workspace: label,
    cwd: summary.cwd ?? workspace?.path ?? '',
    agentPreset: summary.agentPreset ?? '',
    running: summary.running === true,
    pendingInteraction: summary.pendingInteraction,
    completed: summary.completed === true,
    updatedAt: Number.isFinite(summary.updatedAt) ? summary.updatedAt : 0,
    current: summary.id === current,
    blank: summary.blank === true,
  })
}

function rowScore(row, query) {
  if (query.trim() !== '' && row.blank) return Number.NEGATIVE_INFINITY
  return fuzzyScore([row.title, row.workspace, row.cwd, row.agentPreset].filter(Boolean).join(' '), query)
}

function ranked(rows, query) {
  if (query.trim() === '') return rows
  return rows
    .map(row => ({ row, score: rowScore(row, query) }))
    .filter(item => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score || b.row.updatedAt - a.row.updatedAt || String(a.row.id).localeCompare(String(b.row.id)))
    .map(item => item.row)
}

/** Product-visible v0 projection: archive/subagent/non-current blank rows stay out. */
export function deriveSessionGroups(sessionState, workspaceState, query = '') {
  const archived = new Set(workspaceState?.archivedSessionIds ?? [])
  const current = sessionState?.current
  const byId = sessionState?.byId ?? {}
  const ids = sessionState?.ids ?? []
  const workspaces = workspaceState?.items ?? []
  const accounted = new Set()
  const groups = []

  for (const workspace of workspaces) {
    const rows = []
    for (const id of workspace.sessionIds ?? []) {
      accounted.add(id)
      const summary = byId[id]
      if (!sessionVisible(summary, current, archived)) continue
      rows.push(rowFor(summary, workspace, current))
    }
    const visible = ranked(rows, query)
    if (visible.length > 0) groups.push(Object.freeze({
      key: workspace.workspaceId,
      label: workspaceLabel(workspace),
      path: text(workspace.path),
      workspaceId: workspace.workspaceId,
      sessions: Object.freeze(visible),
    }))
  }

  const loose = []
  for (const id of ids) {
    if (accounted.has(id)) continue
    const summary = byId[id]
    if (!sessionVisible(summary, current, archived)) continue
    loose.push(rowFor(summary, undefined, current))
  }
  loose.sort((a, b) => b.updatedAt - a.updatedAt || String(a.id).localeCompare(String(b.id)))
  const visibleLoose = ranked(loose, query)
  if (visibleLoose.length > 0) groups.push(Object.freeze({
    key: UNGROUPED_KEY,
    label: UNGROUPED_LABEL,
    path: '',
    workspaceId: undefined,
    sessions: Object.freeze(visibleLoose),
  }))

  return Object.freeze(groups)
}

export function flattenGroups(groups) {
  return groups.flatMap(group => group.sessions)
}

export function attentionCount(groups) {
  let count = 0
  for (const row of flattenGroups(groups)) {
    if (row.pendingInteraction !== undefined || row.completed) count += 1
  }
  return count
}

export function overviewGroups(groups) {
  return groups
    .map(group => Object.freeze({
      ...group,
      sessions: Object.freeze(group.sessions.filter(row => (
        row.current || row.running || row.completed || row.pendingInteraction !== undefined
      ))),
    }))
    .filter(group => group.sessions.length > 0)
}

export function updateMru(history, current, visibleIds, limit = 50) {
  const visible = new Set(visibleIds)
  const next = []
  if (current !== undefined && visible.has(current)) next.push(current)
  for (const id of history) {
    if (!visible.has(id) || next.includes(id)) continue
    next.push(id)
    if (next.length >= limit) break
  }
  return Object.freeze(next)
}

export function nextMruId(history, current, direction) {
  if (history.length < 2) return undefined
  const index = Math.max(0, history.indexOf(current))
  const delta = direction < 0 ? -1 : 1
  const target = (index + delta + history.length) % history.length
  const id = history[target]
  return id === current ? undefined : id
}
