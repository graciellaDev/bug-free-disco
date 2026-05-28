import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const parentScript = fs.readFileSync(
  path.join(root, 'components/custom/page-parts/candidate/BlockCandidateTabsInfo.vue'),
  'utf8',
)
const bindings = [
  ...(parentScript.match(/^\s*(?:const|let|function|async function)\s+(\w+)/gm) ?? []),
].map((m) => m.replace(/^\s*(?:const|let|function|async function)\s+/, ''))

const skip = new Set([
  'if',
  'else',
  'template',
  'div',
  'span',
  'tr',
  'td',
  'th',
  'ul',
  'li',
  'p',
  'NuxtLink',
  'svg',
  'BtnTab',
  'TextWithLinks',
  'CandidateLog',
  'ChatInput',
  'text',
  'row',
  'name',
  'type',
  'from',
  'true',
  'null',
  'Date',
  'File',
  'String',
  'Number',
  'Object',
  'Array',
])

const keys = [...new Set(bindings)]
  .filter((k) => k.length >= 4 && !skip.has(k))
  .sort((a, b) => b.length - a.length)

const tabsDir = path.join(root, 'components/custom/page-parts/candidate/tabs')
for (const file of fs.readdirSync(tabsDir)) {
  if (!file.endsWith('.vue')) continue
  const fp = path.join(tabsDir, file)
  let tpl = fs.readFileSync(fp, 'utf8')
  const m = tpl.match(/<template>([\s\S]*)<\/template>/)
  if (!m) continue
  let inner = m[1]
  for (const key of keys) {
    const re = new RegExp(`(?<![.\\w-])${key}(?![\\w-])`, 'g')
    inner = inner.replace(re, `c.${key}`)
  }
  inner = inner.replace(/\bc\.c\./g, 'c.')
  inner = inner.replace(/:c\.text=/g, ':text=')
  tpl = tpl.replace(/<template>[\s\S]*<\/template>/, `<template>${inner}</template>`)
  fs.writeFileSync(fp, tpl)
  console.log('fixed', file)
}
