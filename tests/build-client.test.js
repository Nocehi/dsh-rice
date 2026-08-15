import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import vm from 'node:vm'
import test from 'node:test'

const execFileAsync = promisify(execFile)

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
