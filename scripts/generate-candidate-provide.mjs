import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const script = fs.readFileSync(
  path.join(root, 'components/custom/page-parts/candidate/BlockCandidateTabsInfo.vue'),
  'utf8',
)
const m = script.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)
if (!m) throw new Error('no script')
const names = [
  ...m[1].matchAll(/^\s*(?:const|let|function|async function)\s+(\w+)/gm),
].map((x) => x[1])
const uniq = [...new Set(names)].sort()
const snippet = `
import { provide, reactive } from 'vue';
import { CANDIDATE_CARD_CONTEXT_KEY } from '@/components/custom/page-parts/candidate/candidateCardContext';

provide(
  CANDIDATE_CARD_CONTEXT_KEY,
  reactive({
${uniq.map((n) => `    ${n},`).join('\n')}
  }),
);
`
fs.writeFileSync(path.join(root, 'scripts/candidate-provide-snippet.txt'), snippet)
console.log('keys', uniq.length)
