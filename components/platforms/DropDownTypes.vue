<template>
    <div class="dropdown-wrapper cursor-pointer relative" ref="dropDown">
        <div class="dropdown-selected-option relative border rounded-ten py-9px pl-15px pr-30px" :class="[
            'border-athens',
            (isSelected && selectedOption) ? 'bg-zumthor text-dodger' : 'bg-athens-gray',
        ]" @click="toggleDropDown">
            <div>
                <div :class="selectedOption ? 'text-space' : 'text-slate-custom'" class="text-sm truncate pr-4">
                    <div v-if="selectedOption" class="flex items-center gap-2.5">
                        <div class="text-xm items-center font-medium">
                            {{ selectedOption.name }} 
                            <span class="text-slate-custom text-13px" v-if="selectedOption.available_publications_count > 0">
                                ({{ selectedOption.available_publications_count }})
                            </span>
                        </div>
                    </div>
                    <template v-else>
                        {{ props.placeholder }}
                    </template>
                    <!-- {{ mappedSelectedOption || props.placeholder }} -->
                </div>
                <!-- Стрелка -->
                <div class="dropdown-arrow absolute right-3.5 top-2 transition-transform duration-300" :class="[
                    isDropDownVisible ? 'rotate-180 text-dodger' : 'text-bali',
                    (isSelected && selectedOption) ? 'text-dodger' : 'text-bali',
                ]">
                    <svg-icon name="dropdown-arrow" width="20" height="20" />
                </div>
            </div>
        </div>
        <transition name="slide-fade">
            <div
              class="options-wrapper absolute left-0 w-full bg-white border border-athens rounded-ten shadow-shadow-droplist z-[200] max-h-[min(280px,40vh)] overflow-y-auto"
              :class="dropUp ? 'bottom-full mb-1' : 'top-full mt-1'"
              v-if="isDropDownVisible">
              <template v-for="(option, index) in props.options" :key="index">
                <div
                  class="option text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer first:rounded-t-ten last:rounded-b-ten"
                  @click="toggleOptionSelect(option)"
                >
                  <div class="flex min-w-0 items-center gap-2 text-sm font-normal">
                    <span class="min-w-0 flex-1 truncate">{{ option.name }}</span>
                    <span
                      v-if="option.available_publications_count > 0"
                      class="shrink-0 text-slate-custom text-13px"
                    >
                      ({{ option.available_publications_count }})
                    </span>
                  </div>
                  <div v-if="option.description" class="text-13px text-slate-custom mt-1">
                    {{ option.description }}
                  </div>
                </div>
              </template>   
            </div>
        </transition>
    </div>
</template>

<script setup>
import {
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
} from 'vue';

const props = defineProps({
    options: {
        type: Array,
        required: true,
    },
    modelValue: {
        default: null,
    },
    selected: {
        type: [Object, null],
        default: null,
    },
    placeholder: {
        type: String,
        default: 'Выбрать значение',
    },
    variant: {
        type: String,
        default: 'selected', // default | selected
    },
    /** Список над триггером (например, у нижнего края модального окна, чтобы не обрезался) */
    dropUp: {
        type: Boolean,
        default: false,
    },
});


const dropDown = ref(null);
const isDropDownVisible = ref(false);
const emit = defineEmits(['update:modelValue']);

// Выбранное значение: берём из пропсов и при необходимости подставляем полный объект из options для отображения (родитель может хранить только { id })
const selectedOption = computed(() => {
  const raw = props.modelValue ?? props.selected;
  if (!raw) return null;
  if (raw.name !== undefined && raw.name !== null && String(raw.name).trim() !== '') return raw;
  const id = raw.id ?? raw.value;
  if (id === undefined || id === null) return raw;
  const found = props.options?.find(
    (o) => String(o.id) === String(id) || (o.value !== undefined && String(o.value) === String(id))
  );
  return found ?? raw;
});

const isSelected = computed(() => props.variant === 'selected');
// Открытие/закрытие выпадающего списка
const toggleDropDown = () => {
    isDropDownVisible.value = !isDropDownVisible.value;
};

// Выбор значения
const toggleOptionSelect = (option) => {
    emit('update:modelValue', option || null);
    isDropDownVisible.value = false;
};

// Закрытие выпадающего списка при клике вне его
const closeDropDown = (element) => {
    if (!dropDown.value?.contains(element.target)) {
        isDropDownVisible.value = false;
    }
};

onMounted(() => {
    window.addEventListener('click', closeDropDown);
});

onBeforeUnmount(() => {
    window.removeEventListener('click', closeDropDown);
});
</script>

<style scoped>
/* Как в MultiSelect («Водительские права»): линия между пунктами */
.option:not(:last-child) {
  border-bottom: 1px solid #f4f6f8;
}
</style>
