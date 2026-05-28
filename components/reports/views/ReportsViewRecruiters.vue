<script setup lang="ts">
import { useReportsContext } from '@/composables/reports/reportsContext'
const r = useReportsContext()
</script>

<template>
      <div class="rounded-fifteen bg-white p-25px shadow-sm sm:px-[50px]">
        <p class="mb-6 text-lg font-bold text-space">
          Отчет по рекрутерам
        </p>
        <template v-if="r.recruitersReportLoading">
          <ListSectionPlaceholder variant="reports" loading loading-title="Загрузка данных…" />
        </template>
        <template v-else-if="r.recruitersReportError">
          <p class="py-8 text-center text-red-custom">{{ r.recruitersReportError }}</p>
        </template>
        <template v-else-if="!(r.recruitersReportData?.recruiters?.length)">
          <ListSectionPlaceholder
            variant="reports"
            title="Нет данных"
            description="За выбранные фильтры нет строк отчёта. Измените период или фильтры и нажмите «Применить»."
          />
        </template>
        <template v-else>
          <div class="overflow-x-auto rounded-fifteen border border-athens bg-white">
            <table class="w-full min-w-[720px] table-fixed text-left text-sm">
              <thead>
                <tr class="bg-catskill">
                  <th class="w-[30%] py-3 pl-15px pr-4 font-medium text-space">
                    Сотрудники и их вакансии
                  </th>
                  <th class="w-[12%] py-3 pr-4 text-right font-medium text-space">
                    Добавленные кандидаты
                  </th>
                  <th class="w-[12%] py-3 pr-4 text-right font-medium text-space">
                    Нанятые
                  </th>
                  <th class="w-[10%] py-3 pr-4 text-right font-medium text-space">
                    Отказы
                  </th>
                  <th class="w-[12%] py-3 pr-4 pl-4 text-right font-medium text-space">
                    Срок найма
                  </th>
                  <th class="w-[12%] py-3 pr-4 pl-2 text-right font-medium text-space">
                    Планируемый срок закрытия
                  </th>
                  <th class="w-[12%] py-3 pr-15px pl-2 text-right font-medium text-space">
                    Дата открытия и дней в работе
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <template
                  v-for="rec in r.recruitersReportData?.recruiters ?? []"
                  :key="'recruiter-' + rec.recruiter_id"
                >
                  <tr class="border-y border-athens bg-zumthor/60">
                    <td colspan="4" class="py-3 pl-15px pr-4 align-middle">
                      <span class="font-bold text-space">{{ rec.name }}</span>
                      <span v-if="rec.position_title" class="font-bold text-space">
                        ({{ rec.position_title }})
                      </span>
                      <span class="font-normal text-slate-custom">
                        • {{ rec.vacancies_count }} {{ r.vacanciesCountWord(rec.vacancies_count) }}: нужно нанять
                        {{ rec.target_headcount }} {{ r.peopleCountWord(rec.target_headcount) }}
                      </span>
                    </td>
                    <td colspan="3" class="bg-zumthor/60 py-3 pr-15px pl-4" />
                  </tr>
                  <tr
                    v-for="vac in rec.vacancies"
                    :key="'vac-' + rec.recruiter_id + '-' + vac.vacancy_id"
                    class="border-b border-athens last:border-0"
                  >
                    <td class="py-3 pl-15px pr-4 align-top">
                      <NuxtLink
                        :to="`/vacancies/${vac.vacancy_id}`"
                        class="font-medium text-space transition-colors hover:text-dodger"
                        :title="`Открыть страницу вакансии «${vac.title}»`"
                      >
                        {{ vac.title }}
                      </NuxtLink>
                      <div
                        v-if="r.vacancyIsOnPause(vac.status)"
                        class="mt-0.5 text-xs font-medium text-amber-600"
                      >
                        На паузе
                      </div>
                    </td>
                    <td class="py-3 pr-4 text-right tabular-nums text-space">
                      {{ vac.candidates_added_count }}
                    </td>
                    <td class="py-3 pr-4 text-right align-top tabular-nums">
                      <div class="text-space">
                        {{ vac.hired_count }} из {{ vac.hired_target }}
                      </div>
                      <div class="mt-0.5 text-xs text-slate-custom">
                        {{ r.hiredProgressPercent(vac) ?? '—' }}
                      </div>
                    </td>
                    <td class="py-3 pr-4 text-right align-top tabular-nums">
                      <div class="text-space">
                        {{ vac.rejections_count }}
                      </div>
                      <div class="mt-0.5 text-xs text-slate-custom">
                        {{ r.rejectionsRatePercent(vac) ?? '—' }}
                      </div>
                    </td>
                    <td class="py-3 pr-4 pl-4 text-right align-top tabular-nums text-space">
                      <span class="inline-block min-w-[3.5rem] text-right">{{
                        r.formatAvgDaysDays(vac.avg_days_to_hire)
                      }}</span>
                    </td>
                    <td class="py-3 pr-4 pl-2 text-right align-top tabular-nums text-space">
                      <span class="inline-block min-w-[3.5rem] text-right">{{
                        r.formatAvgDaysDays(vac.planned_close_days ?? vac.avg_days_to_close)
                      }}</span>
                    </td>
                    <td class="py-3 pr-15px pl-2 text-right align-top tabular-nums text-space">
                      <div>{{ r.formatOpenedAtDate(r.recruiterVacancyOpenedAt(vac)) }}</div>
                      <div class="mt-0.5 text-xs text-slate-custom">{{ r.formatDaysInWork(r.recruiterVacancyDaysInWork(vac)) }}</div>
                    </td>
                  </tr>
                </template>
                <tr v-if="!r.recruitersReportHasRows">
                  <td colspan="7" class="py-6 text-center text-slate-custom">
                    В ответе нет строк по вакансиям — проверьте фильтры или настройку эндпоинта.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
</template>
