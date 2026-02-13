<script setup>
import { computed } from 'vue'
import { Label } from '@/components/ui/label'
import { RadioGroupItem } from '@/components/ui/radio-group'

const props = defineProps({
    id: String,
    title: String,
    description: String,
    selectedCards: {
        type: [Array, String],
        default: () => []
    },
    hoveredCard: String,
    /** Скрыть чекбокс/радио */
    hideIndicator: { type: Boolean, default: false },
    /** Синяя обводка при выборе (как у кнопок Опыт работы) */
    showSelectedBorder: { type: Boolean, default: false },
})


const emit = defineEmits(['update:selected', 'hover', 'leave'])

const isMultiple = computed(() => Array.isArray(props.selectedCards))
const isSelected = computed(() => {
    if (isMultiple.value) {
        return props.selectedCards.includes(props.id)
    }
    return props.selectedCards == props.id
})
const isHovered = computed(() => props.hoveredCard == props.id)
const handleClick = () => emit('update:selected', props.id)
const handleHover = () => emit('hover', props.id)
const clearHover = () => emit('leave')
</script>

<template>
    <div class="w-full my-checkbox h-auto">
        <Label :for="id"
          class="h-full cursor-pointer flex flex-col p-15px border rounded-ten bg-athens-gray gap-y-[11px] transition-all"
          @mouseover="handleHover" @mouseleave="clearHover" @click="handleClick"
          :class="{
            'bg-dodger border-transparent': isHovered,
            'bg-zumthor border-dodger': isSelected && showSelectedBorder,
            'border-transparent bg-zumthor': isSelected && !showSelectedBorder,
            'border-athens': !isHovered && !isSelected
          }">
            <div class="flex justify-between w-full card-checkbox">
                <p :class="[
                    isSelected ? 'text-dodger' : 'text-space',
                    isHovered && !isSelected ? 'text-white' : ''
                ]" class="text-15px font-semibold transition-colors">{{ title }}</p>
                <RadioGroupItem v-if="!isMultiple" :id="id" :value="id" :class="{ 'sr-only': hideIndicator }" />
                <div v-else class="w-5 h-5 flex items-center justify-center border rounded-md check-item" :class="{
                    'bg-dodger border-dodger': isSelected,
                    'border-athens bg-athens-gray': !isSelected
                }">
                    <svg v-if="isSelected" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white"
                        viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M16.704 5.293a1 1 0 00-1.408 0L7.5 12.086 4.704 9.293a1 1 0 00-1.408 1.414l3.5 3.5a1 1 0 001.408 0l8-8a1 1 0 000-1.414z"
                            clip-rule="evenodd" />
                    </svg>
                </div>
            </div>
            <p class="text-13px font-normal transition-colors leading-normal"
              :class="isHovered && !isSelected ? 'text-white' : 'text-slate-custom'" v-html="description"></p>
        </Label>
    </div>
</template>

<style scoped lang="scss">
.my-checkbox:hover {
    .card-checkbox {
        .radio-check {
            border: 2px solid #ffffff;
        }

        .radio-check[data-state='checked'] {
            border: 2px solid #5898ff;
        }
    }
}
</style>
