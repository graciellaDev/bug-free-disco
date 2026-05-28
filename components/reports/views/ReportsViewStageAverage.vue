<script setup lang="ts">
import { useReportsContext } from '@/composables/reports/reportsContext'
const r = useReportsContext()
</script>

<template>
      <div class="flex flex-col gap-[15px]">
        <template v-if="!r.selectedVacancy || !r.dateRange?.from || !r.dateRange?.to">
          <ListSectionPlaceholder
            variant="reports"
            title="Выберите вакансию и период"
            description="Укажите вакансию и период в фильтрах выше, затем нажмите «Применить»."
            class="shadow-sm"
          />
        </template>
        <template v-else-if="r.stageAvgLoading">
          <ListSectionPlaceholder variant="reports" loading class="shadow-sm" />
        </template>
        <template v-else-if="r.stageAvgEffective">
          <!-- Верхняя карточка: сводка + баннер (Figma Variant3) -->
          <div class="flex flex-col gap-[15px] rounded-fifteen bg-white p-25px shadow-sm">
            <div class="grid grid-cols-1 gap-[15px] sm:grid-cols-3">
              <div class="flex flex-col gap-2.5 rounded-fifteen bg-chilean p-25px">
                <p class="text-3xl font-bold leading-tight text-space">
                  {{ r.stageAvgEffective.avg_close_days }}
                </p>
                <p class="text-sm leading-snug text-slate-custom">
                  Средний срок закрытия (дни)
                </p>
              </div>
              <div class="flex flex-col gap-2.5 rounded-fifteen bg-pink p-25px">
                <p class="text-3xl font-bold leading-tight text-red-custom">
                  {{ r.stageAvgEffective.avg_overdue_days }}
                </p>
                <p class="text-sm leading-snug text-slate-custom">
                  Средний срок просрочки (дни)
                </p>
              </div>
              <div class="flex flex-col gap-2.5 rounded-fifteen bg-zumthor p-25px">
                <p class="text-3xl font-bold leading-tight text-dodger">
                  {{ r.stageAvgEffective.hired_count }} из {{ r.stageAvgEffective.hired_total }}
                </p>
                <p class="text-sm leading-snug text-slate-custom">
                  Нанято кандидатов
                </p>
              </div>
            </div>

            <div class="rounded-fifteen bg-athens-gray p-25px">
              <p class="text-base font-medium text-space">
                Из закрытых позиций {{ r.stageAvgEffective.closure_on_time_percent }}% закрыты в срок
              </p>
              <p class="mt-1.5 text-sm leading-snug text-slate-custom">
                {{ r.stageAvgEffective.closure_on_time }} позиций закрыты в срок,
                {{ r.stageAvgEffective.closure_overdue }} просрочены
              </p>
            </div>
          </div>

          <!-- Нижняя карточка: горизонтальные бары -->
          <div class="rounded-fifteen bg-white p-25px shadow-sm">
            <p class="mb-4 text-sm font-bold text-space">
              Среднее время на этапе
            </p>
            <div :key="r.stageAvgBarAnimKey" class="flex flex-col gap-2">
              <div
                v-for="(row, si) in r.stageAvgEffective.stages"
                :key="(row.stage_id ?? row.stage_name) + '-' + si"
                class="flex min-h-10 items-center gap-4"
              >
                <div class="w-44 min-w-0 flex-shrink-0 text-sm font-medium text-space sm:w-52">
                  <span class="truncate" :title="row.stage_name">{{ row.stage_name }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="h-3 w-full overflow-hidden rounded-full bg-athens">
                    <div
                      class="stage-avg-bar-fill h-full rounded-full bg-[#052137]"
                      :style="{
                        width: r.stageAvgBarWidthPct(row.avg_days),
                        animationDelay: `${si * 48}ms`,
                      }"
                    />
                  </div>
                </div>
                <div class="w-10 flex-shrink-0 text-right text-sm font-medium tabular-nums text-space">
                  {{ row.avg_days }}
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <ListSectionPlaceholder
            variant="reports"
            title="Нет данных для отображения"
            description="За выбранные фильтры нет показателей. Измените период или вакансию и нажмите «Применить»."
            class="shadow-sm"
          />
        </template>
      </div>
</template>
