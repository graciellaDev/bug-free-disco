<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import UiDotsLoader from '~/components/custom/UiDotsLoader.vue';
  import Pagination from '@/components/custom/Pagination.vue';
  import type { Candidate } from '@/types/candidates';
  import type { DataListMode } from '@/types/data-list';
  import type { TPagination } from '@/types/general';

  interface Props {
    items?: any[];
    loading?: boolean;
    mode?: DataListMode;
    pagination?: TPagination;
    emptyText?: string;
    containerClass?: string;
    showPagination?: boolean;
    autoLoader?: boolean;
    loadMoreThreshold?: number;
  }

  const props: Props = defineProps<{
    items: Candidate[];
    mode: DataListMode;
    pagination: TPagination;
    emptyText: string;
    containerClass: string;
    showPagination: boolean;
    autoLoader: boolean;
    loadMoreThreshold: number;
  }>();

  const emit = defineEmits<{
    'page-changed': [page: number];
    'load-more': [];
    'item-click': [item: any, index: number];
  }>();

  let observer: IntersectionObserver | null = null;
  const loadMoreTrigger = ref<HTMLElement | null>(null);

  const setupInfiniteScroll = () => {
    if (props.mode === 'infinite' || !props.autoLoader) return;

    observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting && !props.loading && props.pagination) {
          if (props.pagination.current_page < props.pagination.last_page)
            emit('load-more');
        }
      },
      {
        rootMargin: `${props.loadMoreThreshold || 100}px`,
      }
    );
  };

  const getItemKey = (item: any, index: number): string | number => {
    if (item && typeof item === 'object' && 'id' in item) {
      return item.id;
    }
    return index;
  };

  const hasMore = computed(() => {
    if (!props.pagination || props.mode === 'infinite') return false;
    return props.pagination.current_page < props.pagination.last_page;
  });

  const shouldShowPagination = computed(() => {
    return (
      props.showPagination !== false &&
      props.mode === 'pagination' &&
      props.pagination &&
      props.pagination.last_page > 1
    );
  });

  const handlerPageChange = (page: number) => {
    emit('page-changed', page);
  };

  onMounted(() => {
    if (props.mode === 'infinite' && props.autoLoader) {
      nextTick(() => {
        setupInfiniteScroll();
      });
    }
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  watch(
    () => props.items,
    () => {
      if (props.mode === 'infinite' && props.autoLoader) {
        nextTick(() => {
          setupInfiniteScroll();
        });
      }
    },
    {
      deep: true,
    }
  );
</script>

<template>
  <div>
    <slot name="header" />

    <div v-if="loading" class="loading-container">
      <slot name="loading">
        <UiDotsLoader />
      </slot>
    </div>
    <div v-else-if="items && items.length > 0" class="list-container">
      <slot
        v-for="(item, index) in items"
        :key="getItemKey(item, index)"
        :item="item"
        :index="index"
      />
    </div>
    <div v-else class="empty-container">
      <slot name="empty">
        <p>{{ emptyText || 'Данные не найдены' }}</p>
      </slot>
    </div>

    <Pagination
      v-if="
        showPagination &&
        mode === 'pagination' &&
        pagination &&
        pagination.last_page > 1
      "
      :current_page="pagination.current_page"
      :last-page="pagination.last_page"
      @page-changed="handlerPageChange"
    />

    <div
      v-if="mode === 'infinite' && loading && items && items.length > 0"
      class="infinite-loading"
    >
      <slot name="loading-moew">
        <UiDotsLoader />
      </slot>
    </div>
    <div
      v-if="mode === 'infinite' && autoLoader"
      ref="loadMoreTrigger"
      class="infinite-trigger"
      style="height: 1px"
    />
  </div>
</template>
