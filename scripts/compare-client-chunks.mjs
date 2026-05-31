import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const dirs = [
  ['after', path.resolve('c:/myinfo/Github/bug-free-disco/.nuxt/dist/client/_nuxt')],
  ['before', path.resolve('c:/myinfo/Github/bug-free-disco-perf-before/.nuxt/dist/client/_nuxt')],
]

function gzipSize(buf) {
  return gzipSync(buf).length
}

function scan(dir) {
  if (!fs.existsSync(dir)) return null
  const js = fs.readdirSync(dir).filter((f) => f.endsWith('.js'))
  const all = js.map((name) => {
    const buf = fs.readFileSync(path.join(dir, name))
    return { name, raw: buf.length, gzip: gzipSize(buf), text: buf.toString('utf8', 0, Math.min(buf.length, 500000)) }
  })
  const total = {
    count: all.length,
    raw: all.reduce((s, x) => s + x.raw, 0),
    gzip: all.reduce((s, x) => s + x.gzip, 0),
  }

  const needles = [
    'ReportsMetricRouter',
    'ReportsViewFunnelStatus',
    'ReportsViewRejections',
    'ReportsViewFunnelFlow',
    'ReportsViewStageAverage',
    'ReportsViewRecruiters',
    'ReportsViewSources',
    'ReportsViewFallback',
    'CandidateTabResume',
    'CandidateTabFields',
    'CandidateTabChat',
    'CandidateTabReview',
    'BlockCandidateTabsInfo',
    'AddPublication',
    'PublishTab',
    'publication-platform-hh',
    'publication-platform-avito',
    'publication-platform-rabota',
    'publication-platform-superjob',
    'LazyTiptapEditor',
    '@tiptap/',
    'getCandidatesAllPages',
    'METRICS_NEEDING_ALL_CANDIDATES',
  ]

  const hits = {}
  for (const n of needles) {
    const matched = all.filter((x) => x.text.includes(n))
    hits[n] = {
      chunks: matched.length,
      raw: matched.reduce((s, x) => s + x.raw, 0),
      gzip: matched.reduce((s, x) => s + x.gzip, 0),
      files: matched.map((x) => ({ name: x.name, raw: x.raw, gzip: x.gzip })).sort((a, b) => b.raw - a.raw),
    }
  }

  return { total, hits, top10: [...all].sort((a, b) => b.raw - a.raw).slice(0, 10).map(({ name, raw, gzip }) => ({ name, raw, gzip })) }
}

const out = {}
for (const [label, dir] of dirs) out[label] = scan(dir)
console.log(JSON.stringify(out, null, 2))
