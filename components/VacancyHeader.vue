<template>
  <div class="sticky top-0 z-50 w-full bg-space">
    <div class="max-w-2xl px-50px py-[12.8px] mx-auto flex leading-normal items-center">
      <NuxtLink to="/vacancies">
        <h1 class="text-white text-25px font-bold uppercase px-3 py-0.5 mr-4">
          jobly
        </h1>
      </NuxtLink>
      <ul class="flex gap-x-5px items-center">
        <li>
          <NuxtLink to="/applications" exact-active-class="active-link">
            <p
              class="page-name leading-normal text-white opacity-50 px-3 py-2 hover:opacity-100 transition-all rounded-lg hover:bg-hoverbtn text-15px font-semibold">
              Заявки
            </p>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/vacancies"  :class="{ 'active-link': isVacanciesActive }">
            <p
              class="page-name leading-normal text-white opacity-50 px-3 py-2 hover:opacity-100 transition-all 
              rounded-lg hover:bg-hoverbtn text-15px font-semibold">
              Вакансии
            </p>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/candidates" exact-active-class="active-link">
            <p
              class="page-name leading-normal text-white opacity-50 px-3 py-2 hover:opacity-100 transition-all rounded-lg hover:bg-hoverbtn text-15px font-semibold">
              Кандидаты
            </p>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/reports" exact-active-class="active-link">
            <p
              class="page-name leading-normal text-white opacity-50 px-3 py-2 hover:opacity-100 transition-all rounded-lg hover:bg-hoverbtn text-15px font-semibold">
              Отчеты
            </p>
          </NuxtLink>
        </li>
      </ul>
      <ul class="flex ml-auto items-center">
        <li class="mr-5px">
          <NuxtLink to="/activity" exact-active-class="active-link">
            <div
              class="page-name w-10 h-10 rounded-full flex items-center justify-center hover:bg-hoverbtn transition-all cursor-pointer">
              <svg-icon name="pulse" width="20" height="20" />
            </div>
          </NuxtLink>
        </li>
        <li class="mr-5px">
          <NuxtLink to="/tasks" exact-active-class="active-link">
            <div
              class="page-name w-10 h-10 rounded-full flex items-center justify-center hover:bg-hoverbtn transition-all cursor-pointer text-white">
              <svg-icon name="calendar" width="20" height="20" />
            </div>
          </NuxtLink>
        </li>
        <li class="mr-5px">
          <NuxtLink to="/notifications" exact-active-class="active-link">
            <div
              class="page-name w-10 h-10 rounded-full flex items-center justify-center hover:bg-hoverbtn transition-all cursor-pointer">
              <svg-icon name="bell" width="20" height="20" />
            </div>
          </NuxtLink>
        </li>
        <li class="mr-5">
          <NuxtLink to="/settings" :class="{ 'active-link': isSettingsActive }">
            <div
              class="page-name w-10 h-10 text-white rounded-full flex items-center justify-center hover:bg-hoverbtn transition-all cursor-pointer">
              <svg-icon name="settings" width="20" height="20" />
            </div>
          </NuxtLink>
        </li>
        <li class="relative">
          <button ref="toggleButtonRef" class="cursor-pointer max-h-[40px]" @click="toggleNotification">
            <UiAvatar>
              <UiAvatarImage src="https://github.com/radix-vue.png" alt="@radix-vue" />
              <UiAvatarFallback>{{ userStore.initials }}</UiAvatarFallback>
            </UiAvatar>
          </button>
          <PopupNotification :is-visible="showNotification" position="top-right" :ignore-elements="[toggleButtonRef]"
            @update:isVisible="showNotification = $event">
            <div>
              <div class="p-15px flex gap-x-15px items-center border-b border-athens">
                <UiAvatar size="fourtyfive">
                  <UiAvatarImage src="https://github.com/radix-vue.png" alt="@radix-vue" />
                  <UiAvatarFallback class="text-dodger">
                    {{ userStore.initials }}
                  </UiAvatarFallback>
                </UiAvatar>
                <div>
                  <p class="text-sm font-medium leading-150 mb-5px whitespace-nowrap">
                    {{ userName }}
                  </p>
                  <span class="text-13px text-slate-custom leading-130">
                    {{ userStore.role }}
                  </span>
                </div>
              </div>
              <ul class="[&>*:not(:last-of-type)]:border-b border-athens">
                <li>
                  <button class="w-full py-2.5 px-15px text-left text-sm text-slate-custom">
                    Помощь
                  </button>
                </li>
                <li>
                  <button class="w-full py-2.5 px-15px text-left text-sm text-slate-custom" @click="handleLogout">
                    Выйти из системы
                  </button>
                </li>
              </ul>
            </div>
          </PopupNotification>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ref, computed } from 'vue'
import { logout } from '~/utils/logout'

import PopupNotification from '~/components/custom/PopupNotification.vue'

const route = useRoute()
const isVacanciesActive = computed(() => route.path.startsWith('/vacancies'))
const isSettingsActive = computed(() => route.path.startsWith('/settings'))
const userStore = useUserStore()
const showNotification = ref(false)
const toggleButtonRef = ref(null)
const userName = computed(() => userStore.name || 'Гость')
const userRole = computed(() => userStore.role)

const toggleNotification = () => {
  showNotification.value = !showNotification.value
}

const handleLogout = () => {
  logout()
}
</script>

<style lang="scss" scoped>
.active-link {
  .page-name {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
