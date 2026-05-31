/**
 * Снимает метрики производительности сборки (клиентские чанки + исходники).
 * Usage:
 *   node scripts/measure-performance.mjs
 *   node scripts/measure-performance.mjs --label after
 *   node scripts/measure-performance.mjs --git 944b900 --label before
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'

const root = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const labelIdx = args.indexOf('--label')
const label = labelIdx >= 0 ? args[labelIdx + 1] : 'current'
const gitIdx = args.indexOf('--git')
const gitRef = gitIdx >= 0 ? args[gitIdx + 1] : null

function readGitFile(ref, filePath) {
  return execSync(`git show ${ref}:${filePath}`, { encoding: 'utf8', cwd: root })
}

function countLines(s) {
  return s.split(/\r?\n/).length
}

function countPattern(s, re) {
  return (s.match(re) ?? []).length
}

const sourceFiles = [
  'pages/Reports.vue',
  'components/custom/page-parts/candidate/BlockCandidateTabsInfo.vue',
  'components/platforms/AddPublication.vue',
  'pages/create-tabs/PublishTab.vue',
  'nuxt.config.ts',
]

function sourceMetricsFromText(filePath, content) {
  return {
    path: filePath,
    lines: countLines(content),
    bytes: Buffer.byteLength(content, 'utf8'),
    tiptapImports: countPattern(content, /@tiptap\//g),
    lazyTiptap: content.includes('lazyTiptapEditor'),
    defineAsyncComponent: countPattern(content, /defineAsyncComponent/g),
  }
}

function collectSourceMetrics() {
  const files = {}
  for (const fp of sourceFiles) {
    const content = gitRef ? readGitFile(gitRef, fp) : fs.readFileSync(path.join(root, fp), 'utf8')
    files[fp] = sourceMetricsFromText(fp, content)
  }

  const extraChecks = [
    'components/reports/ReportsMetricRouter.vue',
    'utils/lazyTiptapEditor.ts',
    'components/custom/page-parts/candidate/tabs/CandidateTabResume.vue',
  ]
  const features = {}
  for (const fp of extraChecks) {
    try {
      const content = gitRef ? readGitFile(gitRef, fp) : fs.readFileSync(path.join(root, fp), 'utf8')
      features[fp] = { exists: true, bytes: Buffer.byteLength(content, 'utf8') }
    } catch {
      features[fp] = { exists: false }
    }
  }

  return { files, features }
}

function gzipSize(buf) {
  return gzipSync(buf).length
}

function collectClientChunks() {
  const clientDir = path.join(root, '.nuxt/dist/client/_nuxt')
  if (!fs.existsSync(clientDir)) {
    return { error: `Нет ${clientDir}. Сначала: npm run build` }
  }

  const patterns = [
    /^Reports[\.\-]/i,
    /^ReportsView/i,
    /^ReportsMetric/i,
    /^BlockCandidateTabsInfo/i,
    /^CandidateTab/i,
    /^AddPublication/i,
    /^PublishTab/i,
    /^publication-platform-/i,
    /tiptap/i,
    /^entry[\.\-]/i,
    /^default[\.\-]/i,
  ]

  const allJs = fs
    .readdirSync(clientDir)
    .filter((f) => f.endsWith('.js'))
    .map((name) => {
      const fp = path.join(clientDir, name)
      const buf = fs.readFileSync(fp)
      return {
        name,
        raw: buf.length,
        gzip: gzipSize(buf),
      }
    })

  const total = {
    count: allJs.length,
    raw: allJs.reduce((s, x) => s + x.raw, 0),
    gzip: allJs.reduce((s, x) => s + x.gzip, 0),
  }

  const groups = {}
  for (const p of patterns) {
    groups[p.source] = allJs.filter((x) => p.test(x.name))
  }

  const grouped = {}
  for (const [key, list] of Object.entries(groups)) {
    grouped[key] = {
      count: list.length,
      raw: list.reduce((s, x) => s + x.raw, 0),
      gzip: list.reduce((s, x) => s + x.gzip, 0),
      files: list.sort((a, b) => b.raw - a.raw).slice(0, 12),
    }
  }

  return { total, grouped, top20: [...allJs].sort((a, b) => b.raw - a.raw).slice(0, 20) }
}

const report = {
  label,
  gitRef: gitRef ?? execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: root }).trim(),
  measuredAt: new Date().toISOString(),
  source: collectSourceMetrics(),
  client: gitRef ? { skipped: 'client chunks только для рабочей копии после build' } : collectClientChunks(),
}

const outDir = path.join(root, '.cursor')
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, `perf-${label}.json`)
fs.writeFileSync(outFile, JSON.stringify(report, null, 2))

console.log(JSON.stringify(report, null, 2))
console.log(`\nSaved: ${path.relative(root, outFile)}`)
