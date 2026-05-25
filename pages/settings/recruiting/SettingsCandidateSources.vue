<script setup lang="ts">
definePageMeta({
  layout: 'settings',
})

useHead({
  title: 'Настройки — Справочники',
})

await navigateTo('/settings/users/SettingsDepartments?tab=candidateSources')
</script>

<template>
  <div class="rounded-fifteen bg-white p-25px">
    <p class="text-sm text-bali">Перенаправление в раздел «Справочники»…</p>
  </div>
</template>

