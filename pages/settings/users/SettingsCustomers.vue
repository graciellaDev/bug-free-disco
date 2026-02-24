<template>
  <div />
</template>

<script setup>
// Заказчики отображаются на странице «Сотрудники» (раздел «Заказчики»)
definePageMeta({
  layout: 'settings',
});

await navigateTo('/settings/users/SettingsEmployees', { replace: true });
</script>

<style scoped>
</style>
