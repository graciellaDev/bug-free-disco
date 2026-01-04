<template>
    <div class="dropdown-wrapper cursor-pointer relative" ref="dropDown">
        <div class="dropdown-selected-option relative border rounded-ten py-9px px-15px" :class="[
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
              class="options-wrapper absolute w-full bg-white border border-athens rounded-ten shadow-shadow-droplist top-14 z-10 max-h-400px overflow-y-scroll"
              v-if="isDropDownVisible">
              <template v-for="(option, index) in props.options" :key="index">
                <div
                  class="option font-normal py-13px px-15px hover:bg-athens-gray cursor-pointer first:rounded-t-ten last:rounded-b-ten"
                   @click="toggleOptionSelect(option)">
                    <div class="text-sm items-center text-domain mb-8px">
                        {{ option.name }} 
                            <span class="text-slate-custom" v-if="option.available_publications_count > 0">
                                ({{ option.available_publications_count }})
                            </span>
                    </div>
                    <div class="text-13px text-slate-custom">
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
});


const dropDown = ref(null);
const isDropDownVisible = ref(false);
const emit = defineEmits(['update:modelValue']);
const selectedOption = ref(props.selected); // Устанавливаем начальное значение

const isSelected = computed(() => props.variant === 'selected');
// Открытие/закрытие выпадающего списка
const toggleDropDown = () => {
    isDropDownVisible.value = !isDropDownVisible.value;
};

// Выбор значения
const toggleOptionSelect = (option) => {
    selectedOption.value = option || null;
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
.text-domain {
    width: 272px;
    max-width: 50%;
}
</style>
