<template>
  <div class="sticky top-[66px] z-10 w-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
    <div class="min-h-[153px] max-h-auto">
      <div class="container pt-25px pb-[16px]">
        <div class="flex mb-25px">
          <h1 class="text-xl text-space font-semibold leading-[38px]">{{ props.name }}</h1>
          <div class="flex ml-auto items-center gap-15px">
            <MyDropdown
              trigger-variant="semiaction"
              placeholder="Выберите статус"
              :options="['В работе', 'Черновик', 'Архив']"
              :model-value="props.modelValue ?? 'В работе'"
              @update:model-value="emit('update:modelValue', $event ?? 'В работе')"
            />
            <UiButton class="font-bold" variant="action" size="action" @click="emit('save-and-continue')">Сохранить и продолжить</UiButton>
          </div>
        </div>
        <div class="flex" @mouseover="handleHover" @mouseleave="handleLeave">
          <ul class="flex p-3px w-full">
            <li :class="{ 'active-tab': currentTab === 'info' }"
              class="border-r border-athens w-full pr-1 max-w-[230.8px]" @click="changeTab('info')">
              <div
                class="cursor-pointer opacity-30 hover:opacity-100 transition-all hover:bg-athens-gray px-25px py-10px rounded-ten h-full flex flex-col justify-center">
                <p class="leading-normal text-sm font-medium text-space pt-1">Описание вакансии</p>
                <div class="tab-description-inner max-h-0 overflow-hidden opacity-0 transition-all mt-1"
                  :class="{ 'max-h-24 opacity-100': isHovered }">
                  <p class="leading-normal text-slate-custom text-13px">Название, локация и ключевые требования для кандидатов</p>
                </div>
              </div>
            </li>
            <!-- <li :class="{ 'active-tab': currentTab === 'search' }"
              class="border-r border-athens w-full px-4.5px max-w-card-width" @click="changeTab('search')">
              <div
                class="cursor-pointer opacity-30 hover:opacity-100 transition-all hover:bg-athens-gray px-25px pt-10px pb-10px rounded-ten h-full"
                :class="isHovered ? 'opacity-30' : 'opacity-100'">
                <p class="leading-normal text-sm font-medium text-space mb-1">Поиск кандидатов</p>
                <div class="max-h-0 overflow-hidden opacity-0 transition-all"
                  :class="{ 'max-h-24 opacity-100': isHovered }">
                  <p class="leading-normal text-slate-custom text-13px">Описание раздела</p>
                  <p class="text-slate-custom text-13px">в 2 строчки</p>
                  <p class="text-slate-custom text-13px">в 3 строчки</p>
                </div>
              </div>
            </li> -->
            <li :class="{ 'active-tab': currentTab === 'publish' }"
              class="border-r border-athens w-full px-4.5px max-w-card-width" @click="changeTab('publish')">
              <div
                class="cursor-pointer opacity-30 hover:opacity-100 transition-all hover:bg-athens-gray px-25px py-10px rounded-ten h-full flex flex-col justify-center"
                :class="isHovered ? 'opacity-30' : 'opacity-100'">
                <p class="leading-normal text-sm font-medium text-space pt-1">Публикации{{ props.publicationsCount > 0 ? ` (${props.publicationsCount})` : '' }}</p>
                <div class="tab-description-inner max-h-0 overflow-hidden opacity-0 transition-all mt-1"
                  :class="{ 'max-h-24 opacity-100': isHovered }">
                  <p class="leading-normal text-slate-custom text-13px">Разместите вакансию на сайтах для поиска работы</p>
                </div>
              </div>
            </li>
            <li :class="{ 'active-tab': currentTab === 'team' }"
              class="border-r border-athens w-full px-4.5px max-w-card-width cursor-pointer"
              @click.prevent="changeTab('team')">
              <div
                class="cursor-pointer opacity-30 hover:opacity-100 transition-all hover:bg-athens-gray px-25px py-10px rounded-ten h-full flex flex-col justify-center"
                :class="isHovered ? 'opacity-30' : 'opacity-100'">
                <p class="leading-normal text-sm font-medium text-space pt-1">Команда вакансии</p>
                <div class="tab-description-inner max-h-0 overflow-hidden opacity-0 transition-all mt-1"
                  :class="{ 'max-h-24 opacity-100': isHovered }">
                  <p class="leading-normal text-slate-custom text-13px">Добавьте коллег для совместной работы над вакансией</p>
                </div>
              </div>
            </li>
            <li :class="{ 'active-tab': currentTab === 'funnel' }" class="max-w-[230.8px] w-full pl-5px"
              @click="changeTab('funnel')">
              <div
                class="cursor-pointer opacity-30 hover:opacity-100 transition-all hover:bg-athens-gray px-25px py-10px rounded-ten h-full flex flex-col justify-center"
                :class="isHovered ? 'opacity-30' : 'opacity-100'">
                <p class="leading-normal text-sm font-medium text-space pt-1">Воронка найма</p>
                <div class="tab-description-inner max-h-0 overflow-hidden opacity-0 transition-all mt-1"
                  :class="{ 'max-h-24 opacity-100': isHovered }">
                  <p class="leading-normal text-slate-custom text-13px">Настройте этапы воронки для автоматизации найма</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MyDropdown from '~/components/custom/MyDropdown.vue'
// import { useVacancyStore } from '@/stores/vacancy';

// const vacancyStore = useVacancyStore();
// const nameVacancy = computed(() => vacancyStore.nameVacancy);

const props = defineProps({
  name: {
    type: String,
    default: 'Новая вакансия',
  },
  modelValue: {
    type: String,
    default: 'В работе',
  },
  activeTab: {
    type: String,
    default: 'info',
  },
  publicationsCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits<{
  (event: 'update:currentTab', tabName: string): void
  (event: 'update:modelValue', value: string): void
  (event: 'save-and-continue'): void
}>()

// Объявляем переменную для состояния табов
const isHovered = ref(false)

// Активная вкладка приходит снаружи, чтобы оставаться в синхронизации при программном переключении
const currentTab = computed(() => props.activeTab)


// Функция смены табов
function changeTab(tabName: string) {
  emit('update:currentTab', tabName)
}

function handleHover() {
  isHovered.value = true
}

function handleLeave() {
  isHovered.value = false
}
</script>

<style scoped>
/* Стили для активного таба */
.active-tab div {
  opacity: 1;
  background-color: #f0f4f8;
  border-radius: 10px;
  transition: all .3s ease-in-out;
}
/* У внутреннего текстового блока без скругления, чтобы не обрезало буквы */
.active-tab .tab-description-inner {
  border-radius: 0;
}
</style>