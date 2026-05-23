<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { getCandidateById, getCandidatesAllPages } from '@/src/api/candidates';
  import UiDotsLoader from '@/components/custom/UiDotsLoader.vue';
  import BlockCandidateInfo from '@/components/custom/page-parts/candidate/BlockCandidateInfo.vue';
  import BlockCandidateTabsInfo from '@/components/custom/page-parts/candidate/BlockCandidateTabsInfo.vue';
  import {
    readCandidateListNavigationContext,
    updateCandidateListNavigationIds,
  } from '@/utils/candidateListNavigation';

  import type { ApiResponseById, Candidate } from '@/types/candidates';
  import type { Stage } from '@/types/funnels';
  import { getFunnelStages } from '@/src/api/funnels';

  const route = useRoute();
  const router = useRouter();

  const candidate = ref<Candidate | null>(null);
  const candidateExtra = ref<ApiResponseById['candidateExtra'] | null>(null);
  const loading = ref(true);
  const stages = ref<Stage[] | []>([]);

  const navigationIds = ref<number[]>([]);
  const navigationLoading = ref(false);

  const currentIndex = computed(() => {
    const id = candidate.value?.id;
    if (id == null || navigationIds.value.length === 0) return 0;
    const idx = navigationIds.value.indexOf(id);
    return idx >= 0 ? idx : 0;
  });

  const totalCandidates = computed(() =>
    navigationIds.value.length > 0 ? navigationIds.value.length : 1
  );

  const canGoPrevious = computed(
    () => navigationIds.value.length > 0 && currentIndex.value > 0
  );

  const canGoNext = computed(
    () =>
      navigationIds.value.length > 0
      && currentIndex.value < navigationIds.value.length - 1
  );

  const getCandidateId = (): string => {
    const candidateId = Array.isArray(route.params.id)
      ? route.params.id[0]
      : route.params.id;

    if (!candidateId) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Не указан ID кандидата',
      });
    }
    return candidateId;
  };

  const loadCandidate = async (id: number) => {
    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Некорректный ID кандидата',
      });
    }

    loading.value = true;
    try {
      const result = await getCandidateById(id);
      candidate.value = result.candidateData;
      candidateExtra.value = result.candidateExtra;
    } catch (error: unknown) {
      console.error('[loadCandidate] Ошибка при загрузке кандидата:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  async function fetchNavigationIds(
    queryParams: Record<string, string | number>
  ): Promise<number[]> {
    const list = await getCandidatesAllPages(queryParams);
    return list.map(c => c.id).filter((id): id is number => id != null);
  }

  async function loadNavigationIds(candidateId: number) {
    const ctx = readCandidateListNavigationContext();
    if (!ctx?.queryParams) {
      navigationIds.value = [];
      return;
    }

    navigationLoading.value = true;
    try {
      let ids = ctx.ids?.length ? [...ctx.ids] : await fetchNavigationIds(ctx.queryParams);

      if (ids.length > 0 && !ids.includes(candidateId)) {
        ids = await fetchNavigationIds(ctx.queryParams);
        updateCandidateListNavigationIds(ids, ids.length);
      } else if (!ctx.ids?.length && ids.length > 0) {
        updateCandidateListNavigationIds(ids, ids.length);
      }

      navigationIds.value = ids;
    } catch (e) {
      console.error('[loadNavigationIds]', e);
      navigationIds.value = [];
    } finally {
      navigationLoading.value = false;
    }
  }

  const goToPrevious = () => {
    if (!canGoPrevious.value) return;
    const prevId = navigationIds.value[currentIndex.value - 1];
    if (prevId != null) router.push(`/candidates/${prevId}`);
  };

  const goToNext = () => {
    if (!canGoNext.value) return;
    const nextId = navigationIds.value[currentIndex.value + 1];
    if (nextId != null) router.push(`/candidates/${nextId}`);
  };

  const handleCandidateUpdated = async (updatedCandidate: Candidate) => {
    if (updatedCandidate?.id) {
      await loadCandidate(updatedCandidate.id);
    } else if (candidate.value?.id) {
      await loadCandidate(candidate.value.id);
    }
  };

  const logRefreshKey = ref(0);
  const refreshCandidateLog = () => {
    logRefreshKey.value++;
  };
  const tabsInfoRef = ref<InstanceType<typeof BlockCandidateTabsInfo> | null>(null);
  const candidateInfoRef = ref<InstanceType<typeof BlockCandidateInfo> | null>(null);

  const handleAddCommentFromHeader = () => {
    tabsInfoRef.value?.openCommentAndFocus?.();
    nextTick(() => {
      nextTick(() => {
        const el = tabsInfoRef.value?.eventFeedRef;
        const node = el?.value ?? el;
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  const handleAddTaskFromHeader = () => {
    tabsInfoRef.value?.openTaskAndFocus?.();
    nextTick(() => {
      nextTick(() => {
        const el = tabsInfoRef.value?.eventFeedRef;
        const node = el?.value ?? el;
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  const openEmailPopupFromFeed = () => {
    candidateInfoRef.value?.openEmailPopup?.();
  };

  const handleCandidateDeleted = () => {
    router.push('/candidates');
  };

  async function initPage() {
    const id = parseInt(getCandidateId(), 10);
    await Promise.all([
      loadCandidate(id),
      loadNavigationIds(id),
      getFunnelStages().then(s => {
        stages.value = s;
      }),
    ]);
  }

  watch(
    () => route.params.id,
    async newId => {
      const id = parseInt(Array.isArray(newId) ? newId[0] : String(newId ?? ''), 10);
      if (!id || isNaN(id)) return;
      await loadCandidate(id);
    }
  );

  onMounted(() => {
    void initPage();
  });
</script>

<template>
  <div class="container pt-25px pb-0">
    <div class="mb-25px flex items-center justify-between">
      <NuxtLink to="/candidates" class="text-blue-500 hover:underline">
        <div class="flex items-center justify-center gap-2.5">
          <svg-icon name="arrow-left-dodger" width="18" height="18" />
          <span class="text-sm font-medium text-dodger">
            Вернуться к списку
          </span>
        </div>
      </NuxtLink>
      <div class="flex items-center gap-2.5">
        <button
          class="rounded-ten bg-white p-2.5 text-slate-custom"
          :class="{ 'cursor-auto opacity-0': !canGoPrevious }"
          :disabled="!canGoPrevious || navigationLoading"
          @click="goToPrevious"
        >
          <svg-icon name="pagination-arrow-left" width="20" height="20" />
        </button>

        <div
          class="rounded-ten bg-white px-15px py-3 text-13px font-bold leading-normal text-space"
        >
          <template v-if="navigationLoading">
            …
          </template>
          <template v-else>
            <span>{{ currentIndex + 1 }}</span>
            из
            <span>{{ totalCandidates }}</span>
          </template>
        </div>

        <button
          class="rounded-ten bg-white p-2.5 text-slate-custom"
          :class="{ 'cursor-auto opacity-0': !canGoNext }"
          :disabled="!canGoNext || navigationLoading"
          @click="goToNext"
        >
          <svg-icon name="pagination-arrow-right" width="20" height="20" />
        </button>
      </div>
    </div>
    <div v-if="loading" class="absolute left-1/2 top-1/2">
      <UiDotsLoader />
    </div>
    <div
      v-else-if="candidate"
      class="grid w-full grid-rows-[auto_auto] gap-0"
    >
      <div class="min-h-0 overflow-auto">
        <BlockCandidateInfo
          ref="candidateInfoRef"
          :candidate="candidate"
          :isFunnel="false"
          :stages="stages"
          @candidate-updated="handleCandidateUpdated"
          @candidate-deleted="handleCandidateDeleted"
          @add-comment="handleAddCommentFromHeader"
          @add-task="handleAddTaskFromHeader"
          @email-sent="refreshCandidateLog"
          @candidate-activity-refresh="refreshCandidateLog"
        />
      </div>
      <div class="flex min-h-0 flex-col">
        <BlockCandidateTabsInfo
          ref="tabsInfoRef"
          :candidate="candidate"
          :log-refresh-trigger="logRefreshKey"
          @comment-added="refreshCandidateLog"
          @open-email-popup="openEmailPopupFromFeed"
          @candidate-updated="handleCandidateUpdated"
        />
      </div>
    </div>
  </div>
</template>
