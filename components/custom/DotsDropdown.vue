<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';

  const props = defineProps<{
    items: string[];
    width?: string;
  }>();

  const emit = defineEmits<{
    'select-item': [item: string];
  }>();

  const isOpen = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);

  const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
  };

  const closeDropdown = (event: MouseEvent) => {
    if (
      dropdownRef.value &&
      event.target instanceof Node &&
      !dropdownRef.value.contains(event.target)
    ) {
      isOpen.value = false;
    }
  };

  const handleClick = (item: string) => {
    emit('select-item', item);
    isOpen.value = false;
  };

  onMounted(() => {
    document.addEventListener('click', closeDropdown);
  });

  onUnmounted(() => {
    document.removeEventListener('click', closeDropdown);
  });
</script>

<template>
  <div class="relative inline-block" ref="dropdownRef">
    <button
      class="flex h-10 w-10 items-center justify-center rounded-ten border border-athens bg-athens-gray text-slate-custom outline-none transition-all hover:border-zumthor hover:bg-zumthor hover:text-dodger focus:outline-none"
      :class="{ '!border-zumthor !bg-zumthor !text-dodger': isOpen }"
      @click="toggleDropdown"
    >
      <svg-icon name="dots-dropdown" width="22" height="6" />
    </button>
    <transition name="slide-fade">
      <div
        v-if="isOpen"
        class="cards absolute right-0 z-50 mt-15px min-w-[226px] rounded-plus bg-white shadow-shadow-droplist"
        :class="{ 'min-w-fit': width === 'fit' }"
      >
        <div
          v-for="(item, index) in items"
          :key="index"
          class="cards-item cursor-pointer whitespace-nowrap px-15px py-2.5 text-sm font-normal text-slate-custom hover:bg-gray-100 hover:text-space"
          @click="handleClick(item)"
        >
          {{ item }}
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
  /***** Scoped styles не нужны, всё через Tailwind *****/
  .cards-item:not(:last-child) {
    border-bottom: 1px solid #f4f6f8;
  }

  .cards-item:last-of-type {
    border-radius: 0 0 5px 5px;
  }

  .cards-item:first-of-type {
    border-radius: 5px 5px 0 0;
  }

  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(-4px);
    opacity: 0;
  }
</style>
