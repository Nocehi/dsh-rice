import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'

async function namespace() {
  const artifact = await readFile('lib/client.js', 'utf8')
  let exported
  const fakeReact = {
    createElement(type, props, ...children){ return { type, props:props ?? {}, children } },
    Fragment:Symbol('Fragment'),
    useSyncExternalStore(){},
    useMemo(){},
    useLayoutEffect(){},
    useEffect(){},
    useRef(){},
    useState(){},
  }
  const primitives = { FishLogo(){} }
  const window = { __ModuleLoader__:{ load:({ factory }) => { exported = factory(name => name === 'react' ? fakeReact : primitives) } } }
  vm.runInNewContext(artifact, { window, console, Set, Map, Object, Number, String, Array, Date, Math })
  return exported
}

function source(snapshot) {
  const listeners = new Set()
  return { getSnapshot:() => snapshot, subscribe:listener => { listeners.add(listener); return () => { listeners.delete(listener) } } }
}

function context(sidebarEntries = [], betterSidebar) {
  const registrations = []
  const sessions = source({ ids:[], byId:{}, current:undefined })
  const workspaces = source({ items:[], archivedSessionIds:[] })
  const ctx = {
    registrations,
    injectionCleanup:undefined,
    effect(factory){ return factory() },
    layout:{ toggleSidebar(){} },
    sessions:{ list:sessions, open(){} },
    workspaces:{ list:workspaces, startSession(){} },
    slots:{ entries(name){ return name === 'sidebar' ? sidebarEntries : [] }, inject(_name,factory){ return factory() }, register(options,component){ registrations.push({ options, component }); return () => {} } },
  }
  ctx.inject = (deps, callback) => {
    if (betterSidebar === undefined || !deps.includes('betterSidebar')) return () => {}
    const cleanup = callback({ ...ctx, betterSidebar })
    ctx.injectionCleanup = typeof cleanup === 'function' ? cleanup : undefined
    return ctx.injectionCleanup ?? (() => {})
  }
  return ctx
}

test('apply replaces sidebar, adds shell overlay, and contributes composer-footer session telemetry', async () => {
  const client = await namespace()
  const ctx = context()
  client.apply(ctx)
  assert.equal(ctx.registrations.length, 3)
  const sidebar = ctx.registrations.find(item => item.options.name === 'sidebar')
  const overlay = ctx.registrations.find(item => item.options.name === 'shell.overlay')
  const pulse = ctx.registrations.find(item => item.options.name === 'conversation.composer.dock')
  assert.ok(sidebar)
  assert.ok(overlay)
  assert.ok(pulse)
  assert.deepEqual(Object.keys(sidebar.options.children).sort(), ['sidebar.footer.action','sidebar.settings','sidebar.workspaces'])
  assert.equal(overlay.options.id, 'dsh-rice.switcher')
  assert.equal(pulse.options.id, 'dsh-rice.pulse')
  assert.equal(pulse.options.order, -10)
})

test('apply fails loud when upstream ui-sidebar still occupies the single slot', async () => {
  const client = await namespace()
  assert.throws(() => client.apply(context([{ options:{ id:'upstream' } }])), /disable the ui-sidebar row/u)
})

test('apply optionally wraps and restores the exact sidebar QA Ask descriptor', async () => {
  const client = await namespace()
  const original = () => null
  const descriptor = { id:'dsh-sidebar-qa:ask', component:original }
  const listeners = new Set()
  const service = {
    getTab(id){ return id === descriptor.id ? descriptor : undefined },
    subscribe(listener){ listeners.add(listener); return () => { listeners.delete(listener) } },
  }
  const ctx = context([], service)

  client.apply(ctx)
  assert.notEqual(descriptor.component, original)

  const rendered = descriptor.component({ example:true })
  assert.equal(rendered.type, 'div')
  assert.equal(rendered.props['data-dsh-rice-sidebar-qa'], '')
  assert.equal(rendered.children[0].type, original)
  assert.equal(listeners.size, 1)

  ctx.injectionCleanup?.()
  assert.equal(descriptor.component, original)
  assert.equal(listeners.size, 0)
})
