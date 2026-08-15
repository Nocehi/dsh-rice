import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'

async function namespace() {
  const artifact = await readFile('lib/client.js', 'utf8')
  let exported
  const fakeReact = { createElement(){}, Fragment:Symbol('Fragment'), useSyncExternalStore(){}, useMemo(){}, useLayoutEffect(){}, useEffect(){}, useRef(){}, useState(){} }
  const window = { __ModuleLoader__:{ load:({ factory }) => { exported = factory(() => fakeReact) } } }
  vm.runInNewContext(artifact, { window, console, Set, Map, Object, Number, String, Array })
  return exported
}

function source(snapshot) {
  const listeners = new Set()
  return { getSnapshot:() => snapshot, subscribe:listener => { listeners.add(listener); return () => { listeners.delete(listener) } } }
}

function context(sidebarEntries = []) {
  const registrations = []
  const sessions = source({ ids:[], byId:{}, current:undefined })
  const workspaces = source({ items:[], archivedSessionIds:[] })
  return {
    registrations,
    effect(factory){ return factory() },
    layout:{ toggleSidebar(){} },
    sessions:{ list:sessions, open(){} },
    workspaces:{ list:workspaces, startSession(){} },
    slots:{ entries(name){ return name === 'sidebar' ? sidebarEntries : [] }, inject(_name,factory){ return factory() }, register(options,component){ registrations.push({ options, component }); return () => {} } },
  }
}

test('apply replaces the sidebar surface contract and adds one shell overlay', async () => {
  const client = await namespace()
  const ctx = context()
  client.apply(ctx)
  assert.equal(ctx.registrations.length, 2)
  const sidebar = ctx.registrations.find(item => item.options.name === 'sidebar')
  const overlay = ctx.registrations.find(item => item.options.name === 'shell.overlay')
  assert.ok(sidebar)
  assert.ok(overlay)
  assert.deepEqual(Object.keys(sidebar.options.children).sort(), ['sidebar.footer.action','sidebar.settings','sidebar.workspaces'])
  assert.equal(overlay.options.id, 'dsh-rice.switcher')
})

test('apply fails loud when upstream ui-sidebar still occupies the single slot', async () => {
  const client = await namespace()
  assert.throws(() => client.apply(context([{ options:{ id:'upstream' } }])), /disable the ui-sidebar row/u)
})
