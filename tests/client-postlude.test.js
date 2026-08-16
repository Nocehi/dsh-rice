import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import test from 'node:test'

const execFileAsync = promisify(execFile)

async function artifact() {
  await execFileAsync(process.execPath, ['scripts/build-client.mjs'], { cwd:process.cwd() })
  return readFile('lib/client.js', 'utf8')
}

test('client postlude keeps tooltip compatibility semantic-only', async () => {
  const source = await artifact()
  assert.match(source, /span\[role="tooltip"\] \{ color:var\(--dsw-alias-label-primary-inverted\); \}/u)
  assert.doesNotMatch(source, /span\[role="tooltip"\][^\n]*#[0-9a-f]{3,8}/iu)
})

test('client postlude themes the vanilla hero glow and Preview through semantic roles', async () => {
  const source = await artifact()
  assert.match(source, /svg\[viewBox="0 0 1051 468"\] \{ color:var\(--dsw-alias-state-business-primary\); \}/u)
  assert.match(source, /svg\[viewBox="0 0 1051 468"\] ellipse \{ fill:currentColor; \}/u)
  assert.match(source, /grid-template-columns:34px auto 0; transform:translateX\(5px\);/u)
  assert.match(source, /> span:nth-child\(3\) \{ position:absolute; justify-self:start; background:transparent; color:var\(--dsw-alias-state-business-tertiary\); border-color:var\(--dsw-alias-border-l2-darkmode-thin\); \}/u)
  assert.doesNotMatch(source, /#6187D8/u)
})

test('client postlude themes the active Chat turn-status shimmer without owning its copy or timing', async () => {
  const source = await artifact()
  const match = source.match(/\[data-conversation-scroll\] div\[role="status"\]\[aria-live="polite"\] \{([\s\S]*?)\n\}/u)
  assert.notEqual(match, null)
  const rule = match?.[1] ?? ''
  assert.match(rule, /background-image:linear-gradient\(/u)
  assert.match(rule, /var\(--dsw-alias-state-business-primary\) 40%/u)
  assert.match(rule, /color-mix\(in srgb, var\(--dsw-alias-state-business-primary\) 58%, var\(--dsw-alias-label-primary-foreground\)\) 50%/u)
  assert.doesNotMatch(rule, /--dsw-static-deepseek-/u)
  assert.doesNotMatch(rule, /Deep diving|深度求索中|正在深潛/u)
  assert.doesNotMatch(rule, /animation|background-position|background-size|text-fill/u)
})

test('adaptive interaction uses coarse-pointer capability while preserving the 36px optical rail seat', async () => {
  const source = await artifact()
  assert.match(source, /@media \(any-pointer: coarse\)/u)
  assert.match(source, /dsh-rice-rail-button \{ width:44px; height:44px; background:transparent; \}/u)
  assert.match(source, /dsh-rice-rail-button::before \{[^}]*inset:4px;[^}]*border-radius:12px;/u)
  assert.match(source, /dsh-rice-search,\s*\n\s*\[data-dsh-rice-switcher\] \.dsh-rice-new \{ min-height:44px; \}/u)
  assert.doesNotMatch(source, /navigator\.userAgent|device-width|\biPad\b|\biPhone\b|\bAndroid\b/u)
})

test('switcher adapts from its own container before changing navigation topology', async () => {
  const source = await artifact()
  assert.match(source, /dsh-rice-panel \{ container-type:inline-size; \}/u)
  assert.match(source, /@container \(max-width:520px\)/u)
  assert.match(source, /dsh-rice-new \{ inline-size:44px; min-width:44px; padding-inline:0; font-size:0; \}/u)
  assert.match(source, /dsh-rice-new::before \{ content:'\+'; font-size:18px; line-height:1; \}/u)
  assert.doesNotMatch(source, /@media \([^)]*(?:min|max)-width/u)
})

test('client postlude closes the switcher from any focused descendant', async () => {
  const source = await artifact()
  assert.match(source, /QuickSwitcherOverlay = function RiceQuickSwitcherOverlay/u)
  assert.match(source, /onKeyDownCapture/u)
  assert.match(source, /event\.key !== 'Escape'/u)
  assert.match(source, /event\.stopPropagation\(\)/u)
})

test('client postlude gives duplicate rows deterministic announcement identity', async () => {
  const source = await artifact()
  assert.match(source, /const identity = `session \$\{row\.id\}`/u)
  assert.match(source, /activeAnnouncement = function riceActiveAnnouncement/u)
})

test('rail Material Symbols gain bounded semantic micro-motion without a new icon or motion dependency', async () => {
  const source = await artifact()
  assert.match(source, /RailButton = function RiceAnimatedRailButton/u)
  assert.match(source, /iconPath === MATERIAL_SYMBOL_PATHS\.search/u)
  assert.match(source, /iconPath === MATERIAL_SYMBOL_PATHS\.add/u)
  assert.match(source, /iconPath === MATERIAL_SYMBOL_PATHS\.browseActivity/u)
  assert.match(source, /riceRailMotionPart\([^)]*h\(MaterialSymbol/su)
  assert.match(source, /dsh-rice-motion-search-lens \{ clip-path:polygon/u)
  assert.match(source, /dsh-rice-motion-search-handle \{ clip-path:polygon/u)
  assert.match(source, /dsh-rice-motion-add-horizontal \{ clip-path:inset/u)
  assert.match(source, /dsh-rice-motion-add-vertical \{ clip-path:inset/u)
  assert.match(source, /data-dsh-rice-motion="activity".*?dsh-rice-motion-activity-whole/su)
  assert.match(source, /@media \(prefers-reduced-motion: no-preference\)/u)
  assert.match(source, /@media \(prefers-reduced-motion: no-preference\) and \(hover:hover\) and \(pointer:fine\)/u)
  assert.doesNotMatch(source, /require\(['"](?:motion\/react|framer-motion|lucide-react|@fortawesome)/u)
})
