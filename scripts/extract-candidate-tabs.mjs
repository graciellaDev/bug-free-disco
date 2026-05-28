import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const file = path.join(root, 'components/custom/page-parts/candidate/BlockCandidateTabsInfo.vue')
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)

/** Inner content only (without tab wrapper div). */
const tabs = [
  ['Resume', 2844, 3247],
  ['Fields', 3250, 3772],
  ['Chat', 3775, 3803],
  ['Review', 3806, 3859],
]

const dir = path.join(root, 'components/custom/page-parts/candidate/tabs')
fs.mkdirSync(dir, { recursive: true })

const scriptHeader = `<script setup lang="ts">
import { useCandidateCardContext } from '@/components/custom/page-parts/candidate/candidateCardContext'
const c = useCandidateCardContext()
</script>

`

for (const [name, start, end] of tabs) {
  const inner = lines.slice(start - 1, end).join('\n')
  const out = path.join(dir, `CandidateTab${name}.vue`)
  fs.writeFileSync(out, scriptHeader + '<template>\n' + inner + '\n</template>\n')
  console.log('wrote', path.relative(root, out), inner.length)
}
