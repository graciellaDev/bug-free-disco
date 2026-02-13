<script setup>
  import { ref, watch } from 'vue'

  const props = defineProps({
    placeholder: {
      type: String,
      default: 'Введите значение',
    },
    showSearchIcon: {
      type: Boolean,
      default: true,
    },
    showRoles: {
      type: Boolean,
      default: false,
    },
    responses: {
      type: Array,
      required: true,
      default: [],
    },
    modelValue: {
      type: String,
      default: '',
    },
    minStyles: {
      type: Boolean,
      default: false,
    },
    notFound: {
      type: String,
      default: 'Ответственный не найден',
    },
    error: {
      type: Boolean,
      default: false,
    },
  })

  const currentResponse = ref('')
  currentResponse.value = props.modelValue
  const filteredResponses = ref(props.responses)
  const isFocused = ref(false)
  const emit = defineEmits({'update:modelValue': [String | null, Number | null], 'input:modelValue': [String | null], 'blur': [], 'focus': []})

  const filterResponses = () => {
    const input = currentResponse.value?.toLowerCase() || ''
    filteredResponses.value = props.responses.filter(response => {
      const name = (response.name || '').toLowerCase()
      const role = response.role ? String(response.role).toLowerCase() : ''
      return name.includes(input) || (props.showRoles && role.includes(input))
    })
    emit('update:modelValue', currentResponse.value, null)
    emit('input:modelValue', currentResponse.value, null)
  }

  const clearResponse = () => {
    currentResponse.value = ''
    filteredResponses.value = props.responses
    emit('update:modelValue', '', null)
  }

  const selectResponse = response => {
    currentResponse.value = response.name
    filteredResponses.value = []
    isFocused.value = false
    emit('update:modelValue', response.name, response.id, response.email)
  }

  watch(() => props.modelValue, (val) => {
    currentResponse.value = val ?? ''
  })
</script>

<template>
  <div class="response-input-wrapper">
    <div class="relative">
      <div class="response-input-container relative w-full">
        <input
          type="text"
          v-model="currentResponse"
          @input="filterResponses"
          @focus="isFocused = true; emit('focus')"
          @blur="isFocused = false; emit('blur')"
          :placeholder="isFocused ? '' : placeholder"
          :class="[
            'response-input w-full py-[9px] pr-[42px] text-ellipsis border rounded-ten text-sm font-normal text-[#2F353D] focus:outline-none focus:border focus:border-dodger',
            showSearchIcon ? 'pl-[42px]' : 'pl-15px response-input-no-icon',
            minStyles ? 'bg-transparent border-none' : 'bg-athens-gray border-athens',
            error && '!border-red-500'
          ]"
        />
        <button
          class="clear-response absolute top-2/4 right-4 text-slate-custom"
          v-if="currentResponse"
          @click="clearResponse"
        >
          ✖
        </button>
      </div>

      <transition name="slide-fade">
        <ul
          v-if="filteredResponses.length && isFocused"
          class="responses-list absolute w-full bg-white border border-athens rounded-plus shadow-shadow-droplist top-12 z-10 max-h-[240px] overflow-y-auto"
        >
          <li
            v-for="(response, index) in filteredResponses"
            :key="index"
            class="response text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer"
            @mousedown="selectResponse(response)"
            :class="{ 'flex flex-col gap-y-2': showRoles }"
          >
            <span :class="{ 'text-space': showRoles }">
              {{ response.name }}
            </span>
            <span
              v-if="props.showRoles && response.role"
              class="text-13px text-slate-custom font-normal"
            >
              {{ response.role }}
            </span>
          </li>
        </ul>

        <div
          v-else-if="currentResponse && isFocused"
          class="no-reponse absolute w-full bg-white border border-athens rounded-plus shadow-shadow-droplist top-12 z-10"
        >
          <div class="text-slate-custom text-sm font-normal py-10px px-15px">
            {{ props.notFound }}
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
  .response-input:not(.response-input-no-icon) {
    background-image: url('../../assets/sprite/svg/search.svg');
    background-repeat: no-repeat;
    background-position: 15px center;
  }

  .response-input::placeholder {
    color: #9098b4;
    font-size: 14px;
    font-weight: 400;
    font-family: 'Inter', sans-serif;
  }

  .clear-response {
    transform: translateY(-50%);
    cursor: pointer;
  }

  .response:not(:last-child) {
    border-bottom: 1px solid #f4f6f8;
  }

  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(-4px);
    opacity: 0;
  }
</style>
