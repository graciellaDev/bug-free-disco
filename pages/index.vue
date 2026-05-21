<script setup lang="ts">
  // Дашборд временно отключён — все заходы на / уходят на список вакансий (см. middleware/auth.global.ts).
  await navigateTo('/vacancies', { replace: true });
</script>
