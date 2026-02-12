<template>
  <div>
    <status-vacancy @update:currentTab="switchTab" :name="vacancyName" />
    <Suspense @pending="onPending" @resolve="onResolve" @fallback="onFallback">
      <template #default>
        <component
          :is="currentTabComponent"
          :id="vacancyId"
          :application="application"
          :type="typeSave"
        />
      </template>
      <template #fallback>
        <UiLoader v-if="showLoader" />
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
  import { ref, defineAsyncComponent, computed } from 'vue';
  import { useNuxtApp } from '#app';
  import UiLoader from '~/components/UiLoader.vue';
  import { useRoute } from 'vue-router';
  import { loadScript } from '@/plugins/loader';
  import { getVacancy } from '@/utils/getVacancies';
  import { API_YANDEX_KEY, API_YANDEX_SUGGEST } from '@/src/constants';

  const { $loader } = useNuxtApp();

  const route = useRoute();
  const vacancyId = ref(route.query.id ? route.query.id : null);
  const vacancyName = ref('Новая вакансия');
  const application = ref(
    route.query.application ? route.query.application : null
  );

  const typeSave = ref(route.query.type ? route.query.type : 'create');
  if (vacancyId.value) {
    const currectVacancy = await getVacancy(String(vacancyId.value));
    vacancyName.value = 'Редактирование вакансии';
    if (currectVacancy && currectVacancy.name)
      vacancyName.value += `: ${currectVacancy.name}`;
  }

  useSeoMeta({
    title: 'Создание вакансии — Jobly',
    ogTitle: 'Создание вакансии в Jobly',
    description:
      'Создайте новую вакансию в вашей CRM-системе Jobly.  Удобный интерфейс для быстрого и эффективного размещения вакансий.',
    ogDescription:
      'Создайте и управляйте вакансиями с помощью удобной CRM-системы Jobly.',
    twitterCard: 'summary',
  });

  // Табы с lazy-loading
  const tabs: Record<string, () => Promise<any>> = {
    info: () => import('@/pages/create-tabs/InfoTab.vue'),
    search: () => import('@/pages/create-tabs/SearchTab.vue'),
    publish: () => import('@/pages/create-tabs/PublishTab.vue'),
    team: () => import('@/pages/create-tabs/TeamTab.vue'),
    funnel: () => import('@/pages/create-tabs/FunnelTab.vue'),
  };

  const currentTab = ref<keyof typeof tabs>('info');
  const showLoader = ref(false);
  let loaderTimeout: NodeJS.Timeout | null = null;

  // Динамическая загрузка компонента
  const currentTabComponent = computed(() =>
    defineAsyncComponent(tabs[currentTab.value])
  );

  function switchTab(tabName: keyof typeof tabs) {
    currentTab.value = tabName;
  }

  // Обработчики событий Suspense
  const onPending = () => {
    loaderTimeout = setTimeout(() => {
      showLoader.value = true;
      $loader.show();
    }, 300);
  };

  const onResolve = () => {
    if (loaderTimeout) {
      clearTimeout(loaderTimeout);
      loaderTimeout = null;
    }
    showLoader.value = false;
    $loader.hide();
  };

  const onFallback = () => {
    console.log('Suspense: Showing fallback');
  };

  onMounted(async () => {
    try {
      await loadScript(
        `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${API_YANDEX_KEY}&suggest_apikey=${API_YANDEX_SUGGEST}&results=10`
      );
    } catch (error) {
      console.error('Ошибка загрузки Yandex Maps:', error);
    }
  });
</script>
