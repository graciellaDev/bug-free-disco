<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
  } from 'vue';
  import MyCheckbox from '~/components/custom/MyCheckbox.vue';

  export type BulkBarActionItem = {
    id: string;
    label: string;
    icon: string;
    iconClass?: string;
  };

  const props = withDefaults(
    defineProps<{
      /** Показывать панель */
      visible?: boolean;
      selectedCount?: number;
      allSelected?: boolean;
      /** Длина списка для «выбрать всех» */
      listLength?: number;
      loading?: boolean;
      actions?: BulkBarActionItem[];
      /** Сколько действий всегда видно (остальные — в ленте / «Ещё») */
      pinnedCount?: number;
      ariaLabel?: string;
      selectAllLabel?: string;
    }>(),
    {
      visible: false,
      selectedCount: 0,
      allSelected: false,
      listLength: 0,
      loading: false,
      actions: () => [],
      pinnedCount: 4,
      ariaLabel: 'Действия с выбранными элементами',
      selectAllLabel: 'Выбрать всех',
    }
  );

  const emit = defineEmits<{
    'update:allSelected': [value: boolean];
    action: [id: string];
  }>();

  const bulkBarChipClass =
    'inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-normal text-white/90 hover:bg-white/10 hover:text-white disabled:opacity-40 sm:rounded-md sm:px-1 sm:py-0.5 whitespace-nowrap';

  const bulkActionsOuterRef = ref<HTMLElement | null>(null);
  const bulkMeasureRowRef = ref<HTMLElement | null>(null);
  const bulkVisiblePoolCount = ref(
    Math.max(0, props.actions.length - props.pinnedCount)
  );
  const bulkMoreOpen = ref(false);

  const bulkBarPinnedActions = computed(() =>
    props.actions.slice(0, props.pinnedCount)
  );
  const bulkBarOverflowPoolAll = computed(() =>
    props.actions.slice(props.pinnedCount)
  );
  const bulkBarVisiblePoolActions = computed(() =>
    bulkBarOverflowPoolAll.value.slice(0, bulkVisiblePoolCount.value)
  );
  const bulkBarOverflowMenuActions = computed(() =>
    bulkBarOverflowPoolAll.value.slice(bulkVisiblePoolCount.value)
  );

  function runBulkBarAction(id: string) {
    bulkMoreOpen.value = false;
    emit('action', id);
  }

  function handleSelectAllToggle() {
    emit('update:allSelected', !props.allSelected);
  }

  const BULK_BAR_GAP_PX = 12;
  const BULK_MORE_BTN_RESERVE_PX = 76;

  async function updateBulkBarSplit() {
    await nextTick();
    const outer = bulkActionsOuterRef.value;
    const measureRow = bulkMeasureRowRef.value;
    if (!outer || !measureRow) return;
    const chips = measureRow.querySelectorAll<HTMLElement>(
      '[data-bulk-measure-chip]'
    );
    if (chips.length !== props.actions.length) return;
    const widths = Array.from(chips).map(el =>
      Math.ceil(el.getBoundingClientRect().width)
    );
    const available = Math.floor(outer.getBoundingClientRect().width);
    const n = props.actions.length;
    const pinCount = props.pinnedCount;
    const poolCount = n - pinCount;
    const pinWidths = widths.slice(0, pinCount);
    const poolWidths = widths.slice(pinCount);
    const pinnedBlock =
      pinWidths.reduce((s, w) => s + w, 0) +
      (pinCount > 1 ? (pinCount - 1) * BULK_BAR_GAP_PX : 0);

    let bestK = 0;
    for (let k = poolCount; k >= 0; k--) {
      const overflowPart =
        k === 0
          ? 0
          : poolWidths.slice(0, k).reduce((s, w) => s + w, 0) +
            (k - 1) * BULK_BAR_GAP_PX;
      const gapPinToPool = k > 0 ? BULK_BAR_GAP_PX : 0;
      const needMore = k < poolCount;
      const gapBeforeMore = needMore ? BULK_BAR_GAP_PX : 0;
      const moreW = needMore ? BULK_MORE_BTN_RESERVE_PX : 0;
      const total =
        pinnedBlock + gapPinToPool + overflowPart + gapBeforeMore + moreW;
      if (total <= available) {
        bestK = k;
        break;
      }
    }
    bulkVisiblePoolCount.value = bestK;
  }

  let bulkBarSplitRaf = 0;
  function scheduleBulkBarSplit() {
    if (bulkBarSplitRaf) cancelAnimationFrame(bulkBarSplitRaf);
    bulkBarSplitRaf = requestAnimationFrame(() => {
      bulkBarSplitRaf = 0;
      void updateBulkBarSplit();
    });
  }

  let bulkBarResizeObserver: ResizeObserver | null = null;

  function onBulkBarDocClick(e: MouseEvent) {
    if (!bulkMoreOpen.value) return;
    const t = e.target;
    if (t instanceof Node && bulkActionsOuterRef.value?.contains(t)) return;
    bulkMoreOpen.value = false;
  }

  onMounted(() => {
    document.addEventListener('click', onBulkBarDocClick, true);
    window.addEventListener('resize', scheduleBulkBarSplit);
    bulkBarResizeObserver = new ResizeObserver(() => scheduleBulkBarSplit());
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', onBulkBarDocClick, true);
    window.removeEventListener('resize', scheduleBulkBarSplit);
    bulkBarResizeObserver?.disconnect();
    bulkBarResizeObserver = null;
  });

  watch(
    () => [props.visible, props.selectedCount, props.actions.length] as const,
    () => {
      if (!props.visible || props.selectedCount <= 0) {
        bulkBarResizeObserver?.disconnect();
        bulkMoreOpen.value = false;
        return;
      }
      bulkVisiblePoolCount.value = Math.max(
        0,
        props.actions.length - props.pinnedCount
      );
      void nextTick(() => {
        const el = bulkActionsOuterRef.value;
        if (el && bulkBarResizeObserver) {
          bulkBarResizeObserver.disconnect();
          bulkBarResizeObserver.observe(el);
        }
        scheduleBulkBarSplit();
      });
    },
    { flush: 'post' }
  );
