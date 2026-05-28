<script setup>
  import { ref } from 'vue'
  import { debounce } from '@/utils/debounce'

  const currentVacancy = ref('')
  const filteredVacancies = ref([])
  const isFocused = ref(false)
  const showInput = ref(false)

  const props = defineProps({
    placeholder: {
      type: String,
      default: 'Выберите вакансию',
    },
    vacancies: {
      type: Array,
      required: true,
    },
    modelValue: Object | null,
  })

  currentVacancy.value = props.modelValue
  const emit = defineEmits({'update:modelValue': [String, Number | null, String]})
  // Дебаунс-функция для фильтрации списка
  const filterVacancies = debounce(() => {
    const input = currentVacancy.value.toLowerCase()
    filteredVacancies.value = props.vacancies.filter(vacancy => {
      if (input) {
        
        return vacancy?.name.toLowerCase().includes(input) | null
      }
    }
    
      // vacancy.title.toLowerCase().includes(input)
    )
    console.log('filteredVacancies', filteredVacancies.value)
  }, 300)

  const selectVacancy = vacancy => {
    console.log('vacancy', vacancy)
    currentVacancy.value = vacancy
    filteredVacancies.value = []
    isFocused.value = false
    showInput.value = false
    emit('update:modelValue', vacancy, vacancy.id, 'vacancy')
  }

</script>

<template>
  <div class="vacancy-selector relative">
    <!-- Кнопки -->
    <div
      v-if="!showInput && !currentVacancy"
      class="text-dodger text-sm font-medium flex py-2.5 w-fit"
    >
      <button disabled class="cursor-not-allowed">Создать</button>
      <div class="cursor-default">&nbsp;/&nbsp;</div>
      <button @click="showInput = true">Привязать</button>
    </div>

    <!-- Отображение выбранной вакансии -->
    <div v-if="currentVacancy && !showInput">
      <a class="py-2.5 text-sm font-medium text-dodger leading-normal" :href="'/public/vacancies/' + currentVacancy.id">
        {{ currentVacancy.name }}
      </a>
      <p class="text-slate-custom text-13px font-normal leading-normal">
        ID {{ currentVacancy.id }}
      </p>
    </div>

    <!-- Поле ввода с фильтрацией -->
    <div v-if="showInput">
      <input
        type="text"
        v-model="currentVacancy"
        @input="filterVacancies"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :placeholder="isFocused ? '' : placeholder"
        class="vacancy-input w-full py-[9px] pl-[42px] pr-[42px] text-ellipsis border border-athens rounded-ten bg-athens-gray text-sm font-normal focus:outline-none focus:border focus:border-dodger"
      />

      <transition name="slide-fade">
        <ul
          v-if="filteredVacancies.length && isFocused"
          class="absolute w-full bg-white border border-athens rounded-plus shadow-shadow-droplist top-12 z-10 overflow-y-auto max-h-40"
        >
          <li
            v-for="(vacancy, index) in filteredVacancies"
            :key="index"
            class="vacancy text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer"
            @mousedown="selectVacancy(vacancy)"
          >
            {{ vacancy.name }}
          </li>
        </ul>

        <div
          v-else-if="currentVacancy && isFocused"
          class="no-vacancy absolute w-full bg-white border rounded shadow top-12 z-10"
        >
          <div class="text-gray-500 py-2 px-4">
            Вакансия не найдена
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
  .vacancy-selector {
    position: relative;
  }

  .vacancy-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ddd;
    background: #fff;
  }

  .vacancy-input {
    background-image: url('../../assets/sprite/svg/search.svg');
    background-repeat: no-repeat;
    background-position: 15px center;
  }

  .vacancy-input::placeholder {
    color: #9098b4;
    font-size: 14px;
    font-weight: 400;
    font-family: 'Inter', sans-serif;
  }

  .vacancy:not(:last-child) {
    border-bottom: 1px solid #f4f6f8;
  }

  .clear-vacancy {
    transform: translateY(-50%);
    cursor: pointer;
  }

  ::-webkit-scrollbar {
    width: 10px;
    background-color: #f4f6f8;
    border-bottom-right-radius: 5px;
    border-top-right-radius: 5px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #79869a;
    /* Your preferred color */
    border-radius: 5px;
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
