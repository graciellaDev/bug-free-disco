import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const viewsDir = path.join(root, 'components/reports/views')

/** Идентификаторы из script Reports.vue (const/function), не трогаем v-for loop vars в шаблоне вручную. */
const reportsBindings = fs
  .readFileSync(path.join(root, 'pages/Reports.vue'), 'utf8')
  .match(/^(?:const|function|async function)\s+(\w+)/gm)
  ?.map((m) => m.replace(/^(?:const|function|async function)\s+/, '')) ?? []

const skip = new Set(['if', 'else', 'template', 'div', 'span', 'tr', 'td', 'th', 'ul', 'li', 'p', 'NuxtLink', 'svg', 'ListSectionPlaceholder', 'MyDropdown', 'MultiSelect', 'DropdownPeriodPicker', 'UiButton', 'TransitionGroup'])

const keys = [...new Set(reportsBindings)].filter((k) => !skip.has(k) && k.length > 1).sort((a, b) => b.length - a.length)

for (const file of fs.readdirSync(viewsDir)) {
  if (!file.endsWith('.vue')) continue
  const fp = path.join(viewsDir, file)
  let tpl = fs.readFileSync(fp, 'utf8')
  const m = tpl.match(/<template>([\s\S]*)<\/template>/)
  if (!m) continue
  let inner = m[1]
  for (const key of keys) {
    const re = new RegExp(`(?<![.\\w])${key}(?![\\w])`, 'g')
    inner = inner.replace(re, `r.${key}`)
  }
  // fix double r.r.
  inner = inner.replace(/\br\.r\./g, 'r.')
  tpl = tpl.replace(/<template>[\s\S]*<\/template>/, `<template>${inner}</template>`)
  fs.writeFileSync(fp, tpl)
  console.log('fixed', file)
}
