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
const UI_PRIMITIVES = '@deepseek-ai/dsh-client-ui-primitives'

async function artifact() {
  await execFileAsync(process.execPath, ['scripts/build-client.mjs'], { cwd:process.cwd() })
  return readFile('lib/client.js', 'utf8')
}

function cssFrom(source) {
  const match = source.match(/const CSS = `([\s\S]*?)`\n/u)
  assert.ok(match, 'generated artifact must contain the rice-owned CSS contract')
  return match[1]
}

test('browser artifact is an rc.6-style namespace module using only public DSH Web platform modules', async () => {
  const source = await artifact()
  assert.doesNotMatch(source, /^\s*import\s/mu)
  assert.doesNotMatch(source, /\bimport\s*\(/u)
  assert.match(source, /require\('react'\)/u)
  assert.match(source, /require\('@deepseek-ai\/dsh-client-ui-primitives'\)/u)
  const loaded = new Map()
  const requested = []
  const React = { createElement(){}, Fragment:Symbol('Fragment') }
  const primitives = { FishLogo(){} }
  const window = { __ModuleLoader__:{ load({ id, factory }) {
    loaded.set(id, factory(name => {
      requested.push(name)
      if (name === 'react') return React
      if (name === UI_PRIMITIVES) return primitives
      assert.fail(`unexpected browser platform require ${name}`)
    }))
  } } }
  vm.runInNewContext(source, { window, console, Set, Map, Object, Number, String, Array, Date, Math })
  const namespace = loaded.get('dsh-rice')
  assert.equal(typeof namespace, 'object')
  assert.deepEqual(Object.keys(namespace).sort(), ['COMMAND_IDS','apply','inject'])
  assert.deepEqual([...namespace.inject], ['slots','layout','sessions','workspaces'])
  assert.deepEqual(requested, ['react', UI_PRIMITIVES])
})

test('browser artifact preserves the 56px/36px rail rhythm and reuses upstream FishLogo', async () => {
  const source = await artifact()
  assert.match(source, /\[data-dsh-rice-rail\] \{ box-sizing:border-box; width:56px;/u)
  assert.match(source, /dsh-rice-rail-button \{ position:relative; width:36px; height:36px/u)
  assert.match(source, /dsh-rice-brand \{ flex:none; width:36px; height:36px/u)
  assert.match(source, /key:'brand'.*?role:'img'.*?'aria-label':'DeepSeek'.*?h\(FishLogo, \{ size:24 \}\)/su)
  assert.match(source, /dsh-rice-brand.*?color:var\(--dsw-alias-brand-primary\)/su)
  assert.match(source, /dsh-rice-rail-icon \{ display:block; fill:currentColor; \}/u)
  assert.match(source, /viewBox:'0 -960 960 960'/u)
  assert.match(source, /key:'switcher'.*?iconSize:22/su)
  assert.match(source, /key:'new'.*?iconSize:24/su)
  assert.match(source, /key:'attention'.*?iconSize:20/su)
  assert.match(source, new RegExp(SEARCH_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'))
  assert.match(source, new RegExp(ADD_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'))
  assert.match(source, new RegExp(BROWSE_ACTIVITY_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'))
  assert.doesNotMatch(source, /mark:'⌕'|mark:'•'/u)
})

test('rice-owned presentation uses semantic soft regions and distinct accessible states', async () => {
  const source = await artifact()
  const css = cssFrom(source)
  assert.doesNotMatch(css, /--dsw-static-/u)
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/iu)
  assert.doesNotMatch(css, /var\(--dsw-(?:alias|specific)-[^)]*,/u)
  assert.doesNotMatch(css, /border-(?:right|bottom)\s*:/u)
  assert.match(css, /dsh-rice-panel \{[^}]*border:0;[^}]*background:var\(--dsw-specific-menu\);[^}]*box-shadow:var\(--dsw-shadow-lv2\);/u)
  assert.match(css, /dsh-rice-topline \{[^}]*border:0;[^}]*background:var\(--dsw-specific-selector\);/u)
  assert.match(css, /dsh-rice-row:hover \{ background:var\(--dsw-specific-sidebar-nav-item-hover\); \}/u)
  assert.match(css, /dsh-rice-row\[data-active="true"\] \{ background:var\(--dsw-specific-sidebar-nav-item-active\); \}/u)
  assert.match(css, /dsh-rice-row\[data-current="true"\] \{[^}]*sidebar-nav-item-active-accent[^}]*inset 3px 0 0 var\(--dsw-alias-brand-primary\)/u)
  assert.match(css, /dsh-rice-row:focus-visible \{ outline:2px solid var\(--dsw-alias-brand-primary\)/u)
  assert.match(source, /'aria-current':row\.current \? 'page' : undefined/u)
  assert.match(source, /onFocus:\(\) => \{ setActiveIndex\(index\) \}/u)
  assert.match(source, /'aria-live':'polite'/u)
})

test('session pulse is an additive input-dock surface with separated activity and temporal models', async () => {
  const source = await artifact()
  const css = cssFrom(source)
  assert.match(source, /ctx\.slots\.inject\('conversation\.input\.dock'/u)
  assert.match(source, /name:'conversation\.input\.dock', id:'dsh-rice\.pulse', order:20/u)
  assert.match(source, /derivePulseSignal\(sessionRef\.current, projectedStepsRef\.current, Date\.now\(\)\)/u)
  assert.match(source, /derivePulseActivity\(signal, samplesRef\.current, now\)/u)
  assert.match(source, /const timeline = new PulseTimeline/u)
  assert.match(source, /PULSE_DEFAULTS\.paperSpeedPxPerSecond/u)
  assert.match(source, /prefers-reduced-motion: reduce/u)
  assert.match(css, /\[data-dsh-rice-pulse\].*?background:var\(--dsw-specific-selector\)/su)
  assert.match(css, /data-mode="tool".*?--dsw-alias-state-warn-primary/su)
  assert.match(css, /data-mode="flat".*?--dsw-alias-state-error-primary/su)
})

test('browser artifact keeps Activity distinct from the full session switcher', async () => {
  const source = await artifact()
  assert.match(source, /attentionMode \? 'Activity' : 'Sessions'/u)
  assert.match(source, /attentionMode \? 'Search activity' : 'Search visible sessions'/u)
  assert.match(source, /attentionMode \? overviewGroups\(allGroups\) : allGroups/u)
  assert.doesNotMatch(source, /ui\.query\.trim\(\) === '' \? overviewGroups/u)
  assert.doesNotMatch(source, /row\.current \? '● '/u)
})
