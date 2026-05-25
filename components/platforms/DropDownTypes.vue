<template>
    <div class="dropdown-wrapper cursor-pointer relative" ref="dropDown">
        <div
          class="dropdown-selected-option relative border rounded-ten py-9px pl-15px pr-30px"
          :class="[
            'border-athens',
            (isSelected && selectedOption) ? 'bg-zumthor text-dodger' : 'bg-athens-gray',
          ]"
          @click.stop="toggleDropDown"
        >
            <div>
                <div :class="selectedOption ? 'text-space' : 'text-slate-custom'" class="text-sm truncate pr-4">
                    <div v-if="selectedOption" class="flex items-center gap-2.5">
                        <div class="text-xm items-center font-medium">
                            {{ optionLabel(selectedOption) }}
                            <span class="text-slate-custom text-13px" v-if="selectedOption.available_publications_count > 0">
                                ({{ selectedOption.available_publications_count }})
                            </span>
                        </div>
                    </div>
                    <template v-else>
                        {{ props.placeholder }}
                    </template>
                </div>
                <div
                  class="dropdown-arrow absolute right-3.5 top-2 transition-transform duration-300"
                  :class="[
                    isDropDownVisible ? 'rotate-180 text-dodger' : 'text-bali',
                    (isSelected && selectedOption) ? 'text-dodger' : 'text-bali',
                  ]"
                >
                    <svg-icon name="dropdown-arrow" width="20" height="20" />
                </div>
            </div>
        </div>

        <Teleport v-if="usePortal" to="body">
          <transition name="slide-fade">
            <div
              v-if="isDropDownVisible"
              ref="panelRef"
              class="options-wrapper bg-white border border-athens rounded-ten shadow-shadow-droplist overflow-y-auto"
              :style="panelStyle"
            >
              <template v-for="(option, index) in normalizedOptions" :key="getOptionKey(option, index)">
                <div
                  class="option text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer first:rounded-t-ten last:rounded-b-ten"
                  @click.stop="toggleOptionSelect(option)"
                >
                  <div class="flex min-w-0 items-center gap-2 text-sm font-normal">
                    <span class="min-w-0 flex-1 truncate">{{ optionLabel(option) }}</span>
                    <span
                      v-if="option.available_publications_count > 0"
                      class="shrink-0 text-slate-custom text-13px"
                    >
                      ({{ option.available_publications_count }})
                    </span>
                  </div>
                  <div v-if="option.description" class="text-13px text-slate-custom mt-1">
                    {{ option.description }}
                  </div>
                </div>
              </template>
            </div>
          </transition>
        </Teleport>

        <transition v-else name="slide-fade">
            <div
              v-if="isDropDownVisible"
              ref="panelRef"
              class="options-wrapper absolute left-0 w-full bg-white border border-athens rounded-ten shadow-shadow-droplist z-[200] max-h-[min(280px,40vh)] overflow-y-auto"
              :class="dropUp ? 'bottom-full mb-1' : 'top-full mt-1'"
            >
              <template v-for="(option, index) in normalizedOptions" :key="getOptionKey(option, index)">
                <div
                  class="option text-slate-custom text-sm font-normal py-10px px-15px hover:text-space hover:bg-zumthor cursor-pointer first:rounded-t-ten last:rounded-b-ten"
                  @click.stop="toggleOptionSelect(option)"
                >
                  <div class="flex min-w-0 items-center gap-2 text-sm font-normal">
                    <span class="min-w-0 flex-1 truncate">{{ optionLabel(option) }}</span>
                    <span
                      v-if="option.available_publications_count > 0"
                      class="shrink-0 text-slate-custom text-13px"
                    >
                      ({{ option.available_publications_count }})
                    </span>
                  </div>
                  <div v-if="option.description" class="text-13px text-slate-custom mt-1">
                    {{ option.description }}
                  </div>
                </div>
              </template>
            </div>
        </transition>
    </div>
