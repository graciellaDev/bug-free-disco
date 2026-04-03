<template>
    <div class="flex justify-between mb-3.5">
          <div class="flex items-center gap-2.5">
            <svg-icon :name="platform.platform" width="41" height="40" />
            <p class="text-sm font-medium text-slate-custom">{{ platform.domain }}</p>
          </div>
          <DotsDropdonw :platform :items="dropItems" @select-item="handleSelectItem" />
    </div>
    <div class="w-full h-[1px] bg-athens mb-3.5"></div>
    <p class="text-sm font-medium text-space mb-3.5">Аккаунт:</p>
    <div
      class="flex min-w-0 items-center gap-2.5 rounded-ten bg-feta px-15px py-11px mb-15px"
    >
      <div class="shrink-0">
        <svg-icon name="green-circle" width="11" height="11" />
      </div>
      <p
        class="min-w-0 truncate text-sm font-medium text-space leading-normal"
        :title="platform.data?.email?.trim() || undefined"
      >
        {{ platform.data?.email?.trim() || '—' }}
      </p>
    </div>
</template>

<script setup>
import DotsDropdonw from '~/components/custom/DotsDropdown.vue'

const dropItems = ['Импорт публикаций', 'Отвязать профиль']
const importPopup = ref(false)


const props = defineProps({
    platform : {
        default: null
    }
})
console.log(props.platform)
function disableBodyScroll() {
    document.body.style.overflow = 'hidden' // Отключаем прокрутку
  }

// const handleSelectItem: (item: string)  => {
//     if (item === 'Импорт публикаций') {
//       importPopup.value = true
//       disableBodyScroll()
//     }
//   }
const handleSelectItem = (item) => {
    if (item === 'Импорт публикаций') {
      importPopup.value = true
      disableBodyScroll()
    }
  }
</script>