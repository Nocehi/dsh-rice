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

test('sidebar QA composer seat mirrors the audited DSH InputBar card surface', async () => {
  const source = await postlude()
  assert.match(source, /border:1px solid var\(--dsw-alias-border-l2-darkmode-thin\); border-radius:22px;/u)
  assert.match(source, /background:var\(--dsw-specific-input-major\);/u)
  assert.match(source, /box-shadow:var\(--dsw-shadow-lv2\);/u)
  assert.match(source, /textarea:focus,[\s\S]*border-color:var\(--dsw-alias-border-l2-darkmode-thin\); outline:none; box-shadow:var\(--dsw-shadow-lv2\);/u)
  assert.doesNotMatch(source, /textarea:focus[^}]*outline:2px solid var\(--dsw-alias-brand-primary\)/u)
})

test('sidebar QA send action mirrors the audited DSH InputBar primary geometry', async () => {
  const source = await postlude()
  assert.match(source, /button \{\s*\n\s*position:absolute; right:15px; bottom:16px; width:34px; height:34px;/u)
  assert.match(source, /border-radius:999px;\s*\n\s*background:transparent; color:#fff;/u)
  assert.match(source, /button::after \{[\s\S]*background:var\(--dsw-alias-button-info-fill\);/u)
  assert.match(source, /button:hover:not\(:disabled\)::after \{\s*\n\s*background:var\(--dsw-alias-button-info-hover\);/u)
  assert.match(source, /button::before \{[\s\S]*width:16px; height:16px;[\s\S]*M8\.3125%200\.980183/u)
  assert.doesNotMatch(source, /content:'↑'/u)
})

test('coarse sidebar QA send target keeps the InputBar 34px optical circle inside a 44px hit target', async () => {
  const source = await postlude()
  assert.match(source, /button \{ right:10px; bottom:11px; width:44px; height:44px; \}/u)
  assert.match(source, /button::after \{ inset:5px; \}/u)
})

test('empty sidebar QA composer keeps the send icon and InputBar disabled opacity', async () => {
  const source = await postlude()
  assert.match(source, /button:disabled \{\s*\n\s*opacity:\.4; cursor:default;/u)
  assert.doesNotMatch(source, /button:disabled::before|button:disabled::after/u)
})
