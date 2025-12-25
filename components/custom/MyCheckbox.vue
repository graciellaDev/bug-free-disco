<template>
    <div class="flex items-center">
        <label :for="id" class="flex items-center cursor-pointer check-wrapper">
            <!-- Скрытый чекбокс -->
            <input type="checkbox" :id="id" :checked="isChecked === 'on'" @change="handleChange" class="hidden" />
            <!-- Визуальный элемент чекбокса -->
            <div class="w-5 h-5 flex items-center justify-center border rounded-md check-item" :class="{
                'bg-dodger border-dodger': isChecked == 'on',
                'border-athens bg-athens-gray': isChecked != 'on',
                'mr-0': emptyLabel,
                'mr-2.5': !emptyLabel,
                'mr-5': twentyGap,
            }">
                <svg v-if="isChecked == 'on'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20"
                  fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M16.704 5.293a1 1 0 00-1.408 0L7.5 12.086 4.704 9.293a1 1 0 00-1.408 1.414l3.5 3.5a1 1 0 001.408 0l8-8a1 1 0 000-1.414z"
                      clip-rule="evenodd" />
                </svg>
            </div>
            <!-- Текстовое значение -->
            <span class="select-none" :class="[
                { 'text-space': labelColor === 'space' },
                { 'text-dodger': labelColor === 'dodger' },
                { 'text-bali': labelColor === 'bali' },
                { 'font-medium': fontWeight === 'medium' },
                { 'text-13px': fontSize === '13px' },
                { 'text-sm': fontSize === 'sm' },
            ]">{{ label }}</span>
        </label>
    </div>
</template>

<script setup>
const props = defineProps({
        id: {
            type: [String, Number],
            required: true,
        },
        label: {
            type: String,
            required: false,
        },
        labelColor: {
            type: String,
            default: "space", // Значение по умолчанию
            validator: (value) => ["space", "dodger", "bali"].includes(value),
        },
        fontWeight: {
            type: String,
            default: "normal",
        },
        modelValue: {
            type: Boolean,
            default: false, // Значение по умолчанию
        },
        emptyLabel: {
            type: Boolean,
            default: false,
        },
        twentyGap: {
            type: Boolean,
            default: false,
        },
        fontSize: {
            type: String,
            default: "sm",
        }
})

const isChecked = ref(props.modelValue ? 'on' : 'off')

const emit = defineEmits(['update:modelValue'])

// Синхронизация с внешним modelValue
watch(() => props.modelValue, (newValue) => {
    isChecked.value = newValue ? 'on' : 'off'
})

const handleChange = (event) => {
    const checked = event.target.checked
    isChecked.value = checked ? 'on' : 'off'
    emit('update:modelValue', checked)
}
</script>

<style scoped>
.check-wrapper:hover .check-item {
    border: 1px solid #5898FF;
}
</style>