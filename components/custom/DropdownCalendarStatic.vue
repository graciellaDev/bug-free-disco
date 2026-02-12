<template>
  <div class="cursor-pointer w-full relative" ref="dataPicker">
    <div class="dropdown-selected-option relative flex items-center border border-athens rounded-ten min-h-10 px-15px bg-athens-gray text-sm font-normal text-[#2F353D]"
      @click="toggleDropdown" @focus="isFocused = true" @blur="handleBlur" :class="[
        { 'bg-athens-gray': !isError },
        { 'border-red-custom': isError },
        { focused: isFocused },
      ]">
      {{ currectDate }}
      <span v-if="!currectDate" class="color-gray text-sm font-normal">
        {{
          props.dateFrom ? 'Начало периода' :
            props.dateTo ? 'Конец периода' :
              'Выберите дату'
        }}
      </span>
      <div class="absolute right-[15px] top-1/2 -translate-y-1/2">
        <transition name="fade-icon" mode="out-in">
          <span :key="props.isOpen">
            <svg-icon :name="isDropDownVisible ? 'calendar-end' : 'calendar-start'"
              :class="isDropDownVisible ? 'text-dodger' : 'text-bali'" width="20" height="20" />
          </span>
        </transition>
      </div>
    </div>
    <transition name="slide-fade">
      <div ref="calendarWrapper" class="calendare-wrapper absolute w-max bottom-0 z-10 right-0 top-[54px]" v-if="isDropDownVisible">
        <CalendarBarStatic ref="calendarBar" @update:placeholder="updateDate" @dblclick="isDropDownVisible = false" class="calendar-wrapper" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import CalendarBarStatic from '@/components/custom/CalendarBarStatic.vue';
import { dateStringToDots } from '../../helpers/date'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  dateFrom: {
    type: Boolean,
    default: false
  },
  dateTo: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: String,
    default: null
  }
})
const emit = defineEmits(['update:modelValue', 'isOpen'])
const calendarBar = ref(null)
const calendarWrapper = ref(null)
const dataPicker = ref(null)

const isDropDownVisible = ref(props.isOpen);

const isFocused = ref(false)
const isError = ref(false)

const currectDate = ref(props.modelValue || null);

const handleBlur = () => {
  isFocused.value = false
}
const toggleDropdown = () => {
  isDropDownVisible.value = !isDropDownVisible.value
  emit('isOpen', isDropDownVisible.value)
}

const updateDate = (newDate) => {
  currectDate.value = dateStringToDots(newDate.toString())
  emit('update:modelValue', currectDate.value)
};

