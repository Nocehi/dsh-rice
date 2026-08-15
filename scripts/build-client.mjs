import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const corePath = resolve(root, 'src/core.js')
const clientPath = resolve(root, 'src/client.js')
const postludePath = resolve(root, 'src/client-postlude.js')
const outputPath = resolve(root, 'lib/client.js')
const REACT_IMPORT = "import React from 'react'\n"
const CORE_IMPORT = "import { COMMAND_IDS, attentionCount, deriveSessionGroups, flattenGroups, nextMruId, overviewGroups, updateMru } from './core.js'\n"
const UI_PRIMITIVES_IMPORT = "import { FishLogo } from '@deepseek-ai/dsh-client-ui-primitives'\n"
const CLIENT_IMPORTS = REACT_IMPORT + CORE_IMPORT + UI_PRIMITIVES_IMPORT
const DECLARATION_EXPORT = /^export (?:const|class|function|async function) [A-Za-z_$][A-Za-z0-9_$]*/u
const DYNAMIC_IMPORT = /\bimport(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*(?:\r\n?|\n|$))*\(/u
const EXPECTED_REQUIRES = Object.freeze(['react', '@deepseek-ai/dsh-client-ui-primitives'])

function assertNoDynamicImport(source, label) {
  if (DYNAMIC_IMPORT.test(source)) throw new Error(`dsh-rice build: dynamic import() is forbidden in ${label}`)
}

function stripModuleSyntax(source, label) {
  assertNoDynamicImport(source, label)
  for (const line of source.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('export ')) continue
    if (DECLARATION_EXPORT.test(trimmed)) continue
    throw new Error(`dsh-rice build: unsupported export syntax in ${label}: ${JSON.stringify(trimmed)}`)
  }
  const transformed = source.replace(/^export\s+/gmu, '')
  if (/^\s*(?:import|export)\s/mu.test(transformed)) throw new Error(`dsh-rice build: unsupported ESM syntax remains in ${label}`)
  return transformed.trimEnd()
}

const [coreSource, clientSource, postludeSource] = await Promise.all([
  readFile(corePath, 'utf8'),
  readFile(clientPath, 'utf8'),
  readFile(postludePath, 'utf8'),
])
if (/^\s*import\s/mu.test(coreSource)) throw new Error('dsh-rice build: src/core.js must remain dependency-free')
if (/^\s*(?:import|export)\s/mu.test(postludeSource)) throw new Error('dsh-rice build: src/client-postlude.js must remain a dependency-free script')
if (!clientSource.startsWith(CLIENT_IMPORTS)) {
  throw new Error('dsh-rice build: src/client.js imports must remain React, ./core.js, then DSH UI primitives, exactly')
}
const clientBody = clientSource.slice(CLIENT_IMPORTS.length)
if (/^\s*import\s/mu.test(clientBody)) throw new Error('dsh-rice build: browser client contains an additional static import')

const core = stripModuleSyntax(coreSource, 'src/core.js')
const client = stripModuleSyntax(clientBody, 'src/client.js')
const postlude = stripModuleSyntax(postludeSource, 'src/client-postlude.js')
const artifact = [
  'window.__ModuleLoader__.load({ id: "dsh-rice", factory: (require) => {',
  "'use strict'",
  'var module = { exports: {} }; var exports = module.exports;',
  "const React = require('react');",
  "const { FishLogo } = require('@deepseek-ai/dsh-client-ui-primitives');",
  '', core, '', client, '', postlude, '',
  'module.exports = { inject, COMMAND_IDS, apply };',
  'return module.exports;',
  '} });',
  '',
].join('\n')

if (/^\s*import\s/mu.test(artifact) || /\bexport\s/u.test(artifact)) throw new Error('dsh-rice build: generated browser artifact contains ESM syntax')
if (DYNAMIC_IMPORT.test(artifact)) throw new Error('dsh-rice build: generated browser artifact contains import()')
const requires = [...artifact.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/gu)].map(match => match[1])
if (JSON.stringify(requires) !== JSON.stringify(EXPECTED_REQUIRES)) {
  throw new Error(`dsh-rice build: generated artifact requires must be ${JSON.stringify(EXPECTED_REQUIRES)}; got ${JSON.stringify(requires)}`)
}
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, artifact, 'utf8')
