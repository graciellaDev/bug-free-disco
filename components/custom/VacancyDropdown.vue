<template>
  <MyDropdown
    :options="options"
    :placeholder="placeholder"
    :initial-value="initialValue"
    :model-value="modelValue"
    :selected="selected"
    class="vacancy-dropdown"
    @select="handleSelect"
    @update:model-value="handleUpdate"
  />
</template>

<script setup lang="ts">
import MyDropdown from './MyDropdown.vue';

interface Option {
  name: string;
  value: number | string;
}

interface Props {
  options: Option[];
  placeholder?: string;
  initialValue?: Option | null;
  modelValue?: string | number | null;
  selected?: number | string | null;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Выберите вакансию',
  initialValue: null,
  modelValue: null,
  selected: null,
});

const emit = defineEmits<{
  select: [option: Option];
  'update:modelValue': [value: number | string | null];
}>();

const handleSelect = (option: Option) => {
  emit('select', option);
};

const handleUpdate = (value: number | string | null) => {
  emit('update:modelValue', value);
};
</script>

<style scoped>
:deep(.vacancy-dropdown) {
  width: 100%;
  max-width: 100%;
}

/* Стилизация выбранной опции */
:deep(.vacancy-dropdown .dropdown-selected-option) {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 1.25rem; /* text-xl */
  font-weight: 600; /* font-semibold */
  line-height: 1.5; /* leading-normal */
  color: #1a1a1a; /* text-space */
}

:deep(.vacancy-dropdown .dropdown-selected-option > div > div:first-child) {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.5;
  color: #1a1a1a;
}

/* Стилизация placeholder */
:deep(.vacancy-dropdown .dropdown-selected-option > div > div:last-child) {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.5;
  color: #1a1a1a;
}

/* Стилизация стрелки */
:deep(.vacancy-dropdown .dropdown-arrow) {
  top: 50%;
  transform: translateY(-50%);
  transition: transform 0.3s ease-in-out;
}

:deep(.vacancy-dropdown .dropdown-arrow.rotate-180) {
  transform: translateY(-50%) rotate(180deg);
}

/* Стилизация выпадающего списка */
:deep(.vacancy-dropdown .options-wrapper) {
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Стилизация элементов списка */
:deep(.vacancy-dropdown .option) {
  padding: 12px 16px;
  font-size: 0.875rem; /* text-sm */
  font-weight: 400;
  color: #64748b; /* text-slate-custom */
  transition: all 0.2s ease;
}

:deep(.vacancy-dropdown .option:hover) {
  background-color: #e8f4f8; /* hover:bg-zumthor */
  color: #1a1a1a; /* hover:text-space */
}

/* Стилизация крестика для сброса */
:deep(.vacancy-dropdown .dropdown-cross) {
  top: 50%;
  transform: translateY(-50%);
  right: 0.875rem;
}

/* Анимация появления списка */
:deep(.vacancy-dropdown .slide-fade-enter-active) {
  transition: all 0.3s ease-out;
}

:deep(.vacancy-dropdown .slide-fade-leave-active) {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

:deep(.vacancy-dropdown .slide-fade-enter-from),
:deep(.vacancy-dropdown .slide-fade-leave-to) {
  transform: translateY(-4px);
  opacity: 0;
}
</style>


