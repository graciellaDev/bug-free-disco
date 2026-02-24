<!-- components/SettingsNavigation.vue -->
<template>
  <nav class="max-w-[275px] p-25px bg-white rounded-fifteen w-full h-fit">
    <!-- Пользователи -->
    <div class="nav-group">
      <h3 class="text-sm font-medium text-space mb-2.5">Пользователи</h3>
      <ul>
        <li :class="{ active: isActive('/settings/users/SettingsEmployees') }">
          <NuxtLink to="/settings/users/SettingsEmployees">Сотрудники</NuxtLink>
        </li>
        <li :class="{ active: isActive('/settings/users/SettingsDepartments') }">
          <NuxtLink to="/settings/users/SettingsDepartments">
            Отделы и роли
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- Рекрутинг -->
    <div class="nav-group">
      <h3 class="text-sm font-medium text-space mb-2.5">Рекрутинг</h3>
      <ul>
        <li :class="{ active: isActive('/settings/recruiting/SettingsForms') }">
          <NuxtLink to="/settings/recruiting/SettingsForms">Анкеты</NuxtLink>
        </li>
        <li :class="{
          active: isActive('/settings/recruiting/SettingsTemplates'),
        }">
          <NuxtLink to="/settings/recruiting/SettingsTemplates">
            Шаблоны
          </NuxtLink>
        </li>
        <li :class="{ active: isActive('/settings/recruiting/settingsfunnel') }">
          <NuxtLink to="/settings/recruiting/settingsfunnel">
            Воронка найма
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- Компания -->
    <div class="nav-group">
      <h3 class="text-sm font-medium text-space mb-2.5">Компания</h3>
      <ul>
        <li :class="{ active: isActive('/settings/company/SettingsCompany') }">
          <NuxtLink to="/settings/company/SettingsCompany">
            Профиль компании
          </NuxtLink>
        </li>
        <li :class="{ active: isActive('/settings/company/SettingsPayment') }">
          <NuxtLink to="/settings/company/SettingsPayment">
            Платежная информация
          </NuxtLink>
        </li>
        <li :class="{ active: isActive('/settings/company/SettingsTariff') }">
          <NuxtLink to="/settings/company/SettingsTariff">
            Тарифный план
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- Интеграции -->
    <div class="nav-group">
      <h3 class="text-sm font-medium text-space mb-2.5">Интеграции</h3>
      <ul>
        <li :class="{
          active: isActive('/settings/integrations/SettingsApplications'),
        }">
          <NuxtLink to="/settings/integrations/SettingsApplications">
            Приложения
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- Личное -->
    <div class="nav-group">
      <h3 class="text-sm font-medium text-space mb-2.5">Личное</h3>
      <ul>
        <li :class="{ active: isActive('/settings/personal/SettingsProfile') }">
          <NuxtLink to="/settings/personal/SettingsProfile">Профиль</NuxtLink>
        </li>
        <li :class="{
          active: isActive('/settings/personal/SettingsNotifications'),
        }">
          <NuxtLink to="/settings/personal/SettingsNotifications" class="block">
            Уведомления
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style scoped>
.nav-group:not(:last-child) {
  margin-bottom: 16px;
}

.nav-group ul {
  list-style: none;
  padding: 0;
}

.nav-group li {
  margin-bottom: 3px;
}

.nav-group a {
  text-decoration: none;
  color: #79869a;
  padding: 9.5px 15px;
  display: block;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 400;
  transition: color 0.2s ease-in-out, background 0.2s ease-in-out;
}

.nav-group .active a {
  font-weight: 500;
  background: #e8f1ff;
  color: #5898ff;
}

.nav-group a:hover {
  background: #f4f6f8;
}
</style>
