import fs from 'fs';

const page = 'pages/Reports.vue';
const snippet = fs.readFileSync('scripts/reports-provide-snippet.txt', 'utf8').trim();
let s = fs.readFileSync(page, 'utf8');

const start = s.indexOf('\nimport { provide, reactive } from \'vue\';');
const end = s.indexOf('\n</script>', start);
if (start < 0 || end < 0) {
  console.error('block not found', start, end);
  process.exit(1);
}
s = s.slice(0, start) + '\n\n' + snippet + s.slice(end);
fs.writeFileSync(page, s);
console.log('applied provide snippet');
