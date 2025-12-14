<script setup lang="ts">
  import { ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { getCandidateById } from '@/src/api/candidates';
  import UiDotsLoader from '@/components/custom/UiDotsLoader.vue';
  import BlockCandidateInfo from '~/components/custom/page-parts/BlockCandidateInfo.vue';
  import BlockCandidateTabsInfo from '~/components/custom/page-parts/BlockCandidateTabsInfo.vue';

  import type { ApiResponseById, Candidate } from '@/types/candidates';
  // import type { SelectedLabel } from '@/types/ui-components';

  // get current route from candidateFull
  const route = useRoute();
  const router = useRouter();

  const candidate = ref<Candidate | null>(null);
  const candidateExtra = ref<ApiResponseById['candidateExtra'] | null>(null);
  const loading = ref(true);

  const selectedLabel = ref<string>('Подумать');

  // get current index from candidateFull
  // Тут currentIndex и totalCandidates НЕ МОЖЕМ корректно посчитать без списка всех кандидатов!
  // Можно временно использовать заглушки:
  const currentIndex = ref(0); // пока 0

  // get total candidates from candidateFull
  const totalCandidates = ref(1); // пока 1

  // if candidate not found, throw 404 error
  if (currentIndex.value === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Candidate not found',
    });
  }

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
      console.error('Ошибка при загрузке кандидата:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const candidateId = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id;
  if (!candidateId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Не указан ID кандидата',
    });
  }

  const goToPrevious = () => {
    if (candidate.value) {
      const prevId = candidate.value?.id - 1;
      if (prevId >= 0) router.push(`/candidates/${prevId}`);
    }
  };

  const goToNext = () => {
    if (candidate.value) {
      const nextId = candidate.value?.id + 1;
      if (nextId > 0) router.push(`/candidates/${nextId}`);
    }
  };

  const handleCandidateUpdated = async (updatedCandidate: Candidate) => {
    if (updatedCandidate?.id) {
      await loadCandidate(updatedCandidate.id);
    } else if (candidate.value?.id) {
      await loadCandidate(candidate.value.id);
    }
  };

  const handleCandidateDeleted = () => {
    router.push('/candidates');
  };

  onMounted(async () => {
    const candidateId = Array.isArray(route.params.id)
      ? route.params.id[0]
      : route.params.id;

    if (!candidateId) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Не указан ID кандидата',
      });
    }

    await loadCandidate(parseInt(candidateId));
  });
</script>

<template>
  <div class="container py-25px">
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
        <!-- Кнопка "Назад" -->
        <button
          class="rounded-ten bg-white p-2.5 text-slate-custom"
          :class="{ 'cursor-auto opacity-0': currentIndex === 0 }"
          :disabled="currentIndex === 0"
          @click="goToPrevious"
        >
          <svg-icon name="pagination-arrow-left" width="20" height="20" />
        </button>

        <!-- Индикатор текущей позиции -->
        <div
          class="rounded-ten bg-white px-15px py-3 text-13px font-bold leading-normal text-space"
        >
          <span>{{ currentIndex + 1 }}</span>
          из
          <span>{{ totalCandidates }}</span>
        </div>

        <!-- Кнопка "Вперёд" -->
        <button
          class="rounded-ten bg-white p-2.5 text-slate-custom"
          :class="{
            'cursor-auto opacity-0': currentIndex === totalCandidates - 1,
          }"
          :disabled="currentIndex === totalCandidates - 1"
          @click="goToNext"
        >
          <svg-icon name="pagination-arrow-right" width="20" height="20" />
        </button>
      </div>
    </div>
    <div v-if="loading" class="absolute left-1/2 top-1/2">
      <UiDotsLoader />
    </div>
    <div class="w-full" v-else-if="candidate">
      <BlockCandidateInfo
        :candidate="candidate"
        :isFunnel="false"
        @candidate-updated="handleCandidateUpdated"
        @candidate-deleted="handleCandidateDeleted"
      />
      <BlockCandidateTabsInfo :candidate="candidate" />
    </div>
  </div>
</template>