</template>

<script setup>
import {
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
    nextTick,
    watch,
} from 'vue';

const props = defineProps({
    options: {
        type: Array,
        required: true,
    },
    modelValue: {
        default: null,
    },
    selected: {
        type: [Object, null],
        default: null,
    },
    placeholder: {
        type: String,
        default: 'Выбрать значение',
    },
    variant: {
        type: String,
        default: 'selected',
    },
    dropUp: {
        type: Boolean,
        default: false,
    },
    usePortal: {
        type: Boolean,
        default: false,
    },
});

const dropDown = ref(null);
const panelRef = ref(null);
const isDropDownVisible = ref(false);
const panelStyle = ref({});
const emit = defineEmits(['update:modelValue']);

function optionLabel(option) {
  if (!option || typeof option !== 'object') return '';
  return String(option.name ?? option.title ?? option.label ?? option.value ?? '').trim();
}

function getOptionKey(option, index) {
  const id = option?.id ?? option?.value;
  return id != null ? String(id) : `idx-${index}`;
}

const normalizedOptions = computed(() =>
  (props.options ?? []).filter((option) => option && optionLabel(option)),
);

function resolveRawModel() {
  const raw = props.modelValue ?? props.selected;
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    return raw[0];
  }
  if (typeof raw === 'object' && Object.keys(raw).length === 0) return null;
  return raw;
}

const selectedOption = computed(() => {
  const raw = resolveRawModel();
  if (!raw) return null;
  if (optionLabel(raw)) return raw;
  const id = raw.id ?? raw.value;
  if (id === undefined || id === null) return raw;
  const found = normalizedOptions.value.find(
    (o) => String(o.id) === String(id) || (o.value !== undefined && String(o.value) === String(id)),
  );
  return found ?? raw;
});

const isSelected = computed(() => props.variant === 'selected');

function updatePanelPosition() {
  const el = dropDown.value;
  if (!el || !props.usePortal) return;
  const rect = el.getBoundingClientRect();
  const maxH = Math.min(280, Math.round(window.innerHeight * 0.4));
  const base = {
    position: 'fixed',
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 200)}px`,
    maxHeight: `${maxH}px`,
    zIndex: 10050,
  };
  if (props.dropUp) {
    panelStyle.value = {
      ...base,
      bottom: `${window.innerHeight - rect.top + 4}px`,
    };
  } else {
    const top = rect.bottom + 4;
    const spaceBelow = window.innerHeight - top - 8;
    panelStyle.value = {
      ...base,
      top: `${top}px`,
      maxHeight: `${Math.min(maxH, Math.max(spaceBelow, 120))}px`,
    };
  }
}

const toggleDropDown = async () => {
  isDropDownVisible.value = !isDropDownVisible.value;
  if (isDropDownVisible.value) {
    await nextTick();
    updatePanelPosition();
  }
};

const toggleOptionSelect = (option) => {
  emit('update:modelValue', option || null);
  isDropDownVisible.value = false;
};

const closeDropDown = (event) => {
  const target = event?.target;
  if (!target) return;
  if (dropDown.value?.contains(target)) return;
  if (panelRef.value?.contains(target)) return;
  isDropDownVisible.value = false;
};

const onWindowChange = () => {
  if (isDropDownVisible.value) updatePanelPosition();
};

watch(isDropDownVisible, (open) => {
  if (open && props.usePortal) {
    nextTick(() => updatePanelPosition());
  }
});

onMounted(() => {
  window.addEventListener('click', closeDropDown);
  window.addEventListener('resize', onWindowChange);
  window.addEventListener('scroll', onWindowChange, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', closeDropDown);
  window.removeEventListener('resize', onWindowChange);
  window.removeEventListener('scroll', onWindowChange, true);
});
</script>

<style scoped>
.option:not(:last-child) {
  border-bottom: 1px solid #f4f6f8;
}

.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.15s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
