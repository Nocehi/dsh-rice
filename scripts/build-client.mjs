import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const corePath = resolve(root, 'src/core.js')
const clientPath = resolve(root, 'src/client.js')
const outputPath = resolve(root, 'lib/client.js')
const REACT_IMPORT = "import React from 'react'\n"
const CORE_IMPORT = "import { COMMAND_IDS, attentionCount, deriveSessionGroups, flattenGroups, nextMruId, overviewGroups, updateMru } from './core.js'\n"
const DECLARATION_EXPORT = /^export (?:const|class|function|async function) [A-Za-z_$][A-Za-z0-9_$]*/u
const DYNAMIC_IMPORT = /\bimport(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*(?:\r\n?|\n|$))*\(/u

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

const [coreSource, clientSource] = await Promise.all([readFile(corePath, 'utf8'), readFile(clientPath, 'utf8')])
if (/^\s*import\s/mu.test(coreSource)) throw new Error('dsh-rice build: src/core.js must remain dependency-free')
if (!clientSource.startsWith(REACT_IMPORT + CORE_IMPORT)) throw new Error('dsh-rice build: src/client.js imports must remain React then ./core.js, exactly')
const clientBody = clientSource.slice(REACT_IMPORT.length + CORE_IMPORT.length)
if (/^\s*import\s/mu.test(clientBody)) throw new Error('dsh-rice build: browser client contains an additional static import')

const core = stripModuleSyntax(coreSource, 'src/core.js')
const client = stripModuleSyntax(clientBody, 'src/client.js')
const artifact = [
  'window.__ModuleLoader__.load({ id: "dsh-rice", factory: (require) => {',
  "'use strict'",
  'var module = { exports: {} }; var exports = module.exports;',
  "const React = require('react');",
  '', core, '', client, '',
  'module.exports = { inject, COMMAND_IDS, apply };',
  'return module.exports;',
  '} });',
  '',
].join('\n')

if (/^\s*import\s/mu.test(artifact) || /\bexport\s/u.test(artifact)) throw new Error('dsh-rice build: generated browser artifact contains ESM syntax')
if (DYNAMIC_IMPORT.test(artifact)) throw new Error('dsh-rice build: generated browser artifact contains import()')
const requires = [...artifact.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/gu)].map(match => match[1])
if (requires.length !== 1 || requires[0] !== 'react') throw new Error(`dsh-rice build: generated artifact may require only React; got ${JSON.stringify(requires)}`)
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, artifact, 'utf8')
