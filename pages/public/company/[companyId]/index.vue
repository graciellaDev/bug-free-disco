<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const companyId = computed(() => route.params.companyId)

const config = useRuntimeConfig()
const apiBase = (config.public.apiBase || '/api').replace(/\/$/, '')

const company = ref(null)
const vacancies = ref([])
const loading = ref(true)
const error = ref(null)

const activeTab = ref('vacancies')

async function loadCareer() {
  if (!companyId.value) return
  loading.value = true
  error.value = null
  try {
    const data = await $fetch(`${apiBase}/public/career/${companyId.value}`)
    company.value = data.company
    vacancies.value = data.vacancies || []
  } catch (e) {
    error.value = e.data?.message || 'Не удалось загрузить данные'
    company.value = null
    vacancies.value = []
  } finally {
    loading.value = false
  }
}

await loadCareer()

const companyName = computed(() => company.value?.name || 'Компания не найдена')
const companyDescription = computed(() => company.value?.description ?? '')
const companySite = computed(() => company.value?.site || null)
const hasCompanySite = computed(() => !!companySite.value)

/** Теги для карточки вакансии с подписью поля: «Тип занятости X», «График работы X», «Формат работы X» */
function getVacancyTags(vac) {
  const list = []
  if (vac.employment) list.push(`Тип занятости ${vac.employment}`)
  if (vac.schedule) list.push(`График работы ${vac.schedule}`)
  if (Array.isArray(vac.work_format)) {
    vac.work_format.forEach((name) => list.push(`Формат работы ${name}`))
  }
  return list
}

definePageMeta({
  layout: 'blank',
})
useHead(() => ({ title: companyName.value }))
</script>

<template>
  <div class="career-page">
    <header class="career-header bg-white">
      <div class="career-header__inner text-center">
        <p class="career-header__label">Работа в:</p>
        <h2 class="career-header__title">{{ companyName }}</h2>
      </div>
      <div class="career-header__divider w-full h-px bg-athens" />
      <div class="career-tabs">
        <button
          type="button"
          :class="{ 'career-tabs__btn--active': activeTab === 'vacancies' }"
          class="career-tabs__btn"
          @click="activeTab = 'vacancies'"
        >
          Все вакансии
        </button>
        <button
          type="button"
          :class="{ 'career-tabs__btn--active': activeTab === 'company' }"
          class="career-tabs__btn"
          @click="activeTab = 'company'"
        >
          О компании
        </button>
      </div>
    </header>

    <div class="career-content">
      <div v-if="loading" class="text-center py-12 text-slate-custom">
        Загрузка...
      </div>
      <template v-else-if="error">
        <p class="text-slate-custom">{{ error }}</p>
      </template>
      <template v-else>
        <div v-if="activeTab === 'vacancies'">
          <h3 class="text-xl font-semibold text-space mb-25px text-center">Открытые вакансии</h3>
          <ul class="space-y-15px">
            <li
              v-for="vac in vacancies"
              :key="vac.id"
              class="bg-white rounded-fifteen p-25px shadow-shadow-cards"
            >
              <div class="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                <div class="flex flex-col gap-y-2.5 min-w-0">
                  <NuxtLink
                    :to="`/public/vacancies/${vac.id}?company=${companyId}`"
                    class="text-lg font-medium text-space hover:text-dodger cursor-pointer w-fit leading-130"
                  >
                    {{ vac.name }}
                  </NuxtLink>
                  <span v-if="vac.salary_display" class="text-sm font-normal text-space leading-150">
                    {{ vac.salary_display }}
                  </span>
                </div>
                <p v-if="vac.published_at" class="text-xs font-normal text-slate-custom shrink-0">
                  Опубликовано: {{ vac.published_at }}
                </p>
              </div>
              <p v-if="vac.location" class="text-sm font-normal text-space leading-150 mb-3.5">
                г. {{ vac.location }}
              </p>
              <div v-if="getVacancyTags(vac).length" class="flex flex-wrap gap-2.5">
                <span
                  v-for="(tag, idx) in getVacancyTags(vac)"
                  :key="idx"
                  class="bg-zumthor rounded-plus py-[6.5px] px-15px text-dodger text-13px font-normal leading-130"
                >
                  {{ tag }}
                </span>
              </div>
            </li>
          </ul>
          <p v-if="vacancies.length === 0" class="text-slate-custom text-sm">
            Нет открытых вакансий.
          </p>
        </div>
        <div v-else-if="activeTab === 'company'" class="bg-white rounded-fifteen p-25px">
          <h3 class="text-xl font-semibold text-space mb-15px">О нас</h3>
          <div
            v-if="companyDescription"
            class="text-sm font-normal text-space leading-150 company-description mb-4"
            v-html="companyDescription"
          />
          <p v-else class="text-sm font-normal text-slate-custom">
            Информация отсутствует
          </p>
          <p v-if="hasCompanySite" class="text-sm font-normal text-space leading-150 mt-4">
            Веб-сайт:
            <a
              :href="companySite"
              target="_blank"
              rel="noopener noreferrer"
              class="text-dodger hover:underline"
            >
              {{ companySite }}
            </a>
          </p>
        </div>
      </template>
    </div>

    <div v-if="hasCompanySite" class="career-visit-strip">
      <div class="career-visit-strip__inner">
        <a :href="companySite" target="_blank" rel="noopener noreferrer" class="career-visit">
          Посетить сайт компании
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.career-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafc;
}

.career-header {
  box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.08);
}

.career-header__inner {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 25px 20px;
}

.career-header__label {
  font-size: 0.875rem;
  font-weight: 400;
  color: #79869a;
  margin: 0 0 0.25rem 0;
  line-height: 1.35;
}

.career-header__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2f353d;
  margin: 0;
  letter-spacing: -0.01em;
}

.career-header__divider {
  background: #edeff5;
}

.career-tabs {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: center;
  gap: 24px;
}

.career-tabs__btn {
  padding: 14px 8px 16px;
  position: relative;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: 0.02em;
  color: #79869a;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.career-tabs__btn:hover {
  color: #2f353d;
}

.career-tabs__btn--active {
  color: #2f353d;
  font-weight: 500;
}

.career-tabs__btn--active::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  height: 4px;
  background: #5898ff;
  border-radius: 2px 2px 0 0;
}

.career-content {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 35px 20px 120px;
  flex: 1;
}

.career-visit-strip {
  margin-top: auto;
  flex-shrink: 0;
  box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.08);
  background: white;
}

.career-visit-strip__inner {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  padding: 11.5px 20px;
}

.career-visit {
  font-size: 14px;
  font-weight: 500;
  color: #5898ff;
  padding-right: 20px;
  background-image: url('../../../../assets/sprite/svg/arrow-link.svg');
  background-repeat: no-repeat;
  background-position: right center;
}

.company-description :deep(p) {
  margin-bottom: 0.75em;
}
.company-description :deep(p:last-child) {
  margin-bottom: 0;
}
.company-description :deep(a) {
  color: #5898ff;
}
</style>
