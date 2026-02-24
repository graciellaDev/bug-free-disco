<script setup lang="ts">
  import {
    ref,
    onMounted,
    onBeforeUnmount,
    watch,
    computed,
    unref,
    type MaybeRef,
  } from 'vue';
  import UiDotsLoader from '~/components/custom/UiDotsLoader.vue';

  const props = withDefaults(
    defineProps<{
      isOpen: MaybeRef<boolean>;
      showCloseButton?: boolean;
      width?: string;
      height?: string;
      disableOverflowHidden?: boolean;
      overflowContainer?: boolean;
      overflowVisible?: boolean;
      topActive?: boolean;
      maxHeight?: boolean;
      maxHeightValue?: string;
      allowDropdownOverflow?: boolean;
      adaptiveHeight?: boolean;
      lgSize?: boolean;
      parentRounded?: boolean;
      /** false = у блока с контентом внутри окна не будет скруглений (само окно не меняется) */
      contentRounded?: boolean;
      /** false = один слой отступа 25px (внутренняя обёртка без padding), иначе два слоя по 25px */
      contentPadding?: boolean;
    }>(),
    {
      showCloseButton: false,
      width: 'fit-content',
      height: 'auto',
      disableOverflowHidden: false,
      overflowContainer: false,
      overflowVisible: false,
      topActive: false,
      maxHeight: false,
      maxHeightValue: '80vh',
      allowDropdownOverflow: false,
      adaptiveHeight: false,
      lgSize: false,
      parentRounded: false,
      contentRounded: true,
      contentPadding: true,
    }
  );

  const emit = defineEmits<{
    close: [];
  }>();

  const scrollContainer = ref<HTMLElement | null>(null);
  const hasScrollbar = ref<boolean>(false);
  const customStyles = ref<Record<string, string>>({});

  const isOpenValue = computed(() => unref(props.isOpen));

  const closePopup = () => {
    emit('close');
  };

  const checkScrollbar = () => {
    if (scrollContainer.value) {
      hasScrollbar.value =
        scrollContainer.value.scrollHeight > scrollContainer.value.clientHeight;
      updateStyles();
    }
  };

  const updateStyles = () => {
    if (hasScrollbar.value) {
      customStyles.value = { paddingRight: '15px' };
    } else {
      customStyles.value = {};
    }
  };

  watch(
    isOpenValue,
    newVal => {
      if (newVal) checkScrollbar();
    },
    { immediate: false }
  );

  watch(
    () => scrollContainer.value?.scrollHeight,
    () => {
      checkScrollbar();
    }
  );

  onMounted(() => {
    checkScrollbar();
    window.addEventListener('resize', checkScrollbar);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkScrollbar);
  });
</script>

<template>
  <div
    v-if="isOpenValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="closePopup"
    :class="[
      isOpenValue ? 'opacity-100' : 'opacity-0',
      overflowContainer
        ? 'overflow-y-auto'
        : overflowVisible
          ? 'overflow-visible'
          : 'overflow-hidden',
      parentRounded ? 'rounded-fifteen' : 'rounded-none',
    ]"
  >
    <div
      @click.self="closePopup"
      class="absolute w-full rounded-fifteen bg-white p-25px"
      :style="{
        maxWidth: width,
        top: lgSize ? '10%' : 'auto',
      }"
    >
      <div
        class="relative h-full w-full transform bg-white"
        :class="[
          contentRounded ? 'rounded-fifteen' : 'rounded-none',
          contentPadding ? 'p-25px' : 'p-0',
          { 'pr-2.5': customStyles },
        ]"
        :style="{
          maxWidth: width,
          height: height === 'auto' ? 'auto' : lgSize ? 'auto' : height,
          overflow: allowDropdownOverflow
            ? 'visible'
            : disableOverflowHidden
              ? 'visible'
              : 'hidden',
          top: topActive ? '-10%' : 'auto',
          maxHeight: maxHeight ? 'none' : maxHeightValue,
        }"
      >
        <div
          ref="scrollContainer"
          class="h-full overflow-y-auto pr-[15px]"
          :class="{
            'overflow-y-auto': !allowDropdownOverflow,
            'overtlow-visible': allowDropdownOverflow,
          }"
          :style="{
            ...customStyles,
            maxHeight: height === 'auto' ? '100%' : height,
            overflow: allowDropdownOverflow
              ? 'visible'
              : disableOverflowHidden
                ? 'visible'
                : 'auto',
          }"
        >
          <button
            v-if="showCloseButton && !hasScrollbar"
            @click="closePopup"
            class="absolute right-25px top-25px text-gray-500 hover:text-black"
          >
            ✖
          </button>
          <Suspense>
            <template #fallback>
              <UiDotsLoader />
            </template>
            <slot></slot>
          </Suspense>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  ::-webkit-scrollbar {
    width: 10px;
    margin-right: 10px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #79869a;
    border-radius: 5px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: #5a6a7f;
  }
</style>