</script>

<template>
  <Teleport to="body">
    <Transition name="bulk-action-bar">
      <div
        v-if="visible && selectedCount > 0"
        class="pointer-events-none fixed bottom-4 left-0 right-0 z-[55]"
      >
        <div class="container pointer-events-auto">
          <div
            class="flex w-full min-w-0 flex-col gap-3 rounded-fifteen bg-space px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-3.5"
            role="region"
            :aria-label="ariaLabel"
          >
            <div
              class="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4"
            >
              <div class="flex items-center gap-2">
                <MyCheckbox
                  id="bulk-action-bar-select-all"
                  :label="''"
                  :empty-label="true"
                  :model-value="allSelected"
                  @update:model-value="emit('update:allSelected', $event)"
                />
                <button
                  type="button"
                  class="border-0 bg-transparent p-0 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  :disabled="loading || listLength === 0"
                  @click="handleSelectAllToggle"
                >
                  {{ selectAllLabel }}
                </button>
              </div>
              <span
                class="hidden h-4 w-px shrink-0 bg-white/25 sm:block"
                aria-hidden="true"
              />
              <p class="text-sm text-white/70">
                Выбрано:
                <span class="font-medium text-white">{{ selectedCount }}</span>
              </p>
            </div>

            <div
              ref="bulkActionsOuterRef"
              class="relative min-w-0 flex-1 sm:flex-initial"
            >
              <div
                ref="bulkMeasureRowRef"
                class="pointer-events-none absolute left-0 top-0 -z-10 flex w-full flex-nowrap gap-3 opacity-0"
                aria-hidden="true"
              >
                <button
                  v-for="a in actions"
                  :key="'bulk-measure-' + a.id"
                  type="button"
                  tabindex="-1"
                  data-bulk-measure-chip
                  :class="bulkBarChipClass"
                >
                  <svg-icon
                    :name="a.icon"
                    width="16"
                    height="16"
                    class="shrink-0"
                    :class="a.iconClass"
                  />
                  {{ a.label }}
                </button>
              </div>

              <div
                class="flex min-w-0 flex-nowrap items-center gap-3 overflow-visible"
              >
                <div
                  class="flex min-h-0 min-w-0 flex-1 flex-nowrap items-center gap-3 overflow-x-auto"
                >
                  <button
                    v-for="a in bulkBarPinnedActions"
                    :key="'bulk-pin-' + a.id"
                    type="button"
                    :class="[bulkBarChipClass, 'shrink-0']"
                    :disabled="loading"
                    @click="runBulkBarAction(a.id)"
                  >
                    <svg-icon
                      :name="a.icon"
                      width="16"
                      height="16"
                      class="shrink-0"
                      :class="a.iconClass"
                    />
                    {{ a.label }}
                  </button>
                  <button
                    v-for="a in bulkBarVisiblePoolActions"
                    :key="'bulk-pool-' + a.id"
                    type="button"
                    :class="[bulkBarChipClass, 'shrink-0']"
                    :disabled="loading"
                    @click="runBulkBarAction(a.id)"
                  >
                    <svg-icon
                      :name="a.icon"
                      width="16"
                      height="16"
                      class="shrink-0"
                      :class="a.iconClass"
                    />
                    {{ a.label }}
                  </button>
                </div>

                <div
                  v-if="bulkBarOverflowMenuActions.length"
                  class="relative shrink-0"
                >
                  <button
                    type="button"
                    :class="bulkBarChipClass"
                    :disabled="loading"
                    :aria-expanded="bulkMoreOpen"
                    aria-haspopup="true"
                    @click.stop="bulkMoreOpen = !bulkMoreOpen"
                  >
                    <svg-icon
                      name="dropdown-arrow"
                      width="14"
                      height="14"
                      class="shrink-0 text-white/80 transition-transform"
                      :class="{ 'rotate-180': bulkMoreOpen }"
                    />
                    Ещё
                  </button>
                  <div
                    v-show="bulkMoreOpen"
                    class="absolute bottom-full right-0 z-[70] mb-1.5 min-w-[260px] rounded-ten border border-white/15 bg-space py-1 shadow-[0_-4px_24px_rgba(0,0,0,0.25)]"
                    role="menu"
                    @click.stop
                  >
                    <button
                      v-for="a in bulkBarOverflowMenuActions"
                      :key="'bulk-more-' + a.id"
                      type="button"
                      role="menuitem"
                      class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-normal text-white/90 hover:bg-white/10 disabled:opacity-40"
                      :disabled="loading"
                      @click="runBulkBarAction(a.id)"
                    >
                      <svg-icon
                        :name="a.icon"
                        width="16"
                        height="16"
                        class="shrink-0"
                        :class="a.iconClass"
                      />
                      {{ a.label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .bulk-action-bar-enter-active,
  .bulk-action-bar-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }
  .bulk-action-bar-enter-from,
  .bulk-action-bar-leave-to {
    opacity: 0;
    transform: translateY(12px);
  }
</style>
