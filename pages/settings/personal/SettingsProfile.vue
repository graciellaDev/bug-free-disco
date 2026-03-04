<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import MyInput from '~/components/custom/MyInput.vue'
import PhoneInput from '~/components/custom/PhoneInput.vue'
import Popup from '~/components/custom/Popup.vue'
import PasswordInput from '~/components/custom/PasswordInput.vue'
import ResponseInput from '~/components/custom/ResponseInput.vue'
import { profile as getProfile } from '~/utils/loginUser'
import { getDepartments } from '~/utils/executorsList'
import { updateEmployee } from '~/utils/registerUser'

const userStore = useUserStore()
const userName = computed(() => userStore.name || 'Гость')
const userRoleName = computed(() => userStore.role || '')

definePageMeta({
  layout: 'settings',
})

useHead({
  title: 'Настройки — Профиль',
})

const profileId = ref(null)
const firstName = ref('')
const lastName = ref('')
const position = ref('')
const division = ref(null)
const phone = ref('')
const email = ref('')
const city = ref('')
const departments = ref([])
const loadError = ref(null)
const saveLoading = ref(false)
const saveSuccess = ref(false)

const changePassword = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const repeatNewPassword = ref('')
const notMatch = ref(false)

function checkRepeatPasswords() {
  notMatch.value = newPassword.value !== repeatNewPassword.value
}

function fillFromProfile(data) {
  if (!data) return
  profileId.value = data.id
  const parts = (data.name || '').trim().split(/\s+/)
  firstName.value = parts[0] || ''
  lastName.value = parts.slice(1).join(' ') || ''
  email.value = data.email || ''
  phone.value = data.phone || ''
  position.value = data.position || ''
  city.value = data.city || ''
  const deps = data.departments
  if (deps && Array.isArray(deps) && deps.length > 0) {
    division.value = { id: deps[0].id, name: deps[0].name }
  } else {
    division.value = null
  }
}

onMounted(async () => {
  try {
    departments.value = await getDepartments()
  } catch (e) {
    console.warn('getDepartments:', e)
    departments.value = []
  }
  const { data: res } = await getProfile()
  const data = res?.data ?? res
  fillFromProfile(data)
  if (data?.name) userStore.setUserData({ name: data.name, email: data.email || '', role: data.role?.name || '' })
})

async function saveProfile() {
  if (profileId.value == null) return
  saveLoading.value = true
  saveSuccess.value = false
  loadError.value = null
  let phoneVal = (phone.value || '').replace(/\D/g, '')
  if (phoneVal.length === 11 && phoneVal.startsWith('8')) phoneVal = '7' + phoneVal.slice(1)
  if (phoneVal.length === 10) phoneVal = '7' + phoneVal
  const phoneFormatted = phoneVal.length === 11 && phoneVal.startsWith('7') ? `+${phoneVal}` : (phone.value || '').trim() || undefined
  const payload = {
    name: `${(firstName.value || '').trim()} ${(lastName.value || '').trim()}`.trim(),
    email: (email.value || '').trim(),
    phone: phoneFormatted,
    position: (position.value || '').trim() || null,
    city: (city.value || '').trim() || null,
    department: division.value?.id ?? division.value ?? null,
  }
  const { error, message } = await updateEmployee(Number(profileId.value), payload)
  saveLoading.value = false
  if (error) {
    loadError.value = message || 'Не удалось сохранить'
    return
  }
  saveSuccess.value = true
  userStore.setUserData({ name: payload.name, email: payload.email || '' })
}
</script>

