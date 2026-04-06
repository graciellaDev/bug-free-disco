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
      /** true = без затемнённого фона (прозрачный оверлей, без серого) */
      noBackdrop?: boolean;
      /** true = без внешнего padding у контейнера окна (отступы только внутри слота) */
      noOuterPadding?: boolean;
      /**
       * true = не резервировать место справа под скролл (pr-[15px] у контента).
       * Плюс полоса прокрутки у правого края белой карточки: внешний padding только слева/сверху/снизу,
       * справа 0; от контента до края — внутренний pr на обёртке слота.
       */
      noScrollbarGutter?: boolean;
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
      noBackdrop: false,
      noOuterPadding: false,
      noScrollbarGutter: false,
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
    if (props.noScrollbarGutter) {
      customStyles.value = {};
      return;
    }
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

  /** Сколько модалок сейчас открыто — чтобы при вложенных попапах вернуть scroll только когда все закрыты */
  let bodyScrollLockCount = 0;

  function lockDocumentScroll() {
    bodyScrollLockCount += 1;
    if (bodyScrollLockCount === 1) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
  }

  function unlockDocumentScroll() {
    if (bodyScrollLockCount < 1) return;
    bodyScrollLockCount -= 1;
    if (bodyScrollLockCount === 0) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }

  watch(
    isOpenValue,
    open => {
      if (open) lockDocumentScroll();
      else unlockDocumentScroll();
    },
    { immediate: true }
  );

  onMounted(() => {
    checkScrollbar();
    window.addEventListener('resize', checkScrollbar);
  });

  onBeforeUnmount(() => {
    if (isOpenValue.value) unlockDocumentScroll();
    window.removeEventListener('resize', checkScrollbar);
  });
</script>

<template>
  <div
    v-if="isOpenValue"
    class="fixed inset-0 z-50 flex items-center justify-center overscroll-none"
    @click.self="closePopup"
    :class="[
      props.noBackdrop ? 'bg-transparent' : 'bg-black bg-opacity-50',
      isOpenValue ? 'opacity-100' : 'opacity-0',
      overflowContainer
        ? 'overflow-y-auto'
        : overflowVisible || allowDropdownOverflow
          ? 'overflow-visible'
          : 'overflow-hidden',
      parentRounded ? 'rounded-fifteen' : 'rounded-none',
    ]"
  >
    <div
      @click.self="closePopup"
      class="absolute w-full rounded-fifteen bg-white"
      :class="[
        props.noOuterPadding
          ? 'p-0'
          : noScrollbarGutter
            ? 'pl-25px pt-25px pb-25px pr-0'
            : 'p-25px',
        props.allowDropdownOverflow || props.disableOverflowHidden
          ? 'overflow-visible'
          : 'overflow-hidden',
      ]"
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
          { 'pr-2.5': hasScrollbar && !noScrollbarGutter },
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
          class="h-full overflow-y-auto"
          :class="[
            noScrollbarGutter ? 'pr-0' : 'pr-[15px]',
            {
              'overflow-y-auto': !allowDropdownOverflow,
              'overflow-visible': allowDropdownOverflow,
            },
          ]"
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
          <template v-if="noScrollbarGutter">
            <!-- Отступ справа у контента задаётся внутри слота у overflow-контейнера, иначе полоса оказывается левее края -->
            <div
              class="min-h-0 w-full max-w-full"
              :style="
                disableOverflowHidden
                  ? { maxHeight: maxHeightValue }
                  : undefined
              "
            >
              <slot />
            </div>
          </template>
          <slot v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  ::-webkit-scrollbar-thumb {
    border: none;
    background-color: #79869a;
    border-radius: 5px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: #5a6a7f;
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }
</style>
