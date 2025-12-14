<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import type {
    FormConfig,
    FormFieldConfig,
    ValidationRule,
    FormFieldType,
  } from '@/types/form';
  import MyInput from './MyInput.vue';
  import MyTextarea from './MyTextarea.vue';
  import MyDropdown from './MyDropdown.vue';
  import MyCheckbox from './MyCheckbox.vue';

  const props = defineProps<{
    config: FormConfig; // конфигурация формы
    modelValue?: Record<string, any>; // начальные данные формы
    serverErrors?: Record<string, string>; // ошибки с сервера
    loading?: boolean; // состояние загрузки
  }>();

  const emit = defineEmits<{
    submit: [data: Record<string, any>];
    cancel: [];
  }>();

  // Инициализация данных формы из конфигурации
  function initializeFormData(): Record<string, any> {
    const data: Record<string, any> = {};
    props.config.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        data[field.name] = field.defaultValue;
      } else {
        data[field.name] = getDefaultValue(field.type);
      }
    });
    return data;
  }

  // Получение значения по умолчанию для типа поля
  function getDefaultValue(type: FormFieldType): any {
    switch (type) {
      case 'checkbox':
        return false;
      case 'number':
        return null;
      default:
        return '';
    }
  }

  // Данные формы - инициализация один раз при создании
  const formData = ref<Record<string, any>>(
    props.modelValue
      ? { ...initializeFormData(), ...props.modelValue }
      : initializeFormData()
  );

  // Ошибки валидации
  const formErrors = ref<Record<string, string>>({});

  // Валидация одного поля
  function validateField(fieldName: string, value: any): boolean {
    const field = props.config.fields.find(f => f.name === fieldName);
    if (!field) return true;

    // Получаем правило валидации (из поля или из config.validationRules)
    const rule: ValidationRule | undefined =
      field.validation || props.config.validationRules?.[fieldName];

    if (!rule) {
      // Удаляем ошибку только если это не серверная ошибка
      if (!props.serverErrors?.[fieldName]) {
        delete formErrors.value[fieldName];
      }
      return true;
    }

    let error: string | null = null;

    // Проверка на обязательность
    if (rule.required) {
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        error = rule.message || `${field.label} обязательно для заполнения`;
      }
    }

    // Проверка паттерна (если поле не пустое)
    if (!error && rule.pattern && value) {
      if (!rule.pattern.test(String(value))) {
        error = rule.message || `${field.label} имеет неверный формат`;
      }
    }

    // Проверка минимальной длины
    if (!error && rule.minLength && value) {
      if (String(value).length < rule.minLength) {
        error =
          rule.message ||
          `${field.label} должен содержать минимум ${rule.minLength} символов`;
      }
    }

    // Проверка максимальной длины
    if (!error && rule.maxLength && value) {
      if (String(value).length > rule.maxLength) {
        error =
          rule.message ||
          `${field.label} должен содержать максимум ${rule.maxLength} символов`;
      }
    }

    // Проверка минимального значения
    if (!error && rule.min !== undefined && value !== null && value !== '') {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue < rule.min) {
        error =
          rule.message || `${field.label} должно быть не менее ${rule.min}`;
      }
    }

    // Проверка максимального значения
    if (!error && rule.max !== undefined && value !== null && value !== '') {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > rule.max) {
        error =
          rule.message || `${field.label} должно быть не более ${rule.max}`;
      }
    }

    // Кастомная валидация
    if (!error && rule.custom) {
      const customError = rule.custom(value, formData.value);
      if (customError) {
        error = customError;
      }
    }

    // Сохраняем или удаляем ошибку
    if (error) {
      formErrors.value[fieldName] = error;
      return false;
    } else {
      if (!props.serverErrors?.[fieldName]) {
        delete formErrors.value[fieldName];
      }
      return true;
    }
  }

  // Валидация всей формы
  function validateForm(): boolean {
    formErrors.value = {};

    let isValid = true;

    props.config.fields.forEach(field => {
      if (!field.hidden) {
        if (!validateField(field.name, formData.value[field.name])) {
          isValid = false;
        }
      }
    });

    // После валидации применяем серверные ошибки (если они есть)
    if (props.serverErrors) {
      const serverErrorKeys = Object.keys(props.serverErrors).filter(
        errorKey => errorKey !== '_general'
      );
      serverErrorKeys.forEach(key => {
        formErrors.value[key] = props.serverErrors![key];
      });
    }

    return isValid;
  }

  // Обработка blur поля
  function handleFieldBlur(fieldName: string) {
    const value = formData.value[fieldName];
    validateField(fieldName, value);
  }

  // Обработка отправки формы
  function handleSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    // Валидируем форму
    const isValid = validateForm();

    if (isValid) {
      console.log('[DynamicForm] Эмитим submit с данными:', {
        ...formData.value,
      });
      // Если валидация прошла - возвращаем данные родителю
      emit('submit', { ...formData.value });
    } else {
      console.log(
        '[DynamicForm] Валидация не прошла, ошибки:',
        formErrors.value
      );
    }
    // Если валидация не прошла - ошибки уже показаны в полях
  }

  // Обработка отмены
  function handleCancel() {
    emit('cancel');
  }

  // Группировка полей по строкам
  const groupedFields = computed(() => {
    const groups: Record<number, FormFieldConfig[]> = {};
    let autoRowIndex = 0;

    props.config.fields.forEach(field => {
      // Если row не указан, каждое поле идет в свою строку
      const row = field.row !== undefined ? field.row : autoRowIndex++;

      if (!groups[row]) {
        groups[row] = [];
      }
      groups[row].push(field);
    });

    // Сортируем строки по номеру
    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .map(row => groups[row]);
  });

  // Вычисление стилей для поля с учетом gap
  const getFieldStyle = (
    field: FormFieldConfig,
    rowFields: FormFieldConfig[]
  ) => {
    if (rowFields.length <= 1 || !field.colSpan) {
      return {};
    }

    const totalColSpan = rowFields.reduce(
      (sum, f) => sum + (f.colSpan || 12),
      0
    );
    const gapCount = rowFields.length - 1;
    const gapPerField = (15 * gapCount) / rowFields.length;
    const fieldPercentage = (field.colSpan / totalColSpan) * 100;

    return {
      flexBasis: `calc(${fieldPercentage}% - ${gapPerField}px)`,
    };
  };

  // Обновление формы при изменении начальных данных от родителя
  watch(
    () => props.modelValue,
    newValue => {
      if (newValue) {
        // Обновляем форму, объединяя с дефолтными значениями
        formData.value = { ...initializeFormData(), ...newValue };
      } else {
        // Если передан null/undefined - сбрасываем форму
        formData.value = initializeFormData();
      }
    },
    { immediate: false }
  );

  // Применение ошибок сервера к полям формы
  watch(
    () => props.serverErrors,
    errors => {
      if (errors) {
        // Применяем ошибки сервера к полям (кроме _general)
        Object.keys(errors).forEach(key => {
          if (key !== '_general') {
            formErrors.value[key] = errors[key];
          }
        });
      } else {
        // Если ошибок нет - очищаем серверные ошибки из полей
        // (клиентские ошибки валидации остаются)
        Object.keys(formErrors.value).forEach(key => {
          // Удаляем только те ошибки, которые были от сервера
          // Это упрощенная логика - можно улучшить, если нужно различать
        });
      }
    },
    { immediate: true }
  );
