import { ref, watch, nextTick, computed, type ComputedRef } from 'vue';
import { disableBodyScroll, enableBodyScroll } from '@/utils/bodyScoll';

/**
 * Composable для управления несколькими попапами на странице
 *
 * @example
 * ```ts
 * const { isOpen, open, close } = usePopup('addCandidate')
 * const { isOpen: isEditOpen, open: openEdit, close: closeEdit } = usePopup('editCandidate')
 * ```
 */
export function usePopup(
  popupId: string,
  options?: {
    manageBodyScroll?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
  }
) {
  const isOpenRef = ref(false);
  const { manageBodyScroll = true, onOpen, onClose } = options || {};

  const isOpen = computed(() => isOpenRef.value);
  // const isOpen = computed({
  //   get: () => isOpenRef.value,
  //   set: (value: boolean) => {
  //     isOpenRef.value = value;
  //   },
  // });

  const open = () => {
    isOpenRef.value = true;
    if (manageBodyScroll) {
      disableBodyScroll();
    }
    onOpen?.();
  };

  const close = () => {
    isOpenRef.value = false;
    if (manageBodyScroll) {
      nextTick(() => {
        enableBodyScroll();
      });
    }
    onClose?.();
  };

  const toggle = () => {
    if (isOpenRef.value) {
      close();
    } else {
      open();
    }
  };

  // Автоматическое управление скроллом при изменении состояния
  watch(
    isOpenRef,
    newValue => {
      if (!manageBodyScroll) return;

      if (newValue) {
        disableBodyScroll();
      } else {
        nextTick(() => {
          enableBodyScroll();
        });
      }
    },
    { immediate: false }
  );

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Composable для управления несколькими попапами через объект
 *
 * @example
 * ```ts
 * const popups = usePopups({
 *   addCandidate: { manageBodyScroll: true },
 *   editCandidate: { manageBodyScroll: true },
 *   deleteConfirm: { manageBodyScroll: false }
 * })
 *
 * // Использование:
 * popups.addCandidate.open()
 * popups.editCandidate.close()
 * ```
 */
export function usePopups<T extends Record<string, any>>(
  config: Record<
    keyof T,
    | { manageBodyScroll?: boolean; onOpen?: () => void; onClose?: () => void }
    | undefined
  >
) {
  const popups = {} as Record<
    keyof T,
    {
      isOpen: ComputedRef<boolean>;
      open: () => void;
      close: () => void;
      toggle: () => void;
    }
  >;

  for (const [key, options] of Object.entries(config)) {
    popups[key as keyof T] = usePopup(key, options) as any;
  }

  return popups;
}
