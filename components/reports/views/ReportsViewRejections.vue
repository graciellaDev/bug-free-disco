<script setup lang="ts">
import { useReportsContext } from '@/composables/reports/reportsContext'
const r = useReportsContext()
</script>

<template>
      <div class="rounded-fifteen bg-white p-25px shadow-sm sm:px-[50px]">
        <p class="mb-6 text-lg font-bold text-space">
          Отчет по отказам
        </p>
        <template v-if="!r.selectedVacancy">
          <ListSectionPlaceholder
            variant="reports"
            title="Выберите вакансию"
            description="Выберите вакансию в фильтрах выше, чтобы открыть отчёт."
          />
        </template>
        <template v-else-if="r.rejectionReportLoading">
          <ListSectionPlaceholder variant="reports" loading loading-title="Загрузка данных…" />
        </template>
        <template v-else-if="r.rejectionReportError">
          <p class="py-8 text-center text-red-custom">{{ r.rejectionReportError }}</p>
        </template>
        <template v-else-if="!r.rejectionReportDisplayRows.length">
          <ListSectionPlaceholder
            variant="reports"
            title="Нет данных за период"
            description="За выбранный период нет отказов по этапам. Измените фильтры и нажмите «Применить»."
          />
        </template>
        <template v-else>
          <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            <div class="min-w-0 flex-1 overflow-x-auto">
              <table class="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr class="border-b border-athens">
                  <th colspan="2" class="pb-2 pr-4 text-xs font-normal text-bali">
                    Статус и кол-во кандидатов
                  </th>
                  <th colspan="2" class="pb-2 text-xs font-normal text-bali">
                    Отказы
                  </th>
                </tr>
                <tr class="border-b border-athens">
                  <th class="py-3 pr-4 font-medium text-space">Этап</th>
                  <th class="w-24 py-3 pr-4 text-right font-medium text-space">
                    Кандидатов
                  </th>
                  <th class="w-36 py-3 pr-4 text-right font-medium text-space">
                    Отказы
                  </th>
                  <th class="min-w-[200px] py-3 font-medium text-space" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in r.rejectionReportDisplayRows"
                  :key="'rejrep-' + (row.stage_id || row.stage_name) + '-' + ri"
                  class="align-middle"
                >
                  <td class="py-3 pr-4 font-medium text-space">
                    {{ row.stage_name }}
                  </td>
                  <td class="py-3 pr-4 text-right tabular-nums text-slate-custom">
                    {{ row.candidates_count }}
                  </td>
                  <td class="py-3 pr-4 text-right tabular-nums text-slate-custom">
                    {{ row.rejections_count }} ({{ r.rejectionReportRowPct(row) }}%)
                  </td>
                  <td class="py-3">
                    <div class="flex min-h-7 min-w-0 items-center">
                      <template v-if="r.rejectionReportRowSegments(row).length > 0">
                        <div
                          class="flex h-7 overflow-hidden rounded-full bg-athens"
                          :style="r.rejectionReportBarTrackStyle(row)"
                        >
                          <div class="flex h-full min-w-0 flex-1">
                            <div
                              v-for="(seg, si) in r.rejectionReportRowSegments(row)"
                              :key="si"
                              class="h-full min-w-0"
                              @mouseenter="r.showRejectionReasonSegmentTooltip($event, seg)"
                              @mousemove="r.moveRejectionReasonSegmentTooltip($event)"
                              @mouseleave="r.hideRejectionReasonSegmentTooltip"
                              :style="{
                                width: `${seg.share * 100}%`,
                                backgroundColor: seg.color,
                                minWidth: seg.share > 0 ? '2px' : '0',
                              }"
                            />
                          </div>
                        </div>
                      </template>
                      <div
                        v-else
                        class="h-7 rounded-full bg-[#e5e7eb] transition-[width] duration-700 ease-out"
                        :style="{
                          width: r.rejectionReportAnimActive ? '48px' : '0',
                          minWidth: r.rejectionReportAnimActive ? '48px' : '0',
                        }"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
              </table>
            </div>
            <div class="w-full lg:w-64 lg:flex-shrink-0">
              <p class="mb-2 text-sm font-bold text-space">Причины отказов</p>
              <p class="mb-3 text-lg font-bold text-dodger">{{ r.rejectionReasonsLegendTotal }}</p>
              <ul class="space-y-1.5 text-sm text-slate-custom">
                <li
                  v-for="item in r.rejectionReasonsLegendItems"
                  :key="item.label"
                  class="flex items-center gap-2"
                >
                  <span
                    class="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    :style="{ backgroundColor: item.color }"
                  />
                  <span class="min-w-0 truncate">{{ item.label }}</span>
                  <span class="flex-shrink-0">{{ item.count }} ({{ r.rejectionReasonsLegendPct(item.count) }}%)</span>
                </li>
              </ul>
            </div>
          </div>
        </template>
      </div>
</template>