<template>
  <div>
    <div>
      <div class="w-full bg-white rounded-fifteen flex px-25px py-15px h-fit gap-x-15px items-center mb-15px">
        <UiAvatar size="setting">
          <UiAvatarImage src="https://github.com/radix-vue.png" alt="@radix-vue" />
          <UiAvatarFallback>{{ userStore.initials }}</UiAvatarFallback>
        </UiAvatar>
        <div class="h-fit">
          <p class="text-lg font-medium text-space leading-normal mb-5px">
            {{ userName }}
          </p>
          <p class="text-sm font-normal text-bali">{{ userRoleName || 'Администратор' }}</p>
        </div>
      </div>
      <div class="rounded-fifteen p-25px bg-white mb-15px">
        <p class="text-xl font-semibold text-space mb-25px">Основная информация</p>
        <p v-if="loadError" class="text-red-500 text-sm mb-4">{{ loadError }}</p>
        <p v-if="saveSuccess" class="text-green-600 text-sm mb-4">Изменения сохранены</p>
        <div class="mb-25px">
          <div class="grid grid-cols-2 gap-x-15px gap-y-4 mb-15px">
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-15px">Имя</p>
              <MyInput v-model="firstName" placeholder="Ваше имя" />
            </div>
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-15px">Фамилия</p>
              <MyInput v-model="lastName" placeholder="Ваша фамилия" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-15px gap-y-4 mb-15px">
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-15px">Должность</p>
              <MyInput v-model="position" placeholder="Введите вашу должность" />
            </div>
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-15px">Отдел</p>
              <ResponseInput
                :responses="departments"
                :model-value="division?.name ?? ''"
                :show-roles="true"
                not-found="Отдел не найден"
                placeholder="Выберите значение"
                @update:model-value="(name, id) => { division = (id != null && name != null) ? { id, name } : null }"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-15px gap-y-4 mb-15px">
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-15px">Email</p>
              <MyInput v-model="email" type="email" placeholder="Email" />
            </div>
            <div>
              <p class="text-sm font-medium text-space leading-150 mb-15px">Телефон</p>
              <PhoneInput v-model="phone" placeholder="+7-000-000-0000" />
            </div>
          </div>
          <div class="mb-15px">
            <p class="text-sm font-medium text-space leading-150 mb-15px">Город</p>
            <MyInput v-model="city" placeholder="Например, Москва, Санкт-Петербург" />
          </div>
        </div>
        <UiButton
          variant="black"
          size="semiaction"
          :disabled="saveLoading"
          @click="saveProfile"
        >
          {{ saveLoading ? 'Сохранение...' : 'Сохранить изменения' }}
        </UiButton>
      </div>
      <div class="rounded-fifteen p-25px bg-white">
        <p class="text-xl font-semibold text-space mb-25px">Безопасность</p>
        <div>
          <p class="text-sm font-medium text-space mb-2.5">Пароль аккаунта</p>
          <button class="flex" @click="changePassword = true"><svg-icon name="gear-dodger" width="20"
              height="20" /><span class="ml-5px text-dodger text-sm font-medium">Изменить</span></button>
        </div>
      </div>
    </div>
    <transition name="fade">
      <Popup :isOpen="changePassword" @close="changePassword = false" :width="'490px'">
        <div>
          <p class="text-xl font-semibold text-space mb-[23px]">Изменить основной пароль</p>
          <div class="mb-15px">
            <p class="text-sm font-medium leading-150 mb-15px">Введите текущий пароль</p>
            <PasswordInput v-model="currentPassword" :placeholder="'*************'" />
          </div>
          <div class="mb-15px">
            <p class="text-sm font-medium leading-150 mb-15px">Введите новый пароль</p>
            <PasswordInput v-model="newPassword" :placeholder="'******'" />
          </div>
          <div class="mb-25px">
            <p class="text-sm font-medium leading-150 mb-15px">Повторите новый пароль</p>
            <PasswordInput v-model="repeatNewPassword" :placeholder="'******'" @blur="checkRepeatPasswords()" />
            <span v-if="notMatch" class="text-red-custom text-xs mt-1 block">
              Пароли не совпадают
            </span>
          </div>
          <div class="flex gap-x-15px">
            <UiButton variant="action" size="semiaction">Сохранить</UiButton>
            <UiButton variant="back" size="semiaction" @click="changePassword = false">Отмена</UiButton>
          </div>
        </div>
      </Popup>
    </transition>
  </div>
</template>

<style scoped>
/* Анимация появления и скрытия */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-leave-from {
  opacity: 1;
}
</style>