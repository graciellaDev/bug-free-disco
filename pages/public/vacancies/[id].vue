<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResponseForm from '~/components/custom/page-parts/ResponseForm.vue'
import Popup from '~/components/custom/Popup.vue'

const route = useRoute()
const router = useRouter()
const vacancyId = computed(() => route.params.id)
const companyId = computed(() => route.query.company)

const config = useRuntimeConfig()
const apiBase = (config.public.apiBase || '/api').replace(/\/$/, '')

const vacancy = ref(null)
const company = ref(null)
const loading = ref(true)
const error = ref(null)

const activeTab = ref('about')
const responseFormData = ref({})
const submitLoading = ref(false)
const submitSuccess = ref(false)
const submitError = ref(null)
const showSuccessPopup = ref(false)

async function loadVacancy() {
  if (!vacancyId.value || !companyId.value) {
    error.value = 'Не указана вакансия или компания'
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const data = await $fetch(`${apiBase}/public/vacancy/${vacancyId.value}`, {
      query: { company: companyId.value },
    })
    vacancy.value = data.vacancy
    company.value = data.company
  } catch (e) {
    error.value = e.data?.message || 'Не удалось загрузить вакансию'
    vacancy.value = null
    company.value = null
  } finally {
    loading.value = false
  }
}

await loadVacancy()

const companyName = computed(() => company.value?.name || 'Компания')
const vacancyName = computed(() => vacancy.value?.name || 'Вакансия не найдена')
const companySite = computed(() => company.value?.site || null)
const hasCompanySite = computed(() => !!companySite.value)

/** Строка зарплаты: сумма + при необходимости «Выплаты: …» */
const salaryLine = computed(() => {
  const v = vacancy.value
  if (!v?.salary_display) return null
  const pay = v.salary_payment_frequency ? ` · Выплаты: ${v.salary_payment_frequency}` : ''
  return v.salary_display + ' за месяц на руки' + pay
})

/** Город для шапки: только город из поля «Город публикации» (location), без полного адреса */
const locationLine = computed(() => {
  const v = vacancy.value
  return v?.location ? String(v.location).trim() : null
})

/** Опыт — отдельная строка */
const hasExperience = computed(() => !!vacancy.value?.experience)

/** Строка тип занятости + формат работы */
const employmentPlaceLine = computed(() => {
  const v = vacancy.value
  const emp = v?.employment || ''
  const place = v?.work_format_first || ''
  if (!emp && !place) return null
  return [emp, place].filter(Boolean).join(' · ')
})

/** Одна строка для шапки: формат · занятость · график · зарплата */
const jobDetailsLine = computed(() => {
  const v = vacancy.value
  const parts = []
  if (v?.work_format_first) parts.push(v.work_format_first)
  if (v?.employment) parts.push(v.employment)
  if (v?.schedule) parts.push(v.schedule)
  if (v?.salary_display) parts.push(v.salary_display)
  return parts.length ? parts.join(' · ') : null
})

function goToCompany() {
  if (companyId.value) {
    router.push(`/public/company/${companyId.value}`)
  }
}

async function handleFormSubmit(formData) {
  if (!vacancyId.value || !companyId.value) return
  if (submitSuccess.value) return
  submitError.value = null
  submitLoading.value = true
  try {
    const personal = formData.personalInfo || {}
    const fio = personal.fio || {}
    const resumeFile = personal.resume instanceof File ? personal.resume : null

    if (resumeFile) {
      const body = new FormData()
      body.append('firstname', (fio.name || '').trim())
      body.append('surname', (fio.lastName || '').trim())
      body.append('email', (personal.email || '').trim())
      body.append('phone', personal.phone ?? '')
      body.append('resume', resumeFile)
      await $fetch(`${apiBase}/public/vacancy/${vacancyId.value}/apply`, {
        method: 'POST',
        query: { company: companyId.value },
        body,
      })
    } else {
      await $fetch(`${apiBase}/public/vacancy/${vacancyId.value}/apply`, {
        method: 'POST',
        query: { company: companyId.value },
        body: {
          firstname: (fio.name || '').trim(),
          surname: (fio.lastName || '').trim(),
          email: (personal.email || '').trim(),
          phone: personal.phone ?? '',
        },
      })
    }
    submitSuccess.value = true
    showSuccessPopup.value = true
  } catch (e) {
    submitError.value = e.data?.message || 'Не удалось отправить отклик'
  } finally {
    submitLoading.value = false
  }
}

