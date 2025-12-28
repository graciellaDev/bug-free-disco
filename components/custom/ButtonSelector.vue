<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

  const props = defineProps<{
    modelValue: string;
    options: string[];
  }>();

  const emit = defineEmits(['update:modelValue', 'confirm-transfer']);

  const btnSelector = ref<HTMLElement | null>(null);
  const selectedLabel = ref(''); // начальное значение
  const showDropdown = ref(false);

  const updateModelValue = () => {
    selectedLabel.value = props.modelValue || '';
  };

  const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value;
  };

  const selectOption = (label: string) => {
    selectedLabel.value = label;
    showDropdown.value = false;
    emit('update:modelValue', label);
  };

  const confirmTransfer = () => {
    emit('confirm-transfer', selectedLabel.value);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      btnSelector.value &&
      !btnSelector.value.contains(event.target as Node)
    ) {
      showDropdown.value = false;
    }
  };

  watch(
    () => [props.modelValue, props.options],
    () => {
      updateModelValue();
    },
    { immediate: true, deep: true }
  );

  onMounted(() => {
    window.addEventListener('click', handleClickOutside);
    updateModelValue();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('click', handleClickOutside);
  });
</script>

<template>
  <div class="relative flex h-fit items-center text-left" ref="btnSelector">
    <!-- Кнопка подтверждения -->
    <button
      @click="confirmTransfer"
      class="rounded-l-ten border-r border-pattens bg-zumthor px-3.5 py-2.5 text-sm font-medium text-dodger"
    >
      Перенести на “{{ selectedLabel }}”
    </button>

    <!-- Выпадающий список -->
    <div class="relative inline-block">
      <button
        @click="toggleDropdown"
        class="rounded-r-ten bg-zumthor px-9px py-2.5 text-dodger"
      >
        <svg-icon name="ai-arrow" width="20" height="20" />
      </button>
    </div>
    <transition name="slide-fade">
      <div
        v-if="showDropdown"
        class="absolute top-10 z-10 mt-15px w-full rounded-plus shadow-shadow-droplist"
      >
        <ul class="divide-y divide-athens rounded-plus bg-transparent">
          <li
            v-for="(label, index) in options"
            :key="index"
            @click="selectOption(label)"
            class="cursor-pointer bg-white px-15px py-[9.5px] text-sm font-normal leading-normal text-slate-custom first:rounded-t-plus first:py-2.5 last:rounded-b-plus hover:bg-slate-100"
          >
            {{ label }}
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
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
