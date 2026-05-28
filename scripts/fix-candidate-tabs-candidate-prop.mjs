import fs from 'node:fs'
import path from 'node:path'

const tabsDir = path.join(path.resolve(import.meta.dirname, '..'), 'components/custom/page-parts/candidate/tabs')
for (const file of fs.readdirSync(tabsDir)) {
  if (!file.endsWith('.vue')) continue
  const fp = path.join(tabsDir, file)
  let s = fs.readFileSync(fp, 'utf8')
  s = s.replace(/(?<![\w-])candidate(?=[?.)\s])/g, 'c.props.candidate')
  fs.writeFileSync(fp, s)
  console.log('candidate prop', file)
}
