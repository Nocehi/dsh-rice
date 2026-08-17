import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const surfacePath = new URL('../src/surface-morph.js', import.meta.url)
const artifactPath = new URL('../lib/client.js', import.meta.url)

test('surface morph is an isolated sharp-DOM layer for Sessions and Activity', async () => {
  const source = await readFile(surfacePath, 'utf8')

  assert.match(source, /motion !== 'search' && motion !== 'activity'/u)
  assert.match(source, /Math\.min\(36, rect\.width\)/u)
  assert.match(source, /getBoundingClientRect\(\)/u)
  assert.match(source, /feGaussianBlur/u)
  assert.match(source, /feColorMatrix/u)
  assert.match(source, /className:'dsh-rice-surface-morph-tether'/u)
  assert.match(source, /React\.cloneElement\(base/u)
  assert.match(source, /panelIndex/u)

  assert.doesNotMatch(source, /liquid-gooey/u)
  assert.doesNotMatch(source, /^\s*(?:import|export)\s/mu)
})

test('surface morph preserves the browser require boundary and reduced-motion path', async () => {
  const source = await readFile(surfacePath, 'utf8')
  const artifact = await readFile(artifactPath, 'utf8')
  const requires = [...artifact.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/gu)].map(match => match[1])

  assert.deepEqual(requires, ['react', '@deepseek-ai/dsh-client-ui-primitives'])
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/u)
  assert.match(source, /\[data-dsh-rice-surface-morph-layer\] \{ display:none; \}/u)
  assert.match(source, /RiceSurfaceMorphApplicationRailBase/u)
  assert.match(source, /RiceQuickSwitcherOverlayBase\(props\)/u)
})
