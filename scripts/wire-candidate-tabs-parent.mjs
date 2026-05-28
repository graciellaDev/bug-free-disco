import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const file = path.join(root, 'components/custom/page-parts/candidate/BlockCandidateTabsInfo.vue')
let s = fs.readFileSync(file, 'utf8')

if (!s.includes('defineAsyncComponent')) {
  s = s.replace(
    /from 'vue';\n/,
    "from 'vue';\n  import { defineAsyncComponent, computed, reactive } from 'vue';\n",
  )
  // dedupe - if provide already imported, fix
  s = s.replace(
    /import \{\s*([^}]+)\s*\} from 'vue';\s*import \{ defineAsyncComponent, computed, reactive \} from 'vue';/,
    (m, inner) => {
      const parts = new Set(
        inner
          .split(',')
          .map((x) => x.trim())
          .concat(['defineAsyncComponent', 'computed', 'reactive']),
      )
      return `import { ${[...parts].join(', ')} } from 'vue';`
    },
  )
}

if (!s.includes('CANDIDATE_CARD_CONTEXT_KEY')) {
  s = s.replace(
    /from 'vue';\n/,
    "from 'vue';\n  import { CANDIDATE_CARD_CONTEXT_KEY } from '@/components/custom/page-parts/candidate/candidateCardContext';\n",
  )
}

const tabMap = `
  const candidateTabComponents = {
    resume: defineAsyncComponent(() => import('./tabs/CandidateTabResume.vue')),
    fields: defineAsyncComponent(() => import('./tabs/CandidateTabFields.vue')),
    chat: defineAsyncComponent(() => import('./tabs/CandidateTabChat.vue')),
    review: defineAsyncComponent(() => import('./tabs/CandidateTabReview.vue')),
  };
  const activeCandidateTab = computed(
    () => candidateTabComponents[activeTab.value as keyof typeof candidateTabComponents],
  );
`

if (!s.includes('candidateTabComponents')) {
  const insertAt = s.indexOf('const hasAdditionalInfoSection')
  s = s.slice(0, insertAt) + tabMap + '\n  ' + s.slice(insertAt)
}

const snippet = fs.readFileSync(path.join(root, 'scripts/candidate-provide-snippet.txt'), 'utf8')
  .replace(/import \{ provide, reactive \} from 'vue';\n/, '')
  .replace(/import \{ CANDIDATE_CARD_CONTEXT_KEY \}[^;]+;\n\n/, '')

if (!s.includes('CANDIDATE_CARD_CONTEXT_KEY,')) {
  const endScript = s.lastIndexOf('</script>')
  s = s.slice(0, endScript) + '\n' + snippet.trim() + '\n' + s.slice(endScript)
}

const lines = s.split(/\r?\n/)
const start = lines.findIndex((l) => l.includes("v-if=\"activeTab === 'resume'\""))
const end = lines.findIndex((l, i) => i > start && l.includes("v-if=\"activeTab === 'review'"))
// find closing of review tab - line with considerations-block closing then </div> for min-h-0 flex-1
let reviewStart = lines.findIndex((l) => l.includes("v-if=\"activeTab === 'review'\""))
let closeIdx = reviewStart
let depth = 0
for (let i = reviewStart; i < lines.length; i++) {
  if (lines[i].includes('<div')) depth++
  if (lines[i].includes('</div>')) {
    depth--
    if (depth === 0 && i > reviewStart) {
      closeIdx = i
      break
    }
  }
}

// simpler: replace from resume start to line before CandidateAddCustomFieldPopup
const popupStart = lines.findIndex((l) => l.includes('<CandidateAddCustomFieldPopup'))
if (start >= 0 && popupStart > start) {
  const replacement = [
    '      <component :is="activeCandidateTab" :key="activeTab" />',
  ]
  lines.splice(start, popupStart - start, ...replacement)
  s = lines.join('\n')
}

fs.writeFileSync(file, s)
console.log('wired parent', start, popupStart)
