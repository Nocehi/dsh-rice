import assert from 'node:assert/strict'
import test from 'node:test'
import { attentionCount, deriveSessionGroups, flattenGroups, fuzzyScore, nextMruId, overviewGroups, updateMru } from '../src/core.js'

function fixtures() {
  return {
    sessions:{ current:'s-current', ids:['s-a','s-current','s-archived','s-child','s-loose','s-blank'], byId:{
      's-a':{ id:'s-a', displayTitle:'Rice navigation', cwd:'/repo/a', running:false, blank:false, updatedAt:10 },
      's-current':{ id:'s-current', displayTitle:'Current task', cwd:'/repo/a', running:true, blank:false, updatedAt:20 },
      's-archived':{ id:'s-archived', displayTitle:'Archived', cwd:'/repo/a', running:false, blank:false, updatedAt:30 },
      's-child':{ id:'s-child', displayTitle:'Subagent', cwd:'/repo/a', running:true, blank:false, updatedAt:40, origin:'subagent' },
      's-loose':{ id:'s-loose', displayTitle:'Loose session', cwd:'/tmp/loose', running:false, completed:true, blank:false, updatedAt:50 },
      's-blank':{ id:'s-blank', displayTitle:'Blank', cwd:'/repo/a', running:false, blank:true, updatedAt:60 },
    } },
    workspaces:{ archivedSessionIds:['s-archived'], items:[{ workspaceId:'w-a', title:'dsh-rice', path:'/repo/a', sessionIds:['s-a','s-current','s-archived','s-child','s-blank'] }] },
  }
}

test('product-visible projection excludes archive, subagents, and non-current blank rows', () => {
  const { sessions, workspaces } = fixtures()
  const groups = deriveSessionGroups(sessions, workspaces)
  assert.deepEqual(groups.map(group => [group.label, group.path, group.sessions.map(row => row.id)]), [
    ['dsh-rice','/repo/a',['s-a','s-current']],
    ['Ungrouped','',['s-loose']],
  ])
})

test('search is local metadata fuzzy matching and never resurrects hidden rows', () => {
  const { sessions, workspaces } = fixtures()
  assert.deepEqual(flattenGroups(deriveSessionGroups(sessions, workspaces, 'rice')).map(row => row.id), ['s-a','s-current'])
  assert.deepEqual(flattenGroups(deriveSessionGroups(sessions, workspaces, 'archived')).map(row => row.id), [])
  assert.ok(fuzzyScore('Quick Switcher', 'qsw') > Number.NEGATIVE_INFINITY)
  assert.equal(fuzzyScore('Quick Switcher', 'zzz'), Number.NEGATIVE_INFINITY)
})

test('attention and overview stay derived projections of the same visible corpus', () => {
  const { sessions, workspaces } = fixtures()
  sessions.byId['s-a'].pendingInteraction = { kind:'approval' }
  const groups = deriveSessionGroups(sessions, workspaces)
  assert.equal(attentionCount(groups), 2)
  assert.deepEqual(flattenGroups(overviewGroups(groups)).map(row => row.id), ['s-a','s-current','s-loose'])
  assert.equal(overviewGroups(groups)[0].path, '/repo/a')
})

test('MRU helpers never invent a second corpus', () => {
  const history = updateMru(['old','s-b','s-a'], 's-a', ['s-a','s-b'])
  assert.deepEqual(history, ['s-a','s-b'])
  assert.equal(nextMruId(history, 's-a', 1), 's-b')
  assert.equal(nextMruId(history, 's-a', -1), 's-b')
})
