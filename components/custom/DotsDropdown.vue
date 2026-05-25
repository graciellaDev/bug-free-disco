<script setup lang="ts">
  import {
    ref,
    watch,
    nextTick,
    onMounted,
    onUnmounted,
    type CSSProperties,
  } from 'vue';

  const props = defineProps<{
    items: string[];
    width?: string;
  }>();

  const emit = defineEmits<{
    'select-item': [item: string];
  }>();

  const MENU_GAP_PX = 15;

  const isOpen = ref(false);
  const triggerRef = ref<HTMLElement | null>(null);
  const menuRef = ref<HTMLElement | null>(null);
  const menuStyle = ref<CSSProperties>({});

  const updateMenuPosition = () => {
    const trigger = triggerRef.value;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    menuStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + MENU_GAP_PX}px`,
      right: `${window.innerWidth - rect.right}px`,
      zIndex: 9999,
    };
  };

  const toggleDropdown = async () => {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
      await nextTick();
      updateMenuPosition();
    }
  };

  const closeDropdown = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) return;

    if (triggerRef.value?.contains(target)) return;
    if (menuRef.value?.contains(target)) return;

    isOpen.value = false;
  };

  const handleClick = (item: string) => {
    emit('select-item', item);
    isOpen.value = false;
  };

  const onViewportChange = () => {
    if (isOpen.value) updateMenuPosition();
  };

  watch(isOpen, open => {
    if (open) {
      nextTick(updateMenuPosition);
    }
  });

  onMounted(() => {
    document.addEventListener('click', closeDropdown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
  });

  onUnmounted(() => {
    document.removeEventListener('click', closeDropdown);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onViewportChange, true);
  });
</script>

<template>
  <div class="relative inline-block">
    <button
      ref="triggerRef"
      type="button"
      class="flex h-10 w-10 items-center justify-center rounded-ten border border-athens bg-athens-gray text-slate-custom outline-none transition-all hover:border-zumthor hover:bg-zumthor hover:text-dodger focus:outline-none"
      :class="{ '!border-zumthor !bg-zumthor !text-dodger': isOpen }"
      @click="toggleDropdown"
    >
      <svg-icon name="dots-dropdown" width="22" height="6" />
    </button>
  </div>

  <Teleport to="body">
    <transition name="slide-fade">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="cards min-w-[226px] rounded-plus bg-white shadow-shadow-droplist"
        :class="{ 'min-w-fit': width === 'fit' }"
        :style="menuStyle"
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
  </Teleport>
</template>

<style scoped>
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
