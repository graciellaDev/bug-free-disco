import { ref, watch, nextTick, onBeforeUnmount, type Ref } from 'vue';
import { getJoblyToastTopPx } from '@/utils/joblyToastAnchor';

/**
 * Вертикальная позиция фиксированного тоста: сразу под верхним меню.
 * Горизонталь — в шаблоне (обычно right-4 / sm:right-6).
 */
export function useJoblyToastTopStyle(isActive: Ref<boolean>) {
  const topStyle = ref<Record<string, string>>({});

  function updatePosition() {
    if (!isActive.value) return;
    topStyle.value = { top: `${getJoblyToastTopPx()}px` };
  }

  function bindListeners() {
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
  }

  function unbindListeners() {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, true);
  }

  watch(isActive, active => {
    if (active) {
      void nextTick().then(() => {
        updatePosition();
        requestAnimationFrame(() => {
          updatePosition();
          bindListeners();
        });
      });
    } else {
      unbindListeners();
    }
  });

  onBeforeUnmount(() => {
    unbindListeners();
  });

  return topStyle;
}
