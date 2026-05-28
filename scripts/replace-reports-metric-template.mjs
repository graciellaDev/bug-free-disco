import fs from 'fs';

const p = 'pages/Reports.vue';
let s = fs.readFileSync(p, 'utf8');
const start = '    <!-- Контент зависит от выбранного отчёта -->';
const end = '    <div\n      v-if="funnelStageSegmentTooltip.visible"';
const i0 = s.indexOf(start);
const i1 = s.indexOf(end);
if (i0 < 0 || i1 < 0) {
  console.error('markers not found', i0, i1);
  process.exit(1);
}
s = s.slice(0, i0) + '    <ReportsMetricRouter />\n\n' + s.slice(i1);
fs.writeFileSync(p, s);
console.log('replaced', i1 - i0, 'chars');
