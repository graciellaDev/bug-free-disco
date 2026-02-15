<template>
  <div class="w-full p-15px bg-white rounded-fifteen flex mb-15px">
    <div
      v-if="showIcon"
      class="shrink-0 w-50px h-50px rounded-full flex items-center justify-center mr-15px"
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
    <div class="flex-1 min-w-0 flex">
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
  })
</script>
