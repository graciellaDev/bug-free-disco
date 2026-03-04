<script setup>
import { ref, computed, watch } from 'vue'

import MyInput from '~/components/custom/MyInput.vue'
import PhoneInput from '~/components/custom/PhoneInput.vue'
import UploadFileMin from '~/components/custom/UploadFileMin.vue'

// Пропсы для поддержки v-model
const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({})
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'submit'])

// Реактивные данные формы
const fio = ref({ name: '', lastName: '' })
const mail = ref('')
const phone = ref('')
const loadedResume = ref(null)

// Вычисляемое свойство для объединения всех данных формы
const formData = computed(() => ({
    personalInfo: {
        fio: fio.value,
        email: mail.value,
        phone: phone.value,
        resume: loadedResume.value
    }
}))

// Отслеживание изменений и передача данных родителю
watch(formData, (newData) => {
    emit('update:modelValue', newData)
}, { deep: true })

// Обработчик отправки формы
const handleSubmit = () => {
    if (props.loading) return
    if (!fio.value.name || !fio.value.lastName || !phone.value || !String(phone.value).trim()) {
        alert('Пожалуйста, заполните обязательные поля: имя, фамилию и контактный телефон')
        return
    }
    emit('submit', formData.value)
}
</script>

<template>
    <div>
        <div class="bg-white rounded-fifteen p-25px mb-15px">
            <p class="mb-35px text-space text-xl leading-130 font-semibold">
                Личная информация
            </p>
            <div class="mb-5 grid gap-x-15px grid-cols-2">
                <div>
                    <p class="text-sm font-medium mb-4 leading-normal text-space">
                        <span class="text-red-custom">*</span>
                        Ваше имя
                    </p>
                    <MyInput :placeholder="'Фамилия Имя Отчество'" v-model="fio.name" />
                </div>
                <div>
                    <p class="text-sm font-medium mb-4 leading-normal text-space">
                        <span class="text-red-custom">*</span>
                        Ваша фамилия
                    </p>
                    <MyInput :placeholder="'Фамилия'" v-model="fio.lastName" />
                </div>
            </div>
            <div class="mb-[17px] grid gap-x-15px grid-cols-2">
                <div>
                    <p class="text-sm font-medium mb-4 leading-normal text-space">
                        Электронная почта
                        <span class="text-13px font-normal text-slate-custom">(не обязательно)</span>
                    </p>
                    <MyInput :placeholder="'Введите email'" v-model="mail" />
                </div>
                <div>
                    <p class="text-sm font-medium mb-4 leading-normal text-space">
                        <span class="text-red-custom">*</span>
                        Контактный телефон
                    </p>
                    <PhoneInput v-model="phone" />
                </div>
            </div>
            <div>
                <p class="text-sm font-medium mb-4 leading-normal text-space">
                    Резюме
                    <span class="text-13px font-normal text-slate-custom">
                        (не обязательно)
                    </span>
                </p>
                <UploadFileMin v-model="loadedResume" acceptedFiles="*" />
            </div>
        </div>
        <UiButton
            variant="action"
            size="semiaction"
            class="w-full uppercase min-h-[50px]"
            :disabled="loading"
            @click="handleSubmit"
        >
            {{ loading ? 'Отправка...' : 'Отправить анкету' }}
        </UiButton>
    </div>
</template>