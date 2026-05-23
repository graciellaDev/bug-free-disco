<template>
  <div class="status-vacancy-sticky sticky top-[66px] z-10 w-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
    <div
      class="status-vacancy-header"
      :class="{ 'status-vacancy-header--hovered': isHovered }"
    >
      <div class="container pt-25px pb-[16px]">
        <div class="flex mb-25px">
          <h1 class="text-xl text-space font-semibold leading-[38px]">{{ props.name }}</h1>
          <div class="flex ml-auto items-center gap-15px">
            <MyDropdown
              trigger-variant="semiaction"
              placeholder="Выберите статус"
              :options="['Открыта', 'Приостановлена', 'Закрыта', 'Архив']"
              :model-value="props.modelValue ?? 'Открыта'"
              @update:model-value="emit('update:modelValue', $event ?? 'Открыта')"
            />
            <UiButton class="font-bold" variant="action" size="action" @click="emit('save-and-continue')">Сохранить и продолжить</UiButton>
          </div>
        </div>
        <div
          class="status-vacancy-tabs flex"
          :class="{ 'status-vacancy-tabs--hovered': isHovered }"
          @mouseover="handleHover"
          @mouseleave="handleLeave"
        >
          <div class="status-vacancy-tabs-animator">
          <ul class="status-vacancy-tabs__list flex p-3px w-full">
            <li :class="{ 'active-tab': currentTab === 'info' }"
              class="border-r border-athens w-full pr-1 max-w-[230.8px]" @click="changeTab('info')">
              <div
                class="status-vacancy-tab cursor-pointer opacity-30 hover:opacity-100 hover:bg-athens-gray px-25px py-10px rounded-ten flex flex-col">
                <p class="status-vacancy-tab__title leading-normal text-sm font-medium text-space">Описание вакансии</p>
                <div class="tab-description-inner" :class="{ 'tab-description-inner--expanded': isHovered }">
                  <div class="tab-description-inner__clip">
                    <p class="leading-normal text-slate-custom text-13px">Название, локация и ключевые требования для кандидатов</p>
                  </div>
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
                class="status-vacancy-tab cursor-pointer opacity-30 hover:opacity-100 hover:bg-athens-gray px-25px py-10px rounded-ten flex flex-col"
                :class="isHovered ? 'opacity-30' : 'opacity-100'">
                <p class="status-vacancy-tab__title leading-normal text-sm font-medium text-space">Размещения{{ props.publicationsCount > 0 ? ` (${props.publicationsCount})` : '' }}</p>
                <div class="tab-description-inner" :class="{ 'tab-description-inner--expanded': isHovered }">
                  <div class="tab-description-inner__clip">
                    <p class="leading-normal text-slate-custom text-13px">Разместите вакансию на сайтах для поиска работы</p>
                  </div>
                </div>
              </div>
            </li>
            <li :class="{ 'active-tab': currentTab === 'team' }"
              class="border-r border-athens w-full px-4.5px max-w-card-width cursor-pointer"
              @click.prevent="changeTab('team')">
              <div
                class="status-vacancy-tab cursor-pointer opacity-30 hover:opacity-100 hover:bg-athens-gray px-25px py-10px rounded-ten flex flex-col"
                :class="isHovered ? 'opacity-30' : 'opacity-100'">
                <p class="status-vacancy-tab__title leading-normal text-sm font-medium text-space">Команда вакансии</p>
                <div class="tab-description-inner" :class="{ 'tab-description-inner--expanded': isHovered }">
                  <div class="tab-description-inner__clip">
                    <p class="leading-normal text-slate-custom text-13px">Добавьте коллег для совместной работы над вакансией</p>
                  </div>
                </div>
              </div>
            </li>
            <li :class="{ 'active-tab': currentTab === 'funnel' }" class="max-w-[230.8px] w-full pl-5px"
              @click="changeTab('funnel')">
              <div
                class="status-vacancy-tab cursor-pointer opacity-30 hover:opacity-100 hover:bg-athens-gray px-25px py-10px rounded-ten flex flex-col"
                :class="isHovered ? 'opacity-30' : 'opacity-100'">
                <p class="status-vacancy-tab__title leading-normal text-sm font-medium text-space">Воронка найма</p>
                <div class="tab-description-inner" :class="{ 'tab-description-inner--expanded': isHovered }">
                  <div class="tab-description-inner__clip">
                    <p class="leading-normal text-slate-custom text-13px">Настройте этапы воронки для автоматизации найма</p>
                  </div>
                </div>
              </div>
            </li>
          </ul>
          </div>
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
    default: 'Открыта',
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
.status-vacancy-sticky {
  transition: min-height 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.status-vacancy-header {
  min-height: 153px;
  overflow: hidden;
  transition: min-height 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.status-vacancy-header--hovered {
  min-height: 200px;
}

.status-vacancy-tabs-animator {
  overflow: hidden;
  max-height: 3.25rem;
  transition: max-height 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.status-vacancy-tabs--hovered .status-vacancy-tabs-animator {
  max-height: 6.5rem;
}

.status-vacancy-tabs__list {
  align-items: center;
  transition: align-items 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.status-vacancy-tabs--hovered .status-vacancy-tabs__list {
  align-items: stretch;
}

.status-vacancy-tab {
  transition:
    opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.status-vacancy-tab__title {
  margin: 0;
  padding: 0;
}

.tab-description-inner {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  margin: 0;
  padding: 0;
  opacity: 0;
  visibility: hidden;
  transition:
    grid-template-rows 1s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.12s,
    padding-top 1s cubic-bezier(0.16, 1, 0.3, 1),
    visibility 0s linear 1s;
}

.tab-description-inner--expanded {
  grid-template-rows: 1fr;
  padding-top: 0.25rem;
  opacity: 1;
  visibility: visible;
  transition:
    grid-template-rows 1s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.22s,
    padding-top 1s cubic-bezier(0.16, 1, 0.3, 1),
    visibility 0s linear 0s;
}

.tab-description-inner__clip {
  overflow: hidden;
  transform: translateY(-6px);
  transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.tab-description-inner--expanded .tab-description-inner__clip {
  transform: translateY(0);
}

/* Стили для активного таба */
.active-tab div {
  opacity: 1;
  background-color: #f0f4f8;
  border-radius: 10px;
  transition:
    opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Внутренний блок описания — без скругления и без обрезки углов текста */
.active-tab .tab-description-inner,
.active-tab .tab-description-inner__clip {
  border-radius: 0;
}

.active-tab .tab-description-inner--expanded .tab-description-inner__clip {
  overflow: visible;
}
</style>