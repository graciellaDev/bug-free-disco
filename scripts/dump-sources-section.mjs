import { execSync } from 'node:child_process'

const s = execSync('git show HEAD:pages/Reports.vue', { encoding: 'utf8' })
const tpl = s.slice(s.indexOf('<template>'))
const anchor = tpl.indexOf('<!-- Контент зависит от выбранного отчёта -->')
const contentTpl = tpl.slice(anchor)
const srcStart = contentTpl.indexOf(`<template v-else-if="metric === 'Источники'">`)
const nextMetric = contentTpl.indexOf('<template v-else>', srcStart)
// find all template v-else positions after srcStart
let i = srcStart
let n = 0
while (n < 5) {
  const j = contentTpl.indexOf('<template v-else>', i + 1)
  if (j < 0) break
  console.log(n, j, JSON.stringify(contentTpl.slice(j, j + 80)))
  i = j
  n++
}
const fb = contentTpl.indexOf('fallbackChartData')
console.log('fallbackChartData at', fb)
console.log('slice at fb-200:', contentTpl.slice(fb - 300, fb + 100))