</script>

<template>
  <form @submit.prevent="handleSubmit" :class="config.class">
    <!-- Общее сообщение об ошибке сервера -->
    <div
      v-if="serverErrors?._general"
      class="mb-4 rounded-ten border border-red-200 bg-red-50 p-4 text-red-700"
    >
      {{ serverErrors._general }}
    </div>

    <!-- Группировка полей по строкам -->
    <div
      v-for="(rowFields, rowIndex) in groupedFields"
      :key="rowIndex"
      :class="['mb-4', rowFields.length > 1 ? 'flex gap-15px' : '']"
    >
      <!-- Поля в строке -->
      <div
        v-for="field in rowFields"
        :key="field.name"
        v-show="!field.hidden"
        :class="[
          rowFields.length > 1
            ? field.colSpan
              ? 'flex-shrink-0 flex-grow-0'
              : 'flex-1'
            : 'w-full',
        ]"
        :style="getFieldStyle(field, rowFields)"
      >
        <!-- Лейбл поля (не показываем для checkbox, т.к. у него свой лейбл) -->
        <label
          v-if="field.type !== 'checkbox'"
          :for="field.name"
          class="mb-2 block text-sm font-medium text-space"
        >
          {{ field.label }}
          <span
            v-if="field.required || field.validation?.required"
            class="text-red-500"
          >
            *
          </span>
        </label>

        <!-- Поле ввода: text, email, tel, number -->
        <MyInput
          v-if="['text', 'email', 'tel', 'number'].includes(field.type)"
          :id="field.name"
          :model-value="formData[field.name]"
          @update:model-value="(value: any) => (formData[field.name] = value)"
          @blur="handleFieldBlur(field.name)"
          :type="field.type"
          :placeholder="field.placeholder"
          :class="`${field.class || ''} ${formErrors[field.name] || serverErrors?.[field.name] ? 'border-red-500' : ''}`"
          :readonly="field.disabled || loading"
        />

        <!-- Поле textarea -->
        <MyTextarea
          v-else-if="field.type === 'textarea'"
          :id="field.name"
          :model-value="formData[field.name]"
          @update:model-value="(value: any) => (formData[field.name] = value)"
          @blur="handleFieldBlur(field.name)"
          :placeholder="field.placeholder"
          :max-height="field.maxHeight"
          :class="`${field.class || ''} ${formErrors[field.name] || serverErrors?.[field.name] ? 'border-red-500' : ''}`"
        />

        <!-- Поле select (dropdown) -->
        <MyDropdown
          v-else-if="field.type === 'select'"
          :id="field.name"
          :model-value="formData[field.name]"
          @update:model-value="(value: any) => (formData[field.name] = value)"
          :options="field.options || []"
          :placeholder="field.placeholder || 'Выберите значение'"
          :class="`${field.class || ''} ${formErrors[field.name] || serverErrors?.[field.name] ? 'border-red-500' : ''}`"
        />

        <!-- Поле checkbox -->
        <MyCheckbox
          v-else-if="field.type === 'checkbox'"
          :id="field.name"
          :model-value="formData[field.name]"
          @update:model-value="(value: any) => (formData[field.name] = value)"
          :label="field.label"
          :class="field.class"
          :empty-label="false"
        />

        <!-- Кастомный компонент -->
        <component
          v-else-if="field.type === 'custom' && field.component"
          :is="field.component"
          :id="field.name"
          :model-value="formData[field.name]"
          @update:model-value="(value: any) => (formData[field.name] = value)"
          @blur="handleFieldBlur(field.name)"
          :placeholder="field.placeholder"
          :class="`${field.class || ''} ${formErrors[field.name] || serverErrors?.[field.name] ? 'border-red-500' : ''}`"
          :disabled="field.disabled || loading"
          v-bind="field.props || {}"
        />

        <!-- Сообщение об ошибке (клиентская валидация или серверная) -->
        <span
          v-if="formErrors[field.name] || serverErrors?.[field.name]"
          class="mt-1 block text-xs text-red-500"
        >
          {{ formErrors[field.name] || serverErrors?.[field.name] }}
        </span>
      </div>
    </div>

    <!-- Кнопки действий -->
    <div class="mt-6 flex w-fit justify-between gap-15px">
      <UiButton
        variant="action"
        size="semiaction"
        class="font-bold"
        type="submit"
        :disabled="loading"
      >
        {{ loading ? 'Отправка...' : config.submitButtonText || 'Отправить' }}
      </UiButton>

      <UiButton
        v-if="config.showCancelButton !== false"
        variant="back"
        size="second-back"
        class="font-medium"
        type="button"
        @click="handleCancel"
        :disabled="loading"
      >
        {{ config.cancelButtonText || 'Отмена' }}
      </UiButton>
    </div>
  </form>
</template>
