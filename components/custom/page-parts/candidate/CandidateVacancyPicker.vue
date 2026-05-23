<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, type CSSProperties } from 'vue';
  import MyCheckbox from '@/components/custom/MyCheckbox.vue';

  type Option = { value: number | string; name: string };

  const props = defineProps<{
    modelValue: number[];
    options: Option[];
    placeholder?: string;
  }>();

  const emit = defineEmits<{
    'update:modelValue': [value: number[]];
  }>();

  const rootRef = ref<HTMLElement | null>(null);
  const panelRef = ref<HTMLElement | null>(null);
  const isOpen = ref(false);
  const panelStyle = ref<CSSProperties>({});

  const normalizedOptions = computed<Option[]>(() => props.options ?? []);
  const selectedIds = computed<number[]>(() =>
    Array.isArray(props.modelValue) ? props.modelValue.map(v => Number(v)).filter(v => Number.isFinite(v) && v > 0) : []
  );

  const currentLabel = computed(() => {
    if (selectedIds.value.length === 0) {
      return props.placeholder ?? 'Любая вакансия';
    }
    if (selectedIds.value.length === 1) {
      const selected = normalizedOptions.value.find(o => Number(o.value) === selectedIds.value[0]);
      return selected?.name ?? (props.placeholder ?? 'Любая вакансия');
    }
    return `Выбрано: ${selectedIds.value.length}`;
  });

  function updatePanelPosition() {
    if (!rootRef.value) return;
    const rect = rootRef.value.getBoundingClientRect();
    panelStyle.value = {
      position: 'fixed',
      top: `${Math.round(rect.bottom + 6)}px`,
      left: `${Math.round(rect.left)}px`,
      width: `${Math.round(rect.width)}px`,
      zIndex: '9999',
    };
  }

  function openPanel() {
    isOpen.value = true;
    void nextTick(() => updatePanelPosition());
  }

  function closePanel() {
    isOpen.value = false;
  }

  function togglePanel() {
    if (isOpen.value) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function toggleValue(value: number | '') {
    if (value === '') {
      emit('update:modelValue', []);
      return;
    }

    const id = Number(value);
    if (!Number.isFinite(id) || id <= 0) return;

    if (selectedIds.value.includes(id)) {
      emit('update:modelValue', selectedIds.value.filter(v => v !== id));
      return;
    }

    emit('update:modelValue', [...selectedIds.value, id]);
  }

  function onDocumentClick(e: MouseEvent) {
    if (!isOpen.value) return;
    const target = e.target as Node;
    if (rootRef.value?.contains(target) || panelRef.value?.contains(target)) {
      return;
    }
    closePanel();
  }

  function onViewportChange() {
    if (!isOpen.value) return;
    updatePanelPosition();
  }

  watch(
    () => props.modelValue,
    () => {
      if (isOpen.value) void nextTick(() => updatePanelPosition());
    }
  );

  watch(
    () => props.options,
    () => {
      if (!isOpen.value) return;
      void nextTick(() => updatePanelPosition());
    },
    { deep: true }
  );

  onMounted(() => {
    document.addEventListener('click', onDocumentClick);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onViewportChange, true);
  });
</script>

<template>
  <div ref="rootRef" class="candidate-vacancy-picker">
    <button
      type="button"
      class="candidate-vacancy-picker__trigger"
      :class="{ 'candidate-vacancy-picker__trigger--open': isOpen }"
      @click.stop="togglePanel"
    >
      <span class="candidate-vacancy-picker__trigger-text">{{ currentLabel }}</span>
      <span
        class="candidate-vacancy-picker__arrow"
        :class="{ 'candidate-vacancy-picker__arrow--open': isOpen }"
      >
        <svg-icon name="dropdown-arrow" width="20" height="20" />
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelRef"
        class="candidate-vacancy-picker__panel"
        :style="panelStyle"
        @click.stop
      >
        <div class="candidate-vacancy-picker__list">
          <div class="candidate-vacancy-picker__option" @click="toggleValue('')">
            <MyCheckbox
              id="vacancy-all"
              label="Любая вакансия"
              :empty-label="false"
              :model-value="selectedIds.length === 0"
              @update:model-value="(checked: boolean) => checked && toggleValue('')"
              @click.stop
            />
          </div>
          <div
            v-for="v in normalizedOptions"
            :key="String(v.value)"
            class="candidate-vacancy-picker__option"
            @click="toggleValue(Number(v.value))"
          >
            <MyCheckbox
              :id="`vacancy-${v.value}`"
              :label="v.name"
              :empty-label="false"
              :model-value="selectedIds.includes(Number(v.value))"
              @update:model-value="() => toggleValue(Number(v.value))"
              @click.stop
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.candidate-vacancy-picker {
  position: relative;
  width: 100%;
}

.candidate-vacancy-picker__trigger {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 8px;
  border: 1px solid #edeff5;
  border-radius: 10px;
  background: #f4f6f8;
  padding: 9px 14px;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #2f353d;
  transition: border-color 0.15s ease;
}

.candidate-vacancy-picker__trigger--open,
.candidate-vacancy-picker__trigger:hover {
  border-color: #5898ff;
}

.candidate-vacancy-picker__trigger-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.candidate-vacancy-picker__arrow {
  flex-shrink: 0;
  color: #9098b4;
  transition: transform 0.2s ease, color 0.15s ease;
}

.candidate-vacancy-picker__arrow--open {
  transform: rotate(180deg);
  color: #5898ff;
}

.candidate-vacancy-picker__panel {
  min-width: 320px;
  overflow: hidden;
  border: 1px solid #edeff5;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
}

.candidate-vacancy-picker__list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

.candidate-vacancy-picker__option {
  padding: 6px 15px;
  cursor: pointer;
}

.candidate-vacancy-picker__option:hover {
  background: #e8f1ff;
}

.candidate-vacancy-picker__option:not(:last-child) {
  border-bottom: 1px solid #edeff5;
}

.candidate-vacancy-picker__option :deep(.check-item) {
  width: 20px !important;
  min-width: 20px !important;
  height: 20px !important;
  min-height: 20px !important;
  flex-shrink: 0 !important;
}
</style>