function closeSuccessPopup() {
  showSuccessPopup.value = false
}

definePageMeta({
  layout: 'blank',
})
useHead(() => ({ title: vacancyName.value }))
</script>

<template>
  <div class="vacancy-page">
    <div class="vacancy-page__body">
      <!-- Шапка: назад + центрированный блок (компания, название, детали, локация) -->
      <header class="vacancy-header bg-white">
        <div class="vacancy-header__container">
          <label
            class="vacancy-back flex items-center cursor-pointer w-fit mb-30px"
            :disabled="!companyId"
            @click="goToCompany"
          >
            <span class="vacancy-back__btn text-slate-custom p-[9px] border border-athens rounded-ten bg-athens-gray mr-15px inline-flex">
              <svg-icon name="arrow-left" width="20" height="20" />
            </span>
            <span class="text-xs text-slate-custom font-normal leading-130">Назад к {{ companyName }}</span>
          </label>

          <template v-if="!loading && !error">
            <div class="vacancy-hero text-center">
              <p class="vacancy-hero__company">{{ companyName }}</p>
              <h1 class="vacancy-hero__title">{{ vacancyName }}</h1>
              <p v-if="jobDetailsLine" class="vacancy-hero__details text-sm font-normal text-slate-custom leading-150 mb-8px">
                {{ jobDetailsLine }}
              </p>
              <p v-if="locationLine" class="vacancy-hero__location text-sm font-normal text-slate-custom leading-150">
                {{ locationLine }}
              </p>
            </div>
          </template>
          <template v-else-if="error">
            <p class="text-slate-custom text-center">{{ error }}</p>
          </template>
          <template v-else>
            <p class="text-slate-custom text-center">Загрузка...</p>
          </template>
        </div>

        <div class="vacancy-header__divider w-full h-px bg-athens" />

        <div class="vacancy-tabs">
          <div class="vacancy-tabs__inner">
            <button
              type="button"
              :class="{ 'vacancy-tabs__btn--active': activeTab === 'about' }"
              class="vacancy-tabs__btn"
              @click="activeTab = 'about'"
            >
              Описание
            </button>
            <button
              type="button"
              :class="{ 'vacancy-tabs__btn--active': activeTab === 'form' }"
              class="vacancy-tabs__btn"
              @click="activeTab = 'form'"
            >
              Анкета
            </button>
          </div>
        </div>
      </header>

      <!-- Контент: светлый фон, блок «Описание» + «Поделиться», текст, кнопка отклика -->
      <section v-if="activeTab === 'about' && vacancy" class="vacancy-content bg-catskill">
        <div class="vacancy-content__inner">
          <div class="vacancy-content__card">
            <h2 class="vacancy-content__title mb-5">Описание</h2>
            <div
              v-if="vacancy.description"
              class="vacancy-body description"
              v-html="vacancy.description"
            />
            <p v-else class="vacancy-body vacancy-body--empty">Описание не указано</p>
          </div>
          <div class="vacancy-apply-block">
            <button
              type="button"
              class="vacancy-apply-btn w-full min-h-[50px] bg-dodger text-white text-sm font-semibold rounded-fifteen border-0 cursor-pointer hover:opacity-95 uppercase"
              @click="activeTab = 'form'"
            >
              Откликнуться на вакансию
            </button>
          </div>
        </div>
      </section>

      <!-- Вкладка «Анкета» -->
      <section v-if="activeTab === 'form' && vacancy" class="vacancy-form-section bg-catskill">
        <div class="vacancy-form__container">
          <template v-if="submitSuccess">
            <div class="vacancy-success-notice bg-green-50 border border-green-200 rounded-fifteen p-25px text-center">
              <p class="text-black font-medium text-base m-0">
                Ваш отклик уже отправлен. Мы свяжемся с вами.
              </p>
            </div>
          </template>
          <template v-else>
            <p v-if="submitError" class="mb-15px text-red-600 font-medium">
              {{ submitError }}
            </p>
            <ResponseForm
              v-model="responseFormData"
              :loading="submitLoading"
              @submit="handleFormSubmit"
            />
          </template>
        </div>
      </section>
    </div>

    <!-- Попап успешной отправки отклика -->
    <Popup
      :is-open="showSuccessPopup"
      :show-close-button="true"
      width="400px"
      content-padding="true"
      @close="closeSuccessPopup"
    >
      <div class="text-center py-4">
        <p class="text-space text-lg font-semibold mb-4">
          Отклик успешно отправлен
        </p>
        <p class="text-slate-custom text-sm mb-6">
          Мы свяжемся с вами в ближайшее время.
        </p>
        <UiButton
          variant="action"
          size="semiaction"
          class="min-w-[160px]"
          @click="closeSuccessPopup"
        >
          Закрыть
        </UiButton>
      </div>
    </Popup>

    <!-- Полоса «Посетить сайт компании» внизу страницы -->
    <div v-if="vacancy && hasCompanySite" class="vacancy-visit-strip">
      <div class="vacancy-visit-strip__inner">
        <a
          :href="companySite"
          target="_blank"
          rel="noopener noreferrer"
          class="vacancy-visit"
        >
          Посетить сайт компании
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vacancy-page {
  width: 100%;
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafc; /* тот же светлый фон, чтобы не было серой полосы перед «Посетить сайт» */
}

