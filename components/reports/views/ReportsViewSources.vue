<script setup lang="ts">
import { useReportsContext } from '@/composables/reports/reportsContext'
const r = useReportsContext()
</script>

<template>
      <template v-if="!r.selectedVacancy">
        <ListSectionPlaceholder
          variant="reports"
          title="Выберите вакансию"
          description="Данные подтягиваются из списка кандидатов по выбранной вакансии и периоду."
          class="shadow-sm"
        />
      </template>
      <template v-else-if="r.candidatesLoading">
        <ListSectionPlaceholder
          variant="reports"
          loading
          loading-title="Загрузка кандидатов…"
          class="shadow-sm"
        />
      </template>
      <template v-else>
        <div
          class="mb-[46px] flex flex-wrap items-center justify-between gap-[35px] rounded-fifteen bg-white px-6 py-6 shadow-sm sm:px-[50px]"
        >
          <div
            v-for="(item, index) in r.possibleSourcesRadialCharts"
            :key="'ps-' + r.possibleSourcesRadialAnimKey + '-' + index"
            class="possible-sources-donut relative flex h-[200px] w-[200px] flex-shrink-0 flex-col items-center justify-center"
            :style="{ animationDelay: `${index * 70}ms` }"
          >
            <div
              class="absolute inset-0 rounded-full bg-athens"
              aria-hidden="true"
            />
            <div
              class="possible-sources-donut-ring absolute inset-0 rounded-full"
              :style="{
                background: item.gradient,
                animationDelay: `${index * 70}ms`,
              }"
              aria-hidden="true"
            />
            <div class="absolute flex h-32 w-32 items-center justify-center rounded-full bg-white" />
            <div class="relative z-10 max-w-[140px] text-center">
              <span class="block text-xl font-bold text-space">{{ item.value }}</span>
              <span class="mt-1 block text-xs font-normal leading-tight text-slate-custom">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-fifteen bg-athens shadow-sm">
      
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr class="bg-catskill">
                  <th class="py-3 pl-15px pr-25px font-medium text-space">
                    {{ r.tableColumns[0].label }}
                  </th>
                  <th
                    v-for="col in r.tableColumns.slice(1)"
                    :key="col.key"
                    class="cursor-pointer py-3 pl-15px pr-25px font-medium text-space hover:text-dodger"
                    :class="{ 'text-dodger': r.activeSortColumn === col.key }"
                    @click="r.toggleTableSort(col.key)"
                  >
                    <span class="inline-flex items-center gap-1">
                      {{ col.label }}
                      <svg-icon
                        name="dropdown-arrow"
                        width="16"
                        height="16"
                        class="text-slate-custom transition-transform"
                        :class="[
                          r.activeSortColumn === col.key
                            ? (r.tableSortAsc === 1 ? 'rotate-180' : 'rotate-0')
                            : 'rotate-0 opacity-40',
                        ]"
                      />
                    </span>
                  </th>
                </tr>
              </thead>
              <TransitionGroup name="reorder" tag="tbody" class="bg-white">
                <tr v-if="r.sortedPossibleSourcesRows.length === 0" :key="'empty-possible-sources'">
                  <td colspan="5" class="py-8 text-center text-slate-custom">
                    Нет кандидатов за выбранные фильтры.
                  </td>
                </tr>
                <tr
                  v-for="(row, idx) in r.sortedPossibleSourcesRows"
                  :key="row.source"
                  class="border-b border-athens last:border-0"
                >
                  <td class="py-3 pl-15px pr-25px">
                    <span class="inline-flex items-center gap-2">
                      <span
                        v-if="row.sourceIcon"
                        class="h-3 w-3 flex-shrink-0 rounded-full"
                        :style="{ backgroundColor: row.colorDot }"
                      />
                      {{ row.source }}
                    </span>
                  </td>
                  <td class="py-3 pl-15px pr-25px text-slate-custom test">{{ row.views }}</td>
                  <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.responses }}</td>
                  <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.funnel }}</td>
                  <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.rejections }}</td>
                </tr>
              </TransitionGroup>
            </table>
          </div>
        </div>
      </template>
</template>
