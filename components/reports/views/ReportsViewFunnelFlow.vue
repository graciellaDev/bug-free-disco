<script setup lang="ts">
import { useReportsContext } from '@/composables/reports/reportsContext'
const r = useReportsContext()
</script>

<template>
      <div class="flex flex-col gap-[25px] rounded-fifteen bg-white p-25px shadow-sm">
        <template v-if="!r.selectedVacancy || !r.dateRange?.from || !r.dateRange?.to">
          <ListSectionPlaceholder
            variant="reports"
            title="Выберите вакансию и период"
            description="Укажите вакансию и период в фильтрах выше, затем нажмите «Применить»."
          />
        </template>
        <template v-else-if="r.funnelLoading">
          <ListSectionPlaceholder variant="reports" loading />
        </template>
        <template v-else-if="r.funnelError">
          <p class="py-8 text-center text-red-custom">{{ r.funnelError }}</p>
        </template>
        <template v-else>
          <p class="mb-4 text-sm font-bold text-space">Поток кандидатов</p>

          <div class="mb-2 flex flex-wrap items-center gap-6 text-sm">
            <span class="inline-flex items-center gap-2 text-slate-custom">
              <span class="h-3 w-3 rounded-sm bg-space" />
              Отклики
            </span>
              <span class="inline-flex items-center gap-2 text-slate-custom">
              <span class="h-3 w-3 rounded-sm bg-dodger" />
              Движение по воронке
            </span>
          </div>

          <div class="flex gap-3 overflow-x-auto pb-2 sm:pl-[0] md:overflow-x-visible">
            <div
              class="flex shrink-0 flex-col justify-between py-1 text-right text-xs text-slate-custom"
              :style="{ height: '220px' }"
            >
              <span v-for="tick in [...funnelChartYTicks].reverse()" :key="'y-' + tick">{{ tick }}</span>
            </div>
            <div
              class="relative min-h-[220px] min-w-0 flex-1 border-b border-athens bg-[length:100%_20%] bg-[linear-gradient(to_bottom,#edeff5_1px,transparent_1px)]"
            >
              <!-- key нужен только чтобы переиграть анимацию столбиков после загрузки данных -->
              <TransitionGroup
                :key="r.funnelBarAnimKey"
                name="reorder"
                tag="div"
                class="flex h-[220px] items-end gap-2 px-1"
              >
                <div
                  v-for="(row, ri) in r.funnelRows"
                  :key="row.period_from + '-' + row.period_to"
                  class="flex min-w-[82px] flex-1 flex-col items-center justify-end gap-2 md:min-w-0"
                >
                  <div class="flex h-[200px] w-full items-end justify-center gap-1">
                    <div
                      class="funnel-bar-fill w-[42px] max-w-[42px] shrink-0 rounded-[5px] bg-space md:w-[49px] md:max-w-[49px]"
                      :style="{
                        height: r.funnelBarHeightPct(row.responses),
                        animationDelay: `${ri * 45}ms`,
                      }"
                      :title="'Отклики: ' + row.responses"
                    />
                    <div
                      class="funnel-bar-fill w-[42px] max-w-[42px] shrink-0 rounded-[5px] bg-dodger md:w-[49px] md:max-w-[49px]"
                      :style="{
                        height: r.funnelBarHeightPct(row.funnel_movements),
                        animationDelay: `${ri * 45 + 55}ms`,
                      }"
                      :title="'Движение: ' + row.funnel_movements"
                    />
                  </div>
                  <span
                    class="max-w-[84px] text-center text-[10px] leading-tight text-slate-custom sm:text-xs md:max-w-none"
                    :title="row.period_label"
                  >{{ row.period_label }}</span>
                </div>
              </TransitionGroup>
            </div>
          </div>

          <div class="mt-[25px] overflow-hidden overflow-x-auto rounded-fifteen bg-athens">
            <table class="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr class="bg-catskill">
                  <th class="py-3 pl-15px pr-25px font-medium text-space">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 hover:text-dodger"
                      :class="{ 'text-dodger': r.funnelSort === 'period' }"
                      @click="r.toggleFunnelSort('period')"
                    >
                      Период
                      <svg-icon
                        name="dropdown-arrow"
                        width="16"
                        height="16"
                        class="text-slate-custom transition-transform"
                        :class="[
                          r.funnelSort === 'period'
                            ? r.funnelAsc === 1
                              ? 'rotate-180'
                              : 'rotate-0'
                            : 'rotate-0 opacity-40',
                        ]"
                      />
                    </button>
                  </th>
                  <th class="py-3 pl-15px pr-25px text-right font-medium text-space">
                    <button
                      type="button"
                      class="inline-flex w-full items-center justify-end gap-1 hover:text-dodger"
                      :class="{ 'text-dodger': r.funnelSort === 'responses' }"
                      @click="r.toggleFunnelSort('responses')"
                    >
                      Отклики
                      <svg-icon
                        name="dropdown-arrow"
                        width="16"
                        height="16"
                        class="text-slate-custom transition-transform"
                        :class="[
                          r.funnelSort === 'responses'
                            ? r.funnelAsc === 1
                              ? 'rotate-180'
                              : 'rotate-0'
                            : 'rotate-0 opacity-40',
                        ]"
                      />
                    </button>
                  </th>
                  <th class="py-3 pl-15px pr-25px text-right font-medium text-space">
                    <button
                      type="button"
                      class="inline-flex w-full items-center justify-end gap-1 hover:text-dodger"
                      :class="{ 'text-dodger': r.funnelSort === 'funnel_movements' }"
                      @click="r.toggleFunnelSort('funnel_movements')"
                    >
                      Движение по воронке
                      <svg-icon
                        name="dropdown-arrow"
                        width="16"
                        height="16"
                        class="text-slate-custom transition-transform"
                        :class="[
                          r.funnelSort === 'funnel_movements'
                            ? r.funnelAsc === 1
                              ? 'rotate-180'
                              : 'rotate-0'
                            : 'rotate-0 opacity-40',
                        ]"
                      />
                    </button>
                  </th>
                </tr>
              </thead>
              <TransitionGroup name="reorder" tag="tbody" class="bg-white">
                <tr
                  v-for="(row, idx) in r.funnelRows"
                  :key="row.period_from + '-' + row.period_to + '-tbl'"
                  class="border-b border-athens last:border-0"
                >
                  <td class="py-3 pl-15px pr-25px text-space">{{ row.period_label }}</td>
                  <td class="py-3 pl-15px pr-25px text-right text-slate-custom">{{ row.responses }}</td>
                  <td class="py-3 pl-15px pr-25px text-right text-slate-custom">{{ row.funnel_movements }}</td>
                </tr>
              </TransitionGroup>
            </table>
          </div>
        </template>
      </div>
</template>
