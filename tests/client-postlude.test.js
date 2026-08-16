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

test('rail Sessions uses scanner choreography and Activity holds a staged shell reveal', async () => {
  const source = await artifact()
  const match = source.match(/const RICE_RAIL_MOTION_CSS = `([\s\S]*?)`\n/u)
  assert.notEqual(match, null)
  const css = match?.[1] ?? ''

  assert.match(source, /RailButton = function RiceAnimatedRailButton/u)
  assert.match(source, /iconPath === MATERIAL_SYMBOL_PATHS\.search/u)
  assert.match(source, /iconPath === MATERIAL_SYMBOL_PATHS\.add/u)
  assert.match(source, /iconPath === MATERIAL_SYMBOL_PATHS\.browseActivity/u)

  assert.match(source, /const RICE_SCAN_MOTION_PATHS = Object\.freeze/u)
  assert.match(source, /line1:'M15,9h2v14h-2V9z'/u)
  assert.match(source, /scanner:'M21,29H5c-1\.1,0-2-0\.9-2-2V5/u)
  assert.match(source, /viewBox:'0 0 32 32'/u)
  assert.match(source, /dsh-rice-motion-search-scanner/u)
  assert.match(source, /dsh-rice-motion-search-line-1/u)
  assert.match(source, /dsh-rice-motion-search-line-2/u)
  assert.match(source, /dsh-rice-motion-search-line-3/u)
  assert.match(css, /dsh-rice-search-scanner 2s cubic-bezier\(\.4,\.14,\.3,1\) infinite/u)
  assert.match(css, /10% \{ transform:translate3d\(4px,0,0\); \}/u)
  assert.match(css, /8% \{ transform:scaleY\(1\.3\); \}/u)
  assert.doesNotMatch(source, /dsh-rice-motion-search-lens|dsh-rice-motion-search-handle|dsh-rice-search-handle-nudge/u)

  assert.match(source, /const RICE_BROWSE_ACTIVITY_PATHS = Object\.freeze/u)
  assert.match(source, /shellTop:'M96-588/u)
  assert.match(source, /shellBottom:'M172\.69-264/u)
  assert.match(source, /baseline:'M84-144/u)
  assert.match(source, /waveform:'M96-516v-72/u)
  assert.match(source, /className:'dsh-rice-motion-activity-shell-top'/u)
  assert.match(source, /className:'dsh-rice-motion-activity-shell-bottom'/u)
  assert.match(source, /className:'dsh-rice-motion-activity-baseline'/u)
  assert.match(source, /className:'dsh-rice-motion-activity-waveform'/u)
  assert.match(css, /transition:clip-path 110ms cubic-bezier\(\.2,0,0,1\) 140ms/u)
  assert.match(css, /dsh-rice-motion-activity-baseline \{ clip-path:inset\(0 0 0 100%\); transition-delay:0ms; \}/u)
  assert.match(css, /dsh-rice-motion-activity-shell-bottom \{ clip-path:inset\(0 0 0 100%\); transition-delay:70ms; \}/u)
  assert.match(css, /dsh-rice-motion-activity-shell-top \{ clip-path:inset\(0 0 0 100%\); transition-delay:140ms; \}/u)
  assert.doesNotMatch(source, /dsh-rice-activity-waveform-nudge/u)

  assert.match(css, /dsh-rice-add-horizontal-nudge/u)
  assert.match(css, /dsh-rice-add-vertical-nudge/u)
  assert.match(css, /140ms cubic-bezier\(\.2,0,0,1\) 1 both/u)

  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/u)
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\) and \(hover:hover\) and \(pointer:fine\)/u)
  assert.doesNotMatch(source, /require\(['"](?:motion\/react|framer-motion|lucide-react|@fortawesome|@carbon\/icons-motion)/u)
})
