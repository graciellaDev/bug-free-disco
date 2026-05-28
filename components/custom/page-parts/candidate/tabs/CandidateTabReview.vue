<script setup lang="ts">
import { useCandidateCardContext } from '@/components/custom/page-parts/candidate/candidateCardContext'
const c = useCandidateCardContext()
</script>

<template>
        <div class="considerations-table-wrap">
          <div class="considerations-table-header">
            <div class="cell-inner">Вакансия и отв. рекрутеры</div>
            <div class="cell-inner">Статус кандидата и обновление</div>
            <div class="cell-inner">Заказчик</div>
          </div>
          <div v-if="c.considerationsLoading" class="considerations-loading">
            <p class="text-sm text-slate-custom">Загрузка...</p>
          </div>
          <template v-else-if="c.considerations.length">
            <div
              v-for="(row, idx) in c.considerations"
              :key="row.vacancy_id"
              class="considerations-table-row"
              :class="{ 'considerations-table-row-last': idx === c.considerations.length - 1 }"
            >
              <div class="cell-inner flex flex-col gap-0.5">
                <NuxtLink
                  :to="{
                    path: `/vacancies/${row.vacancy_id}`,
                    query: {
                      candidate: String(c.props.candidate.id),
                      ...(row.stage_id != null ? { stage: String(row.stage_id) } : {}),
                    },
                  }"
                  class="text-sm font-medium text-dodger hover:underline"
                >
                  {{ row.vacancy_name }}
                </NuxtLink>
                <p v-if="row.recruiters?.length" class="text-xs text-bali">
                  {{ row.recruiters.join(', ') }}
                </p>
              </div>
              <div class="cell-inner flex flex-col gap-0.5">
                <span class="text-sm font-medium text-space">{{ row.stage_name || '—' }}</span>
                <span v-if="row.updated_at" class="text-xs text-bali">{{ row.updated_at }}</span>
              </div>
              <div class="cell-inner flex flex-col gap-0.5">
                <span class="text-sm font-medium text-space">
                  {{ row.customers?.[0] || '—' }}
                </span>
                <p
                  v-if="row.customers && row.customers.length > 1"
                  class="text-xs text-bali"
                >
                  {{ row.customers.slice(1).join(', ') }}
                </p>
              </div>
            </div>
          </template>
          <div v-else class="considerations-empty">
            <p class="text-sm text-slate-custom">Нет рассмотрений по вакансиям.</p>
          </div>
        </div>
</template>
