<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import { getVacancies } from '@/src/api/vacancies';
  import type { Candidate } from '@/types/candidates';
  import type { Vacancy } from '@/types/vacancy';

  const props = defineProps<{
    candidate: Candidate;
  }>();

  const emit = defineEmits<{
    attach: [vacancyId: number];
  }>();

  const isOpen = ref(false);
  const vacancies = ref<Vacancy[]>([]);
  const loading = ref(false);
  const root = ref<HTMLElement | null>(null);

  const loadVacancies = async () => {
    loading.value = true;
    try {
      const list = await getVacancies();
      if (list) {
        vacancies.value = list.filter(
          v => v.id != null && v.id !== props.candidate.vacancy_id
        );
      } else {
        vacancies.value = [];
      }
    } catch (e) {
      console.error('[AttachToVacancyDropdown] Ошибка загрузки вакансий:', e);
      vacancies.value = [];
    } finally {
      loading.value = false;
    }
  };

  watch(isOpen, open => {
    if (open) loadVacancies();
  });

  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  const select = (v: Vacancy) => {
    if (v.id != null) {
      emit('attach', v.id);
      isOpen.value = false;
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (root.value && !root.value.contains(e.target as Node)) {
      isOpen.value = false;
    }
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<template>
  <div ref="root" class="relative inline-block">
    <button
      type="button"
      class="flex items-center gap-2 rounded-ten border border-athens bg-athens-gray px-15px py-2.5 text-sm font-medium text-space transition-colors hover:border-zumthor hover:bg-zumthor hover:text-dodger"
      @click.stop="toggle"
    >
      <span>Прикрепить к вакансии</span>
      <svg
        class="h-4 w-4 shrink-0 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
    <Transition name="slide-fade">
      <div
        v-if="isOpen"
        class="absolute left-0 top-full z-20 mt-1 min-w-[220px] rounded-ten border border-athens bg-white py-1 shadow-shadow-droplist"
        @click.stop
      >
        <div
          v-if="loading"
          class="px-15px py-10px text-sm text-slate-custom"
        >
          Загрузка...
        </div>
        <template v-else-if="vacancies.length">
          <button
            v-for="v in vacancies"
            :key="v.id"
            type="button"
            class="w-full cursor-pointer px-15px py-2.5 text-left text-sm font-normal text-slate-custom hover:bg-zumthor hover:text-space"
            @click="select(v)"
          >
            {{ v.name || v.title || 'Без названия' }}
          </button>
        </template>
        <div
          v-else
          class="px-15px py-10px text-sm text-slate-custom"
        >
          Нет доступных вакансий
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
