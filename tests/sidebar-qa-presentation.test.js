import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function postlude() {
  return readFile('src/client-postlude.js', 'utf8')
}

test('sidebar QA selection styling is scoped to the plugin host and preserves coarse targets', async () => {
  const source = await postlude()
  assert.match(source, /\[data-dsh-sidebar-qa\] button \{/u)
  assert.match(source, /\[data-dsh-sidebar-qa\] button:hover/u)
  assert.match(source, /@media \(any-pointer: coarse\)[\s\S]*\[data-dsh-sidebar-qa\] button \{ min-width:44px; min-height:44px;/u)
  assert.doesNotMatch(source, /(?:^|\n)button \{/u)
})

test('sidebar QA AskPanel integration is optional, exact-id scoped, and reversible', async () => {
  const source = await postlude()
  assert.match(source, /ctx\.inject\(\['betterSidebar'\]/u)
  assert.match(source, /service\.getTab\('dsh-sidebar-qa:ask'\)/u)
  assert.match(source, /'data-dsh-rice-sidebar-qa':''/u)
  assert.match(source, /descriptor\.component = wrapped/u)
  assert.match(source, /descriptor\.component === wrapped/u)
  assert.match(source, /descriptor\.component = original/u)
})

test('sidebar QA skin consumes no CSS-module names and does not alter model policy', async () => {
  const source = await postlude()
  assert.doesNotMatch(source, /switcherActive|ask-panel\.module|selection-popover\.module/u)
  assert.doesNotMatch(source, /answerModel|summarizeModel|reasoningEffort|deepseek-v4/u)
  assert.match(source, /:has\(> textarea\)/u)
  assert.match(source, /:has\(> button\):not\(:has\(> textarea\)\)/u)
})

test('sidebar QA composer send action uses a circular optical seat and icon geometry', async () => {
  const source = await postlude()
  assert.match(source, /button \{\s*\n\s*position:absolute; right:14px; bottom:15px; width:36px; height:36px;/u)
  assert.match(source, /border-radius:50%;\s*\n\s*background:transparent;/u)
  assert.match(source, /button::after \{\s*\n\s*content:''; position:absolute; inset:0; border-radius:50%;\s*\n\s*background:var\(--dsw-alias-brand-primary\);/u)
  assert.match(source, /button::before \{[\s\S]*content:'';[\s\S]*mask:url\("data:image\/svg\+xml/u)
  assert.doesNotMatch(source, /content:'↑'/u)
})

test('coarse sidebar QA send target keeps a 36px optical circle inside a 44px hit target', async () => {
  const source = await postlude()
  assert.match(source, /button \{ right:14px; bottom:12px; width:44px; height:44px; \}/u)
  assert.match(source, /button::after \{ inset:4px; \}/u)
})

test('empty sidebar QA composer keeps the send icon and uses opacity for disabled state', async () => {
  const source = await postlude()
  assert.match(source, /button:disabled \{\s*\n\s*opacity:\.45; cursor:default;/u)
  assert.doesNotMatch(source, /button:disabled::before|button:disabled::after/u)
})
