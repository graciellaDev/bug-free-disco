import { execSync } from 'node:child_process'

const s = execSync('git show HEAD:pages/Reports.vue', { encoding: 'utf8' })
const anchor = s.indexOf('<!-- Контент зависит от выбранного отчёта -->')
const slice = s.slice(anchor)
for (const m of ['Источники', 'источник', 'Sources', 'possibleSources']) {
  let i = 0
  while ((i = slice.indexOf(m, i)) >= 0) {
    console.log(m, i, JSON.stringify(slice.slice(i - 40, i + 60)))
    i++
  }
}
