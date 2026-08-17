import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/surface-morph-candidates.js', import.meta.url), 'utf8')

function expectSource(pattern, message) {
  assert.match(source, pattern, message)
}

test('fresh semantic popup surfaces are discovered without private host selectors', () => {
  expectSource(/\[role="menu"\],\[role="listbox"\],\[role="dialog"\]/u)
  expectSource(/querySelectorAll\('\[popover\]'\)/u)
  expectSource(/:popover-open/u)
  expectSource(/RICE_CANDIDATE_SETTLE_FRAMES = 18/u)
  expectSource(/requestAnimationFrame\(discover\)/u)
  expectSource(/MutationObserver/u)
  expectSource(/ResizeObserver/u)
  assert.doesNotMatch(source, /\.dsh-better-sidebar|\[class\*=["']sidebar/u)
})

test('semantic popup bridge stays within the core 56px locality contract', () => {
  expectSource(/globalThis\.RiceSurfaceMorph\?\.LOCAL_SURFACE_DISTANCE_PX \?\? 56/u)
  expectSource(/geometry\.distance > riceCandidateLocalLimit\(\)/u)
  expectSource(/data-rice-candidate-surface-source/u)
  expectSource(/data-rice-candidate-surface-target/u)
  expectSource(/pointer-events:none/u)
})

test('better-sidebar bloom is service-state driven and local to the top-right corner', () => {
  expectSource(/ctx\.inject\(\['betterSidebar'\]/u)
  expectSource(/service\.getSnapshot\(\)/u)
  expectSource(/service\.subscribeState\(refresh\)/u)
  expectSource(/panelOpen/u)
  expectSource(/RICE_BETTER_SIDEBAR_EDGE_PX = 112/u)
  expectSource(/RICE_BETTER_SIDEBAR_TOP_PX = 112/u)
  expectSource(/riceBetterSidebarCornerPatch/u)
  expectSource(/data-rice-better-sidebar-bloom/u)
  assert.doesNotMatch(source, /querySelector\([^\n]*better-sidebar/u)
})

test('better-sidebar bloom is short, reversible, pointer inert and reduced-motion safe', () => {
  expectSource(/RICE_BETTER_SIDEBAR_BLOOM_MS = 180/u)
  expectSource(/opening\s*\? \[sourceFrame/u)
  expectSource(/prefers-reduced-motion: reduce/u)
  expectSource(/layer\.animate/u)
  expectSource(/pointer-events:none/u)
  assert.doesNotMatch(source, /setTimeout\s*\(/u)
})

test('candidate experiment composes after the core surface-morph apply wrapper', () => {
  expectSource(/const RiceSurfaceCandidatesApplyBase = apply/u)
  expectSource(/RiceSurfaceCandidatesApplyBase\(ctx\)/u)
  expectSource(/ctx\.effect\(\(\) => riceInstallSemanticSurfaceEmergence\(document\)\)/u)
  expectSource(/globalThis\.RiceSurfaceCandidates/u)
})