.vacancy-page__body {
  flex: 1;
  padding-bottom: 60px;
  background: #f9fafc;
}

.vacancy-success-notice {
  margin-bottom: 40px;
}

.vacancy-header {
  box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.08);
  background: white;
}

.vacancy-header__container {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 25px 20px;
}

.vacancy-back {
  display: inline-flex;
  align-items: center;
}
.vacancy-back__btn {
  display: inline-flex;
}

.vacancy-hero {
  text-align: center;
  font-family: inherit;
}
.vacancy-hero__company {
  color: #5898ff;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.01em;
  margin: 0 0 1em 0; /* отступ в одну строку до названия вакансии */
}
.vacancy-hero__title {
  color: #2f353d;
  font-size: 1.5rem;
  font-weight: 500; /* более тонкий шрифт */
  line-height: 1.35;
  letter-spacing: -0.01em;
  margin: 0 0 0.375em 0;
}
.vacancy-hero__details,
.vacancy-hero__location {
  color: #79869a;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
}

.vacancy-header__divider {
  background: #edeff5;
}

.vacancy-tabs {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px;
}
.vacancy-tabs__inner {
  display: flex;
  justify-content: center;
  gap: 24px;
}
.vacancy-tabs__btn {
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
.vacancy-tabs__btn:hover {
  color: #2f353d;
}
.vacancy-tabs__btn--active {
  color: #2f353d;
  font-weight: 500;
}
.vacancy-tabs__btn--active::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  height: 4px;
  background: #5898ff;
  border-radius: 2px 2px 0 0;
}

.vacancy-content,
.vacancy-form-section {
  flex: 1;
  padding: 35px 20px 80px;
}
.vacancy-content__inner,
.vacancy-form__container {
  max-width: 720px;
  margin: 0 auto;
}
.vacancy-content__card {
  /* без белого фона — описание на светлом фоне секции */
}
.vacancy-content__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #2f353d;
  letter-spacing: -0.01em;
}

.vacancy-apply-block {
  max-width: 720px;
  margin: 0 auto;
  margin-top: 28px;
}
.vacancy-apply-btn:focus {
  outline: none;
}

/* Текст описания: шрифт и отступы как на референсе */
.vacancy-body {
  font-size: 0.875rem;
  font-weight: 400;
  color: #2f353d;
  line-height: 1.6;
  letter-spacing: 0.01em;
}
.vacancy-body--empty {
  margin: 0;
  color: #79869a;
}
.vacancy-body :deep(p) {
  font-size: inherit;
  font-weight: 400;
  color: inherit;
  line-height: 1.6;
  margin-top: 0;
  margin-bottom: 1em;
}
.vacancy-body :deep(p:last-child) {
  margin-bottom: 0;
}
.vacancy-body :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0;
  margin-bottom: 1em;
}
.vacancy-body :deep(li) {
  font-size: inherit;
  line-height: 1.6;
  margin-bottom: 0.5em;
}

.vacancy-visit-strip {
  margin-top: auto;
  flex-shrink: 0;
  box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.08);
  background: white;
}
.vacancy-visit-strip__inner {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  padding: 11.5px 20px;
}
.vacancy-visit {
  font-size: 14px;
  font-weight: 500;
  color: #5898ff;
  padding-right: 20px;
  background-image: url('../../../assets/sprite/svg/arrow-link.svg');
  background-repeat: no-repeat;
  background-position: right center;
}
</style>
