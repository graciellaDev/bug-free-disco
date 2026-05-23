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
      /** Дополнительные Tailwind-классы для белой панели (например отступ сверху) */
      panelExtraClass?: string;
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
      panelExtraClass: '',
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

  const resolvedMaxHeight = computed(() => {
    if (props.maxHeight) return 'none';
    if (props.maxHeightValue !== '80vh') return props.maxHeightValue;
    return props.lgSize ? 'calc(90vh - 3.125rem)' : props.maxHeightValue;
  });

  watch(isOpenValue, newVal => {
    if (newVal) {
      requestAnimationFrame(() => checkScrollbar());
    }
  });

  watch(
    () => scrollContainer.value?.scrollHeight,
    () => {
      checkScrollbar();
    }
  );

  /** Сколько модалок сейчас открыто — чтобы при вложенных попапах вернуть scroll только когда все закрыты */
  let bodyScrollLockCount = 0;
  let scrollbarGutterPx = 0;

  function applyScrollbarGutter() {
    scrollbarGutterPx = Math.max(
      0,
      window.innerWidth - document.documentElement.clientWidth
    );
    if (scrollbarGutterPx <= 0) return;
    document.body.style.paddingRight = `${scrollbarGutterPx}px`;
    document.querySelectorAll('[data-jobly-top-chrome]').forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.paddingRight = `${scrollbarGutterPx}px`;
      }
    });
  }

  function clearScrollbarGutter() {
    document.body.style.paddingRight = '';
    document.querySelectorAll('[data-jobly-top-chrome]').forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.paddingRight = '';
      }
    });
    scrollbarGutterPx = 0;
  }

  function lockDocumentScroll() {
    bodyScrollLockCount += 1;
    if (bodyScrollLockCount === 1) {
      applyScrollbarGutter();
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
      clearScrollbarGutter();
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
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="isOpenValue"
      class="fixed inset-0 z-[200] flex min-h-[100dvh] justify-center overscroll-none"
      @click.self="closePopup"
      :class="[
        props.noBackdrop ? 'bg-transparent' : 'bg-black bg-opacity-50',
        isOpenValue ? 'opacity-100' : 'opacity-0',
        lgSize ? 'items-start pt-[10vh]' : 'items-center',
        overflowContainer
          ? 'overflow-y-auto'
          : overflowVisible || allowDropdownOverflow
            ? 'overflow-visible'
            : 'overflow-hidden',
      ]"
    >
    <div
      @click.self="closePopup"
      class="relative mx-auto flex w-full min-h-0 flex-col rounded-fifteen bg-white"
      :class="[
        props.noOuterPadding
          ? 'p-0'
          : noScrollbarGutter
            ? 'pl-25px pt-25px pb-25px pr-0'
            : 'p-25px',
        props.allowDropdownOverflow ? 'overflow-visible' : 'overflow-hidden',
        props.panelExtraClass,
      ]"
      :style="{
        maxWidth: width,
        maxHeight: resolvedMaxHeight,
        height: height === 'auto' ? 'auto' : height,
      }"
    >
      <div
        class="relative flex min-h-0 w-full flex-1 flex-col bg-white"
        :class="[
          contentRounded ? 'rounded-fifteen' : 'rounded-none',
          contentPadding ? 'p-25px' : 'p-0',
          { 'pr-2.5': hasScrollbar && !noScrollbarGutter },
        ]"
        :style="{
          maxWidth: width,
          top: topActive ? '-10%' : 'auto',
          overflow: allowDropdownOverflow
            ? 'visible'
            : disableOverflowHidden
              ? 'visible'
              : 'hidden',
        }"
      >
        <div
          ref="scrollContainer"
          class="popup-scroll min-h-0 flex-1 overflow-y-auto bg-white"
          :class="[
            noScrollbarGutter ? 'pr-0' : 'pr-[15px]',
            {
              'overflow-y-auto': !allowDropdownOverflow && !disableOverflowHidden,
              'overflow-visible': allowDropdownOverflow || disableOverflowHidden,
            },
          ]"
          :style="{
            ...customStyles,
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
              class="min-h-0 w-full max-w-full bg-white"
              :style="
                disableOverflowHidden && !maxHeight
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
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
/* Скроллбар модалки — класс .popup-scroll в assets/css/main.scss */
</style>
