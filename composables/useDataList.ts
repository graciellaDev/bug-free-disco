import { ref, watch, nextTick, isRef, type Ref } from 'vue';
import type { DataListConfig } from '@/types/data-list';
import type { TPagination } from '@/types/general';

export function useDataList<T>(config: DataListConfig<T>) {
  const items = ref<T[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const pagination = ref<TPagination | null>(null);

  const loadPage = async (page: number) => {
    if (loading.value) return;

    if (page < 1) {
      error.value = new Error('Номер страницы должен быть >=1');
      return;
    }

    try {
      loading.value = true;
      error.value = null;
      let params: Record<string, any> | undefined = undefined;

      params = config.fetchParams
        ? isRef(config.fetchParams)
          ? (config.fetchParams.value as Record<string, any>)
          : config.fetchParams
        : undefined;

      const response = await config.fetchFn(page, params);

      if (config.mode === 'infinite' && page > 1) {
        items.value = [...items.value, ...response.items] as T[];
      } else {
        items.value = response.items;
      }
      pagination.value = response.pagination;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      console.error('[useDataList] Ошибка загрузки страницы:', err);
    } finally {
      loading.value = false;
    }
  };

  const loadStartPage = async () => {
    const startPage = config.initialPage || 1;
    await loadPage(startPage);
  };

  const loadNext = async () => {
    if (config.mode !== 'infinite') {
      console.warn('[useDataList] loadNext работает только в режиме infinite');
      return false;
    }

    if (!pagination.value) {
      console.warn('[useDataList] Пагинация не инициализирована');
      return false;
    }

    if (pagination.value?.current_page >= pagination.value?.last_page) {
      return false;
    }

    if (loading.value) {
      return false;
    }

    const nextPage = pagination.value?.current_page + 1;
    await loadPage(nextPage);

    return true;
  };

  const reset = () => {
    items.value = [];
    pagination.value = null;
    error.value = null;
    loading.value = false;
  };

  const refresh = async () => {
    if (pagination.value) {
      await loadPage(pagination.value.current_page);
    } else {
      await loadStartPage();
    }
  };

  if (config.autoLoad !== false) {
    const startPage = config.initialPage || 1;
    nextTick(() => {
      loadPage(startPage);
    });
  }

  if (config.fetchParams && isRef(config.fetchParams)) {
    watch(
      config.fetchParams,
      () => {
        reset();
        loadStartPage();
      },
      { deep: true }
    );
  }

  return {
    items,
    loading,
    error,
    pagination,
    loadPage,
    loadNext,
    reset,
    refresh,
  };
}
