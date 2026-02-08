<template>
  <div class="mb-15px flex w-full rounded-fifteen bg-white p-15px">
    <div
      v-if="showIcon"
      class="mr-15px flex h-50px w-50px shrink-0 items-center justify-center rounded-full"
      :class="iconBackground"
    >
      <svg-icon
        v-if="iconName"
        :name="iconName"
        :width="26"
        :height="26"
        :class="iconColor"
      />
    </div>
    <div class="flex min-w-0 flex-1">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    iconName: {
      type: String,
      required: false,
    },
    iconBackground: {
      type: String,
      default: 'bg-athens-gray',
    },
    iconColor: {
      type: String,
      default: '',
    },
    showIcon: {
      type: Boolean,
      default: true,
    },
  });
</script>
