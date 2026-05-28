<script setup lang="ts">
import { computed, defineAsyncComponent, unref } from 'vue'
import { useReportsContext } from '@/composables/reports/reportsContext'

const r = useReportsContext()

const views: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'Воронка статусов по вакансии': defineAsyncComponent(
    () => import('@/components/reports/views/ReportsViewFunnelStatus.vue'),
  ),
  'Отчет по отказам': defineAsyncComponent(
    () => import('@/components/reports/views/ReportsViewRejections.vue'),
  ),
  'Поток кандидатов': defineAsyncComponent(
    () => import('@/components/reports/views/ReportsViewFunnelFlow.vue'),
  ),
  'Среднее время на этапе': defineAsyncComponent(
    () => import('@/components/reports/views/ReportsViewStageAverage.vue'),
  ),
  'Отчет по рекрутерам': defineAsyncComponent(
    () => import('@/components/reports/views/ReportsViewRecruiters.vue'),
  ),
  Источники: defineAsyncComponent(() => import('@/components/reports/views/ReportsViewSources.vue')),
}

const FallbackView = defineAsyncComponent(
  () => import('@/components/reports/views/ReportsViewFallback.vue'),
)

const activeView = computed(() => {
  const m = unref(r.metric as { value?: string } | string)
  const key = typeof m === 'object' && m != null && 'value' in m ? m.value : m
  return views[String(key)] ?? FallbackView
})
</script>

<template>
  <component :is="activeView" />
</template>
