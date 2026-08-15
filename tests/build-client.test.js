import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import vm from 'node:vm'
import test from 'node:test'

const execFileAsync = promisify(execFile)

const SEARCH_PATH = 'M384.03-336Q284-336 214-406t-70-170q0-100 70-170t170-70q100 0 170 70t70 170.03'
const ADD_PATH = 'M444-444H276q-15.3 0-25.65-10.29Q240-464.58 240-479.79'
const BROWSE_ACTIVITY_PATH = 'M96-588v-155.85Q96-776 118.56-796q22.57-20 54.25-20'

test('browser artifact is rc.6-style namespace module with React as its only require', async () => {
  await execFileAsync(process.execPath, ['scripts/build-client.mjs'], { cwd:process.cwd() })
  const artifact = await readFile('lib/client.js', 'utf8')
  assert.doesNotMatch(artifact, /^\s*import\s/mu)
  assert.doesNotMatch(artifact, /\bimport\s*\(/u)
  assert.match(artifact, /require\('react'\)/u)
  const loaded = new Map()
  const window = { __ModuleLoader__:{ load({ id, factory }) { loaded.set(id, factory(name => { assert.equal(name,'react'); return { createElement(){}, Fragment:Symbol('Fragment') } })) } } }
  vm.runInNewContext(artifact, { window, console, Set, Map, Object, Number, String, Array })
  const namespace = loaded.get('dsh-rice')
  assert.equal(typeof namespace, 'object')
  assert.deepEqual(Object.keys(namespace).sort(), ['COMMAND_IDS','apply','inject'])
  assert.deepEqual([...namespace.inject], ['slots','layout','sessions','workspaces'])
})

test('browser artifact embeds 20px Material Symbols Rounded rail SVGs instead of font glyph marks', async () => {
  await execFileAsync(process.execPath, ['scripts/build-client.mjs'], { cwd:process.cwd() })
  const artifact = await readFile('lib/client.js', 'utf8')
  assert.match(artifact, /dsh-rice-rail-icon/u)
  assert.match(artifact, /viewBox:'0 -960 960 960'/u)
  assert.match(artifact, new RegExp(SEARCH_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'))
  assert.match(artifact, new RegExp(ADD_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'))
  assert.match(artifact, new RegExp(BROWSE_ACTIVITY_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'))
  assert.doesNotMatch(artifact, /mark:'⌕'|mark:'•'/u)
})
