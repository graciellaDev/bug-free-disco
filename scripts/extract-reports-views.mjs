import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const s = execSync('git show HEAD:pages/Reports.vue', { encoding: 'utf8', cwd: root })
const tplStart = s.indexOf('<template>')
const tpl = s.slice(tplStart)
const anchor = tpl.indexOf('<!-- Контент зависит от выбранного отчёта -->')
if (anchor < 0) {
  console.error('content anchor not found')
  process.exit(1)
}
const contentTpl = tpl.slice(anchor)

const sections = [
  ['FunnelStatus', "metric === 'Воронка статусов по вакансии'", "metric === 'Отчет по отказам'"],
  ['Rejections', "metric === 'Отчет по отказам'", "metric === 'Поток кандидатов'"],
  ['FunnelFlow', "metric === 'Поток кандидатов'", "metric === 'Среднее время на этапе'"],
  ['StageAverage', "metric === 'Среднее время на этапе'", "metric === 'Отчет по рекрутерам'"],
  ['Recruiters', "metric === 'Отчет по рекрутерам'", "metric === 'Источники'"],
  ['Sources', "metric === 'Источники'", '<template v-else>'],
]

const dir = path.join(root, 'components/reports/views')
fs.mkdirSync(dir, { recursive: true })

const scriptHeader = `<script setup lang="ts">
import { useReportsContext } from '@/composables/reports/reportsContext'
const r = useReportsContext()
</script>

`

function extractInner(block) {
  let inner = block
  inner = inner.replace(/^<template v-(?:if|else-if)="[^"]+">\r?\n?/, '')
  inner = inner.replace(/\r?\n?\s*<\/template>\s*$/, '')
  return inner
}

for (const [name, startMark, endMark] of sections) {
  const markers = [
    `<template v-if="${startMark}"`,
    `<template v-else-if="${startMark}"`,
  ]
  let i0 = -1
  for (const m of markers) {
    const i = contentTpl.indexOf(m)
    if (i >= 0) {
      i0 = i
      break
    }
  }
  const i1 = contentTpl.indexOf(`<template v-else-if="${endMark}"`)
  const iElse = contentTpl.indexOf('<template v-else>')
  if (i0 < 0) {
    console.warn('skip', name)
    continue
  }
  const end = name === 'Sources' ? iElse : i1
  const inner = extractInner(contentTpl.slice(i0, end))
  const file = path.join(dir, `ReportsView${name}.vue`)
  fs.writeFileSync(file, scriptHeader + '<template>\n' + inner + '\n</template>\n')
  console.log('wrote', path.relative(root, file), inner.length)
}

const iElse = contentTpl.indexOf('<template v-else>')
const iEnd = contentTpl.lastIndexOf('</template>')
const fb = extractInner(contentTpl.slice(iElse, iEnd))
fs.writeFileSync(
  path.join(dir, 'ReportsViewFallback.vue'),
  scriptHeader + '<template>\n' + fb + '\n</template>\n',
)
console.log('wrote fallback', fb.length)
