import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const script = fs.readFileSync(path.join(root, 'pages/Reports.vue'), 'utf8')
const body = script.slice(script.indexOf('<script setup'), script.indexOf('</script>'))
const names = new Set()
for (const m of body.matchAll(/^const (\w+) =/gm)) names.add(m[1])
for (const m of body.matchAll(/^function (\w+)/gm)) names.add(m[1])
for (const m of body.matchAll(/^async function (\w+)/gm)) names.add(m[1])

const skip = new Set(['props', 'emit'])
const lines = [...names]
  .filter((n) => !skip.has(n))
  .sort()
  .map((n) => `  ${n},`)
  .join('\n')

const block = `
import { provide, reactive } from 'vue';
import { REPORTS_CONTEXT_KEY } from '@/composables/reports/reportsContext';

provide(
  REPORTS_CONTEXT_KEY,
  reactive({
${lines}
  }),
);
`

console.log(block)
fs.writeFileSync(path.join(root, 'scripts/reports-provide-snippet.txt'), block)
