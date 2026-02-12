<template>
  <div class="w-full relative" ref="wrapperRef">
    <input
      type="text"
      ref="inputRef"
      v-model="search"
      class="bg-athens-gray border text-sm border-athens rounded-ten min-h-10 pl-15px w-full text-[#2F353D]"
      :placeholder="isFocused ? '' : placeholder"
      :class="{ focused: isFocused, 'has-value': search, 'no-search-icon': !showSearchIcon }"
      :maxlength="maxlength ?? undefined"
      @focus="handleFocus"
      @blur="isFocused = false"
      @keydown.esc="closeList"
      @keydown.enter="submitCustomValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @change="$emit('update:modelValue', search)"
    />
    <ul
      v-show="searchResults.length && isOpen"
      class="absolute left-0 right-0 max-h-52 overflow-y-auto bg-white z-10 shadow-shadow-droplist rounded-plus"
    >
      <li
        v-for="(result, index) in searchResults"
        :key="result.name"
        @click="setSelected(result.name)"
        :class="[
          index < searchResults.length - 1 ? 'border-b border-athens' : '',
        ]"
        class="text-slate-custom hover:text-space cursor-pointer hover:bg-gallery py-1.5 pl-15px"
      >
        {{ result.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
  import { computed, ref, onMounted, onUnmounted, watch } from 'vue'

  const props = defineProps({
    source: {
      type: Array,
      required: true,
      default: () => [],
    },
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: 'Введите значение',
    },
    initialValue: {
      type: String,
      default: '',
    },
    /** Скрыть иконку поиска при фокусе */
    showSearchIcon: {
      type: Boolean,
      default: true,
    },
    maxlength: {
      type: [Number, String],
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const search = ref(props.initialValue || props.modelValue || '')
  const isFocused = ref(false)
  const isOpen = ref(false)
  const inputRef = ref(null)
  const wrapperRef = ref(null)

  const searchResults = computed(() => {
    if (search.value === '') {
      return []
    }

    return props.source.filter(item => {
      if (item.name.toLowerCase().includes(search.value.toLowerCase())) {
        return item
      }
    })
  })

  const handleFocus = () => {
    isFocused.value = true
    isOpen.value = true
  }

  const setSelected = item => {
    isOpen.value = false
    search.value = item
    emit('update:modelValue', item)
    isFocused.value = false
  }

  const closeList = () => {
    isOpen.value = false
    isFocused.value = false
  }

  const submitCustomValue = () => {
    emit('update:modelValue', search.value)
    isOpen.value = false
    isFocused.value = false
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  const handleClickOutside = event => {
    if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
      closeList()
    }
  }

  watch(
    () => props.modelValue,
    newVal => {
      search.value = newVal || ''
    }
  )

  watch(
    () => search.value,
    newVal => {
      emit('update:modelValue', newVal)
    }
  )
</script>

<style scoped>
  input::placeholder {
    font-size: 14px;
    font-weight: 400;
    font-family: 'Inter', sans-serif;
    max-width: 95%;
  }

  input:placeholder-shown {
    text-overflow: ellipsis;
  }

  input:focus-within {
    outline: none;
  }

  input.focused {
    padding-left: 43px;
    background-image: url('../../assets/sprite/svg/search.svg');
    background-repeat: no-repeat;
    background-position: 15px center;
    background-size: 20px 20px;
    border: 1px solid #5898ff;
  }

  input.focused.no-search-icon {
    padding-left: 15px;
    background-image: none;
  }

  /* input.has-value {
    padding-left: 15px;
} */

  ul {
    top: calc(100% + 15px);
    scrollbar-width: none;
  }
</style>
