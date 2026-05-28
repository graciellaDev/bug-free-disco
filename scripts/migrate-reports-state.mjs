import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const reportsPath = path.join(root, 'pages/Reports.vue')
const s = fs.readFileSync(reportsPath, 'utf8')
const scriptStart = s.indexOf('<script setup') 
const scriptOpenEnd = s.indexOf('>', scriptStart) + 1
const scriptEnd = s.indexOf('</script>', scriptOpenEnd)
let scriptBody = s.slice(scriptOpenEnd, scriptEnd).trim()

const names = new Set()
for (const m of scriptBody.matchAll(/^const (\w+) =/gm)) names.add(m[1])
for (const m of scriptBody.matchAll(/^function (\w+)/gm)) names.add(m[1])
for (const m of scriptBody.matchAll(/^async function (\w+)/gm)) names.add(m[1])

const returnKeys = [...names].sort().join(',\n  ')

const composable = `import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
${scriptBody.replace(/^import[\s\S]*?from ['"]vue['"];?\r?\n/m, '')}

export function useReportsPageState() {
${scriptBody
  .split('\n')
  .map((line) => (line.startsWith('import ') ? '' : '  ' + line))
  .filter(Boolean)
  .join('\n')}

  return {
  ${returnKeys},
  }
}
`

// Simpler: keep imports at top, wrap body in function
const importBlock = []
const bodyLines = []
for (const line of scriptBody.split('\n')) {
  if (line.startsWith('import ')) importBlock.push(line)
  else bodyLines.push(line)
}

const out = `${importBlock.join('\n')}

export function useReportsPageState() {
${bodyLines.join('\n')}

  return {
  ${returnKeys},
  }
}
`

fs.writeFileSync(path.join(root, 'composables/reports/useReportsPageState.ts'), out)
console.log('wrote useReportsPageState.ts', returnKeys.split(',').length, 'keys')
