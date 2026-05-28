<script setup lang="ts">
import { useReportsContext } from '@/composables/reports/reportsContext'
const r = useReportsContext()
</script>

<template>
      <!-- Отчёт «Воронка статусов по вакансии»: этапы и полосы по выбранной вакансии -->
      <div class="rounded-fifteen bg-white p-25px shadow-sm sm:px-[50px]">
        <template v-if="!r.selectedVacancy">
          <ListSectionPlaceholder
            variant="reports"
            title="Выберите вакансию"
            description="Выберите вакансию в фильтрах выше, чтобы отобразить этапы и воронку кандидатов."
          />
        </template>
        <template v-else-if="r.vacancyStages.length === 0">
          <ListSectionPlaceholder
            variant="reports"
            loading
            loading-title="Загрузка этапов вакансии…"
          />
        </template>
        <template v-else-if="!r.candidatesLoading && r.stagesLegendTotal === 0">
          <ListSectionPlaceholder
            variant="reports"
            title="Нет данных по вакансии"
            description="По выбранной вакансии и фильтрам пока нет кандидатов. Измените период или выберите другую вакансию."
          />
        </template>
        <div v-else class="flex gap-8">
          <!-- Воронка кандидатов: название этапа напротив полосы, в скобках — накопительное количество (прошло через этап) -->
          <div class="min-w-0 flex-1">
            <p class="mb-3 text-sm font-bold text-space">Воронка кандидатов</p>
            <div class="flex flex-col gap-4">
              <div
                v-for="(stage, rowIndex) in r.vacancyStages"
                :key="'funnel-' + stage.id"
                class="flex h-[40px] items-center gap-4"
              >
                <div class="flex w-48 min-w-0 flex-shrink-0 items-center gap-1 text-sm font-medium text-space">
                  <span class="min-w-0 truncate" :title="stage.name">{{ stage.name }}</span>
                  <span class="flex-shrink-0">({{ r.stageDisplayCounts[rowIndex] ?? 0 }})</span>
                </div>
                <div class="flex h-[40px] min-w-0 flex-1 overflow-hidden rounded-[10px] bg-athens-gray/40">
                  <div
                    class="flex h-[40px] overflow-hidden rounded-[10px] transition-[width] duration-700 ease-out will-change-[width]"
                    :style="r.barStyle(rowIndex)"
                  >
                    <template v-if="(r.stageDisplayCounts[rowIndex] ?? 0) > 0">
                      <div
                        v-for="(seg, segIndex) in r.getStageSegments(stage.id)"
                        :key="segIndex"
                        class="transition-[width] duration-700 ease-out"
                        @mouseenter="r.showFunnelStageSegmentTooltip($event, seg)"
                        @mousemove="r.moveFunnelStageSegmentTooltip($event)"
                        @mouseleave="r.hideFunnelStageSegmentTooltip"
                        :style="{
                          width: `${seg.share * 100}%`,
                          backgroundColor: seg.color,
                          minWidth: seg.count > 0 ? '2px' : '0',
                        }"
                      />
                    </template>
                  </div>
                </div>
                <span class="flex-shrink-0 text-sm text-slate-custom">
                  {{ r.stagePercentOfTotal[rowIndex] ?? 0 }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Правая колонка: источники кандидатов с цветами и количеством -->
          <div class="w-56 flex-shrink-0">
            <p class="mb-2 text-sm font-bold text-space">Источники кандидатов</p>
            <p class="mb-3 text-lg font-bold text-dodger">{{ r.stagesLegendTotal }}</p>
            <ul class="space-y-1.5 text-sm text-slate-custom">
              <li
                v-for="item in r.stagesLegendSources"
                :key="item.name"
                class="flex items-center gap-2"
              >
                <span
                  class="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  :style="{ backgroundColor: item.color }"
                />
                <span class="min-w-0 truncate">{{ item.name }}</span>
                <span class="flex-shrink-0">{{ item.count }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
</template>
