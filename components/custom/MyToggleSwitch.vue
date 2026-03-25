<template>
  <div class="flex items-center gap-3">
    <button
      :id="id"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-disabled="disabled"
      :disabled="disabled"
      class="relative box-border h-8 w-[52px] shrink-0 cursor-pointer rounded-full border p-[3px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dodger focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      :class="
        modelValue
          ? 'border-dodger bg-dodger'
          : 'border-athens bg-athens-gray'
      "
      @click="onClick"
    >
      <!-- Внутри padding-box 50×30: кружок 24×24 и inset 3px со всех сторон у крайних положений -->
      <span
        class="pointer-events-none absolute left-[3px] top-[3px] h-6 w-6 rounded-full bg-white shadow-sm transition-[left,transform] duration-200 ease-out"
        :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
        aria-hidden="true"
      />
    </button>
    <label
      v-if="label"
      :for="id"
      class="cursor-pointer select-none leading-150"
      :class="[labelColorClass, fontWeightClass, fontSizeClass]"
      @click.prevent="onClick"
    >{{ label }}</label>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  const props = withDefaults(
    defineProps<{
      modelValue: boolean;
      /** Связь с label (доступность) */
      id?: string;
      label?: string;
      disabled?: boolean;
      labelColor?: 'space' | 'dodger' | 'bali';
      fontWeight?: 'normal' | 'medium';
      fontSize?: 'sm' | 'base' | '13px';
    }>(),
    {
      id: undefined,
      label: undefined,
      disabled: false,
      labelColor: 'space',
      fontWeight: 'medium',
      fontSize: 'base',
    }
  );

  const emit = defineEmits<{
    'update:modelValue': [value: boolean];
  }>();

  const labelColorClass = computed(() => {
    const m: Record<string, string> = {
      space: 'text-space',
      dodger: 'text-dodger',
      bali: 'text-bali',
    };
    return m[props.labelColor] ?? 'text-space';
  });

  const fontWeightClass = computed(() =>
    props.fontWeight === 'medium' ? 'font-medium' : 'font-normal'
  );

  const fontSizeClass = computed(() => {
    if (props.fontSize === '13px') {
      return 'text-13px';
    }
    if (props.fontSize === 'sm') {
      return 'text-sm';
    }
    return 'text-base';
  });

  function onClick() {
    if (props.disabled) {
      return;
    }
    emit('update:modelValue', !props.modelValue);
  }
</script>
