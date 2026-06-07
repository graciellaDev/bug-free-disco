import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const file = path.join(root, 'components/custom/page-parts/candidate/BlockCandidateTabsInfo.vue')
let s = fs.readFileSync(file, 'utf8')

const sm = s.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)
if (!sm) throw new Error('no script')

const body = sm[1]
const topLevel = new Set()
for (const line of body.split('\n')) {
  const tm = line.match(/^  (?:const|let|function|async function)\s+(\w+)/)
  if (tm) topLevel.add(tm[1])
}

const uniq = [...topLevel].sort()
const snippet = `provide(
  CANDIDATE_CARD_CONTEXT_KEY,
  reactive({
${uniq.map((n) => `    ${n},`).join('\n')}
  }),
);`

s = s.replace(/provide\(\s*CANDIDATE_CARD_CONTEXT_KEY,[\s\S]*?\),\s*\);/m, snippet)
fs.writeFileSync(file, s)
console.log('top-level keys:', uniq.length)