// Обработка клика вне компонента
const handleClickOutside = (event) => {
  if (!isDropDownVisible.value) {
    return;
  }

  // Получаем путь события для проверки всех элементов в цепочке
  // Это важно, так как SelectContent использует портал (teleport) и элементы могут быть вне основного DOM
  const path = event.composedPath ? event.composedPath() : [event.target];
  
  // Находим реальный элемент клика (первый элемент в path, который не является html/document/window)
  // Это нужно, когда event.target указывает на html из-за всплытия события через портал
  const getRealTarget = () => {
    for (const element of path) {
      if (element && 
          element !== document.documentElement && 
          element !== document && 
          element !== window &&
          element instanceof Node) {
        return element;
      }
    }
    return event.target; // Fallback на event.target, если ничего не найдено
  };
  
  const realTarget = getRealTarget();

  // Проверяем, был ли клик внутри SelectContent (выпадающие списки года/месяца) или SelectTrigger
  // SelectContent рендерится через портал, поэтому проверяем в path
  // Важно: если event.target - это html, проверяем все элементы в path до html
  const isInsideSelectContent = (() => {
    // Специальная обработка для случая, когда клик попал на html
    if (event.target === document.documentElement || event.target === document || event.target === window) {
      // Проверяем, есть ли в DOM открытый выпадающий список с role="presentation"
      // Это может быть портал SelectContent от radix-vue
      const presentationElement = document.querySelector('[role="presentation"]');
      if (presentationElement) {
        return true;
      }
      
      // Проходим по всем элементам в path до html и ищем элементы Select
      for (const element of path) {
        if (!element || typeof element === 'string' || !(element instanceof Node)) {
          continue;
        }
        
        // Пропускаем html, document и window
        if (element === document.documentElement || element === document || element === window) {
          continue;
        }
        
        // Проверяем, является ли элемент частью Select
        // Проверяем role атрибуты
        if (element.getAttribute && typeof element.getAttribute === 'function') {
          const role = element.getAttribute('role');
          if (role === 'listbox' || role === 'option' || role === 'presentation') {
            return true;
          }
        }
        
        // Проверяем классы
        if (element.classList && typeof element.classList.contains === 'function') {
          if (element.classList.contains('select-month-custom')) {
            return true;
          }
        }
        
        // Проверяем через closest (работает для всех элементов кроме html/document/window)
        if (element.closest && typeof element.closest === 'function') {
          if (element.closest('[role="listbox"]') ||
              element.closest('[role="option"]') ||
              element.closest('[role="presentation"]') ||
              element.closest('.select-month-custom')) {
            return true;
          }
        }
      }
      return false;
    }
    
    // Обычная проверка для всех элементов в path
    return path.some(element => {
      if (!element || typeof element === 'string' || !(element instanceof Node)) {
        return false;
      }
     
      // Пропускаем html, document и window элементы
      if (element === document.documentElement || element === document || element === window) {
        return false;
      }
      
      return false;
    });
  })();

  // Проверяем, был ли клик внутри календаря или его обертки
  // Проверяем все элементы в пути события, включая дочерние
  const clickedInsideCalendar = path.some(element => {
    if (!element || typeof element === 'string' || !(element instanceof Node)) {
      return false;
    }
    
    // Пропускаем html, document и window элементы
    if (element === document.documentElement || element === document || element === window) {
      return false;
    }
    
    // Проверяем, является ли элемент частью календаря
    const isInsideCalendarWrapper = calendarWrapper.value && calendarWrapper.value.contains(element);
    const isInsideCalendarBar = calendarBar.value?.$el && calendarBar.value.$el.contains(element);
    
    // Проверяем через closest на .calendar-wrapper
    const isInsideCalendarWrapperByClosest = element.closest && typeof element.closest === 'function' && 
      !!element.closest('.calendar-wrapper');
    
    // Проверяем через closest на CalendarHeader (header-handler или select-month-custom)
    const isInsideCalendarHeader = element.closest && typeof element.closest === 'function' && (
      !!element.closest('.header-handler') || 
      !!element.closest('.select-month-custom')
    );
    
    // Проверяем, является ли сам элемент SelectTrigger
    const isSelectTrigger = element.classList && typeof element.classList.contains === 'function' && 
      element.classList.contains('select-month-custom');
    
    // Если элемент внутри calendarBar или calendarWrapper, или является частью CalendarHeader/SelectTrigger
    if (isInsideCalendarWrapper || isInsideCalendarBar || isInsideCalendarWrapperByClosest || isInsideCalendarHeader || isSelectTrigger) {
      return true;
    }
    
    return false;
  });

  // Также проверяем realTarget напрямую для более надежной проверки
  const clickedInsideRealTarget = (() => {
    if (realTarget && realTarget !== event.target && realTarget !== document.documentElement) {
      // Проверяем через closest
      if (realTarget.closest && typeof realTarget.closest === 'function') {
        if (realTarget.closest('.calendar-wrapper') || 
            realTarget.closest('.header-handler') || 
            realTarget.closest('.select-month-custom') ||
            realTarget.closest('[role="listbox"]')) {
          return true;
        }
      }
      // Проверяем через contains
      if (calendarWrapper.value && calendarWrapper.value.contains(realTarget)) {
        return true;
      }
      if (calendarBar.value?.$el && calendarBar.value.$el.contains(realTarget)) {
        return true;
      }
    }
    return false;
  })();

  // Объединяем проверки: клик внутри календаря, CalendarHeader или внутри SelectContent
  const clickedInside = clickedInsideCalendar || clickedInsideRealTarget || isInsideSelectContent;

  // Проверяем, был ли клик на кнопке выбора даты
  const clickedOnButton = path.some(element => {
    if (!element || typeof element === 'string' || !(element instanceof Node)) {
      return false;
    }
    
    // Проверяем, является ли элемент частью кнопки выбора даты
    return element.classList && element.classList.contains('dropdown-selected-option');
  });

  // Закрываем календарь только если клик был вне календаря и не на кнопке
  if (!clickedInside && !clickedOnButton) {
    isDropDownVisible.value = false;
    emit('isOpen', isDropDownVisible.value);
  }
};

// Следим за изменениями modelValue и обновляем currectDate
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    currectDate.value = newValue;
  } else {
    currectDate.value = null;
  }
}, { immediate: true });

onMounted(() => {
  // Инициализируем дату при монтировании, если она еще не установлена
  if (props.modelValue && !currectDate.value) {
    currectDate.value = props.modelValue;
  }
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

</script>

<style scoped>
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

input {
  border-width: 1px;
  transition: border-color 0.3s;
}

input::placeholder {
  font-size: 14px;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
}

.focused {
  border-color: #4a90e2;
}

.border-red-500 {
  border-color: #ef4444;
}

.focused {
  border: 1px solid #5898ff;
  outline: none;
  padding-left: 15px;
  background-image: none;
}

.color-gray {
  color: #9098b4;
}

.fade-icon-enter-active,
.fade-icon-leave-active {
  transition: opacity 0.2s;
}

.fade-icon-enter-from,
.fade-icon-leave-to {
  opacity: 0;
}
</style>