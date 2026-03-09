<script setup>
  import { ref, computed } from 'vue';

  const props = defineProps({
    currentPage: Number,
    lastPage: Number,
  });

  const emit = defineEmits(['page-changed']);

  const maxVisiblePages = 5;

  // Вычисляемые свойства
  const shouldShowFirst = computed(() => props.currentPage > 3);
  const shouldShowLast = computed(() => props.currentPage < props.lastPage - 2);

  const showLeftDots = computed(() => props.currentPage > maxVisiblePages);
  const showRightDots = computed(
    () => props.currentPage < props.lastPage - maxVisiblePages + 1
  );

  const visiblePages = computed(() => {
    const { currentPage, lastPage } = props;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);

    if (endPage === lastPage) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
    );
  });

  // Состояние наведения
  const hoverState = ref({
    leftArrow: false,
    rightArrow: false,
    pages: {},
  });

  // Установка состояния наведения
  function setHoverState(key, value) {
    if (key === 'leftArrow' || key === 'rightArrow') {
      hoverState.value[key] = value;
    } else {
      hoverState.value.pages[key] = value;
    }
  }

  // Изменение страницы
  function changePage(page) {
    emit('page-changed', page);
  }

  // Классы для кнопок
  function buttonClasses(type, key) {
    if (type === 'arrow') {
      return hoverState.value[key]
        ? 'bg-zumthor text-dodger'
        : 'bg-athens-gray text-slate-custom';
    } else if (type === 'page') {
      if (props.currentPage === key) {
        return 'bg-space text-white';
      }
      return hoverState.value.pages[key]
        ? 'bg-athens-gray text-space'
        : 'bg-transparent text-slate-custom';
    }
  }
</script>

<template>
  <div class="flex justify-center">
    <div
      class="mt-25px flex w-fit justify-center rounded-ten bg-white p-2.5 leading-normal"
    >
      <!-- Кнопка "Назад" — показываем только если есть предыдущая страница -->
      <button
        v-if="currentPage > 1"
        @click="changePage(currentPage - 1)"
        @mouseover="setHoverState('leftArrow', true)"
        @mouseleave="setHoverState('leftArrow', false)"
        :class="buttonClasses('arrow', 'leftArrow')"
        class="mr-2.5 rounded-ten p-2.5 transition-colors"
      >
        <svg-icon name="pagination-arrow-left" width="20" height="20" />
      </button>

      <!-- Блок с кнопками страниц -->
      <div class="flex justify-center gap-x-5px">
        <!-- Первая страница -->
        <button
          v-if="shouldShowFirst"
          @click="changePage(1)"
          @mouseover="setHoverState(1, true)"
          @mouseleave="setHoverState(1, false)"
          :class="buttonClasses('page', 1)"
          class="h-10 min-w-10 rounded-ten p-1 text-13px font-bold transition-colors"
        >
          1
        </button>

        <!-- Многоточие слева -->
        <span
          v-if="showLeftDots"
          class="flex h-10 min-w-10 items-center justify-center p-2 text-13px font-bold text-slate-custom"
        >
          ...
        </span>

        <!-- Основные страницы -->
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="changePage(page)"
          @mouseover="setHoverState(page, true)"
          @mouseleave="setHoverState(page, false)"
          :class="buttonClasses('page', page)"
          class="h-10 min-w-10 rounded-ten p-1 text-13px font-bold transition-colors"
        >
          {{ page }}
        </button>

        <!-- Многоточие справа -->
        <span
          v-if="showRightDots"
          class="flex h-10 min-w-10 items-center justify-center px-2 text-13px font-bold text-slate-custom"
        >
          ...
        </span>

        <!-- Последняя страница -->
        <button
          v-if="shouldShowLast"
          @click="changePage(lastPage)"
          @mouseover="setHoverState(lastPage, true)"
          @mouseleave="setHoverState(lastPage, false)"
          :class="buttonClasses('page', lastPage)"
          class="h-10 min-w-10 rounded-ten p-1 text-13px font-bold transition-colors"
        >
          {{ lastPage }}
        </button>
      </div>

      <!-- Кнопка "Вперед" — показываем только если есть следующая страница -->
      <button
        v-if="currentPage < lastPage"
        @click="changePage(currentPage + 1)"
        @mouseover="setHoverState('rightArrow', true)"
        @mouseleave="setHoverState('rightArrow', false)"
        :class="buttonClasses('arrow', 'rightArrow')"
        class="ml-2.5 rounded-ten p-2.5 transition-colors"
      >
        <svg-icon name="pagination-arrow-right" width="20" height="20" />
      </button>
    </div>
  </div>
</template>
