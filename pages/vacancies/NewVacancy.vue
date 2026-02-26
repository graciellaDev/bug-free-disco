<script setup lang="ts">
  // Редирект на единый маршрут создания/редактирования с опциональным id в пути
  const route = useRoute();
  await navigateTo({
    path: '/vacancies/newvacancy',
    query: route.query,
    replace: true,
  });
</script>

<template>
  <div />
</template>
