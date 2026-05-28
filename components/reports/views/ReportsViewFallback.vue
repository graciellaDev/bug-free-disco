<script setup lang="ts">
import { useReportsContext } from '@/composables/reports/reportsContext'
const r = useReportsContext()
</script>

<template>
      <!-- Остальные отчёты: блок донатов + таблица (Figma Default: gap 35px в ряду, 200×200, до таблицы 46px) -->
      <div
        class="mb-[46px] flex flex-wrap items-center justify-between gap-[35px] rounded-fifteen bg-white px-6 py-6 shadow-sm sm:px-[50px]"
      >
        <div
          v-for="(item, index) in r.fallbackChartData"
          :key="index"
          class="relative flex h-[200px] w-[200px] flex-shrink-0 flex-col items-center justify-center"
        >
          <div
            class="absolute inset-0 rounded-full"
            style="
              background: conic-gradient(
                #f59e0b 0deg 300deg,
                #ec4899 300deg 330deg,
                #a855f7 330deg 360deg
              );
            "
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
              <tr
                v-for="(row, idx) in r.sortedFallbackRows"
                :key="row.source"
                class="border-b border-athens last:border-0"
              >
                <td class="py-3 pl-15px pr-25px">
                  <span class="inline-flex items-center gap-2">
                    <span
                      v-if="row.sourceIcon"
                      class="h-3 w-3 flex-shrink-0 rounded-full bg-amber-400"
                    />
                    {{ row.source }}
                  </span>
                </td>
                <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.views }}</td>
                <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.responses }}</td>
                <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.funnel }}</td>
                <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.rejections }}</td>
              </tr>
            </TransitionGroup>
          </table>
        </div>
      </div>
</template>
