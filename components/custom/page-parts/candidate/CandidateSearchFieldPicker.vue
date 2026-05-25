<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import MyCheckbox from '@/components/custom/MyCheckbox.vue';
  import {
    CANDIDATE_SEARCH_FIELD_LABELS,
    normalizeCandidateSearchField,
    normalizeCandidateSearchFields,
    type CandidateSearchField,
  } from '@/utils/candidateListParams';

  const props = defineProps<{
    modelValue: CandidateSearchField[];
  }>();

  const emit = defineEmits<{
    'update:modelValue': [value: CandidateSearchField[]];
  }>();

  type FieldOption = {
    value: CandidateSearchField;
    label: string;
    indent?: boolean;
  };

  const FIELD_OPTIONS: FieldOption[] = [
    { value: 'all', label: CANDIDATE_SEARCH_FIELD_LABELS.all },
    { value: 'resume_title', label: CANDIDATE_SEARCH_FIELD_LABELS.resume_title },
    { value: 'education', label: CANDIDATE_SEARCH_FIELD_LABELS.education },
    { value: 'skills', label: CANDIDATE_SEARCH_FIELD_LABELS.skills },
    { value: 'experience', label: CANDIDATE_SEARCH_FIELD_LABELS.experience },
    {
      value: 'experience_companies',
      label: CANDIDATE_SEARCH_FIELD_LABELS.experience_companies,
      indent: true,
    },
    {
      value: 'experience_positions',
      label: CANDIDATE_SEARCH_FIELD_LABELS.experience_positions,
      indent: true,
    },
    {
      value: 'experience_duties',
      label: CANDIDATE_SEARCH_FIELD_LABELS.experience_duties,
      indent: true,
    },
  ];

  const rootRef = ref<HTMLElement | null>(null);
  const panelRef = ref<HTMLElement | null>(null);
  const isOpen = ref(false);
  const openUp = ref(false);
  const pendingFields = ref<CandidateSearchField[]>(['all']);

  const displayLabel = computed(() => {
    const fields = normalizeCandidateSearchFields(props.modelValue);
    if (fields.length === 1) {
      return CANDIDATE_SEARCH_FIELD_LABELS[normalizeCandidateSearchField(fields[0])];
    }
    return `Выбрано: ${fields.length}`;
  });

  function updatePanelDirection() {
    if (!rootRef.value) return;
    const triggerRect = rootRef.value.getBoundingClientRect();
    const panelHeight = panelRef.value?.offsetHeight ?? 420;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    openUp.value = spaceBelow < panelHeight && spaceAbove > spaceBelow;
  }

  function openPanel() {
    pendingFields.value = normalizeCandidateSearchFields(props.modelValue);
    isOpen.value = true;
    void nextTick(() => {
      updatePanelDirection();
    });
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

  function hasField(value: CandidateSearchField): boolean {
    return pendingFields.value.includes(value);
  }

  function toggleField(value: CandidateSearchField) {
    const current = normalizeCandidateSearchFields(pendingFields.value);

    if (value === 'all') {
      pendingFields.value = ['all'];
      return;
    }

    const withoutAll = current.filter(v => v !== 'all');
    if (withoutAll.includes(value)) {
      const next = withoutAll.filter(v => v !== value);
      pendingFields.value = next.length > 0 ? next : ['all'];
      return;
    }

    pendingFields.value = [...withoutAll, value];
  }

  function applySelection() {
    emit('update:modelValue', normalizeCandidateSearchFields(pendingFields.value));
    closePanel();
  }

  function onDocumentClick(e: MouseEvent) {
    if (!isOpen.value || !rootRef.value) return;
    if (!rootRef.value.contains(e.target as Node)) {
      closePanel();
    }
  }

  watch(
    () => props.modelValue,
    v => {
      if (!isOpen.value) {
        pendingFields.value = normalizeCandidateSearchFields(v);
      }
    }
  );

  onMounted(() => {
    document.addEventListener('click', onDocumentClick);
    window.addEventListener('resize', updatePanelDirection);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
    window.removeEventListener('resize', updatePanelDirection);
  });
</script>

<template>
  <div ref="rootRef" class="search-field-picker">
    <button
      type="button"
      class="search-field-picker__trigger"
      :class="{ 'search-field-picker__trigger--open': isOpen }"
      @click.stop="togglePanel"
    >
      <span class="search-field-picker__trigger-text">{{ displayLabel }}</span>
      <span
        class="search-field-picker__arrow"
        :class="{ 'search-field-picker__arrow--open': isOpen }"
      >
        <svg-icon name="dropdown-arrow" width="20" height="20" />
      </span>
    </button>

    <div
      v-if="isOpen"
      ref="panelRef"
      class="search-field-picker__panel"
      :class="{ 'search-field-picker__panel--up': openUp }"
      @click.stop
    >
      <div class="search-field-picker__list">
        <div
          v-for="opt in FIELD_OPTIONS"
          :key="opt.value"
          class="search-field-picker__option"
          :class="{ 'search-field-picker__option--indent': opt.indent }"
          @click="toggleField(opt.value)"
        >
          <MyCheckbox
            :id="`search-field-${opt.value}`"
            :label="opt.label"
            :empty-label="false"
            :model-value="hasField(opt.value)"
            @update:model-value="() => toggleField(opt.value)"
            @click.stop
          />
        </div>
      </div>
      <div class="search-field-picker__footer">
        <button type="button" class="search-field-picker__apply" @click="applySelection">
          Применить
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-field-picker {
  position: relative;
  width: 100%;
  min-width: 0;
}

.search-field-picker__trigger {
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

.search-field-picker__trigger--open,
.search-field-picker__trigger:hover {
  border-color: #5898ff;
}

.search-field-picker__trigger-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.search-field-picker__arrow {
  flex-shrink: 0;
  color: #9098b4;
  transition: transform 0.2s ease, color 0.15s ease;
}

.search-field-picker__arrow--open {
  transform: rotate(180deg);
  color: #5898ff;
}

.search-field-picker__panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 220;
  width: max(100%, 280px);
  overflow: hidden;
  border: 1px solid #edeff5;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
}

.search-field-picker__panel--up {
  top: auto;
  bottom: calc(100% + 6px);
}

.search-field-picker__list {
  padding: 8px 0;
}

.search-field-picker__option {
  padding: 6px 15px;
  cursor: pointer;
}

.search-field-picker__option:hover {
  background: #e8f1ff;
}

.search-field-picker__option--indent {
  padding-left: 36px;
}

.search-field-picker__option:not(:last-child) {
  border-bottom: 1px solid #edeff5;
}

.search-field-picker__footer {
  border-top: 1px solid #edeff5;
  padding: 12px 15px;
}

.search-field-picker__apply {
  border: 1px solid #2f353d;
  border-radius: 10px;
  background: #f4f6f8;
  padding: 8px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #2f353d;
  transition: background-color 0.15s ease;
}

.search-field-picker__apply:hover {
  background: #edeff5;
}

.search-field-picker__option :deep(.check-item) {
  width: 20px !important;
  min-width: 20px !important;
  height: 20px !important;
  min-height: 20px !important;
  flex-shrink: 0 !important;
}

</style>
