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

test('empty sidebar QA composer keeps the send arrow and uses opacity for disabled state', async () => {
  const source = await postlude()
  assert.match(source, /button::before \{\s*\n\s*content:'↑';/u)
  assert.match(source, /button:disabled \{\s*\n\s*opacity:\.45; cursor:default;/u)
  assert.doesNotMatch(source, /button:disabled::before/u)
})
