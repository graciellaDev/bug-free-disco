<template>
  <div class="w-full mb-25px">
    <p class="text-sm font-medium text-space mb-3.5">Аккаунт:</p>
    <div
      class="flex w-full min-w-0 items-center gap-2.5 rounded-ten bg-feta px-15px py-11px"
    >
      <div class="shrink-0">
        <svg-icon name="green-circle" width="11" height="11" />
      </div>
      <p
        class="min-w-0 truncate text-sm font-medium leading-normal text-space"
        :title="props.email?.trim() || undefined"
      >
        {{ accountLabel }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  email: {
    type: String,
    default: '',
  },
})

const accountLabel = computed(() => props.email?.trim() || '—')
</script>