<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.25s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>

<script setup>
import { PLATFORMS_DEFAULT } from '@/src/constants'
import { provide, ref } from 'vue';


provide('platformsGlobal',  PLATFORMS_DEFAULT)
provide('isPlatforms', false)
provide('vacancyCurrect', ref(null));
</script>
