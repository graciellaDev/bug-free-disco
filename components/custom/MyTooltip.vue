<script setup lang="ts">
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { onMounted, ref } from 'vue'

interface TooltipProps {
  text: string
}

const props = defineProps<TooltipProps>()
const tooltipRef = ref<HTMLElement>()

onMounted(() => {
  tippy(tooltipRef.value?.parentNode as HTMLElement, {
    content: props.text,
    theme: 'material',
    maxWidth: 300,
  })
})
</script>

<template>
  <span ref="tooltipRef"></span>
</template>

<style scoped>
.tippy-box[data-theme~='material'] {
  font-size: 13px;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
  background-color: var(--color_space);
  color: #ffffff;
  border-radius: 3px;
}

.tippy-box[data-theme~='material'][data-placement^='top'] > .tippy-arrow::before {
  border-top-color: var(--color_space);
}

.tippy-box[data-theme~='material'] > .tippy-arrow::before {
  transform: scaleX(0.5) scaleY(1);
}

.tippy-content {
  padding: 10px;
}

.tippy-box[data-placement^='top'] > .tippy-arrow::before {
  bottom: -6px;
  left: -7px;
  border-width: 7px 15px 0;
}
</style>
