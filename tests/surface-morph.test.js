import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/surface-morph.js', import.meta.url), 'utf8')

function expectSource(pattern, message) {
  assert.match(source, pattern, message)
}

test('local surface continuity is proximity gated to one 56px rail width', () => {
  expectSource(/RICE_LOCAL_SURFACE_DISTANCE_PX = 56/u)
  expectSource(/Math\.hypot\(dx, dy\)/u)
  expectSource(/geometry\.distance <= RICE_LOCAL_SURFACE_DISTANCE_PX/u)
  expectSource(/riceFacingAxisPoints/u)
})

test('standard accessible relationships drive the generic experiment', () => {
  expectSource(/\[aria-controls\]\[aria-expanded\], summary/u)
  expectSource(/getElementById/u)
  expectSource(/closest\?\.\('details'\)/u)
  expectSource(/MutationObserver/u)
  expectSource(/requestAnimationFrame/u)
  expectSource(/ResizeObserver/u)
})

test('local bridge is presentation only and reduced-motion safe', () => {
  expectSource(/pointer-events: none/u)
  expectSource(/aria-hidden/u)
  expectSource(/prefers-reduced-motion: reduce/u)
  assert.doesNotMatch(source, /setTimeout\s*\(/u)
  assert.doesNotMatch(source, /feGaussianBlur|rice-surface-goo|<filter|<use/u)
})

test('better sidebar integration uses the public service inside dsh-rice', () => {
  expectSource(/ctx\.inject\(\['betterSidebar'\]/u)
  expectSource(/service\.getSnapshot\(\)/u)
  expectSource(/service\.subscribeState\(refresh\)/u)
  expectSource(/snapshot\?\.state/u)
  expectSource(/data-rice-better-sidebar-panel-open/u)
  expectSource(/--rice-better-sidebar-width/u)
  assert.doesNotMatch(source, /\.dsh-better-sidebar|\[class\*=["']sidebar/u)
})

test('surface experiment composes after the existing rice apply wrapper', () => {
  expectSource(/const RiceLocalSurfaceApplyBase = apply/u)
  expectSource(/RiceLocalSurfaceApplyBase\(ctx\)/u)
  expectSource(/ctx\.effect\(\(\) => riceInstallLocalSurfaceContinuity\(document\)\)/u)
  expectSource(/globalThis\.RiceSurfaceMorph/u)
})
