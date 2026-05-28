import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const s = execSync('git show HEAD:pages/Reports.vue', { encoding: 'utf8', cwd: root })
const tpl = s.slice(s.indexOf('<template>'))
const anchor = tpl.indexOf('<!-- Контент зависит от выбранного отчёта -->')
const contentTpl = tpl.slice(anchor)

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

const dir = path.join(root, 'components/reports/views')

const srcStart = contentTpl.indexOf(`<template v-else-if="metric === 'Источники'">`)
const fbStart = contentTpl.indexOf('fallbackChartData') - 400
const fbTplStart = contentTpl.lastIndexOf('<template v-else>', srcStart)
// top-level fallback begins at the v-else before fallbackChartData comment
const fbBlockStart = contentTpl.indexOf(
  '<template v-else>\n      <!-- Остальные отчёты',
  srcStart,
)
const tooltipStart = contentTpl.indexOf('funnelStageSegmentTooltip.visible', fbBlockStart)

if (srcStart < 0 || fbBlockStart < 0 || tooltipStart < 0) {
  console.error('markers', srcStart, fbBlockStart, tooltipStart)
  process.exit(1)
}

const sourcesInner = extractInner(contentTpl.slice(srcStart, fbBlockStart))
fs.writeFileSync(
  path.join(dir, 'ReportsViewSources.vue'),
  scriptHeader + '<template>\n' + sourcesInner + '\n</template>\n',
)
console.log('sources', sourcesInner.length)

const fbBlock = contentTpl.slice(fbBlockStart, tooltipStart)
const closeIdx = fbBlock.lastIndexOf('</template>')
const fbInner = extractInner(fbBlock.slice(0, closeIdx + '</template>'.length))
fs.writeFileSync(
  path.join(dir, 'ReportsViewFallback.vue'),
  scriptHeader + '<template>\n' + fbInner + '\n</template>\n',
)
console.log('fallback', fbInner.length)
