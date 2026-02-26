<template>
  <div>
    <status-vacancy
      @update:currentTab="switchTab"
      @save-and-continue="onSaveAndContinue"
      :active-tab="currentTab"
      :name="vacancyName"
      :publications-count="publicationsCount"
      v-model="headerStatus"
    />
    <Suspense @pending="onPending" @resolve="onResolve" @fallback="onFallback">
      <template #default>
        <KeepAlive>
          <component
            :is="currentTabComponent"
            :key="`${currentTab}-${vacancyId ?? 'new'}`"
            :id="vacancyId"
            :application="application"
            :type="typeSave"
            @go-to-publish="switchTab('publish')"
          />
        </KeepAlive>
      </template>
      <template #fallback>
        <UiLoader v-if="showLoader" />
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
  import { ref, defineAsyncComponent, computed, provide, watch } from 'vue';
  import { useNuxtApp } from '#app';
  import UiLoader from '~/components/UiLoader.vue';
  import { useRoute, useRouter } from 'vue-router';
  import { loadScript } from '@/plugins/loader';
  import { getVacancy } from '@/utils/getVacancies';
  import { API_YANDEX_KEY, API_YANDEX_SUGGEST } from '@/src/constants';

  const { $loader } = useNuxtApp();

  const route = useRoute();
  const router = useRouter();

  // id из пути, query (?id= или ?_vid= после создания) — _vid даёт id до обновления URL
  const vacancyId = ref<string | number | null>(
    route.params.id ? String(route.params.id) : (route.query.id ? String(route.query.id) : (route.query._vid ? String(route.query._vid) : null))
  );
  const vacancyName = ref('Новая вакансия');
  const application = ref(
    route.query.application ? route.query.application : null
  );

  const typeSave = ref(route.query.type ? route.query.type : (vacancyId.value ? 'edit' : 'create'));
  const headerStatus = ref('В работе');
  provide('headerVacancyStatus', headerStatus);

  async function loadVacancyName() {
    if (!vacancyId.value) return;
    try {
      const currectVacancy = await getVacancy(String(vacancyId.value));
      vacancyName.value = 'Редактирование вакансии';
      if (currectVacancy?.name) vacancyName.value += `: ${currectVacancy.name}`;
    } catch {
      vacancyName.value = 'Редактирование вакансии';
    }
  }

  watch(() => route.params.id, (id) => {
    const nextId = id ? String(id) : (route.query.id ? String(route.query.id) : (route.query._vid ? String(route.query._vid) : null));
    vacancyId.value = nextId;
    typeSave.value = nextId ? 'edit' : 'create';
    loadVacancyName();
  }, { immediate: true });

  if (vacancyId.value) {
    await loadVacancyName();
  }

  useSeoMeta({
    title: vacancyId.value ? 'Редактирование вакансии — Jobly' : 'Создание вакансии — Jobly',
    ogTitle: vacancyId.value ? 'Редактирование вакансии в Jobly' : 'Создание вакансии в Jobly',
    description:
      'Создайте новую вакансию в вашей CRM-системе Jobly.  Удобный интерфейс для быстрого и эффективного размещения вакансий.',
    ogDescription:
      'Создайте и управляйте вакансиями с помощью удобной CRM-системы Jobly.',
    twitterCard: 'summary',
  });

  type TabKey = 'info' | 'search' | 'publish' | 'team' | 'funnel';
  const TAB_ORDER: TabKey[] = ['info', 'publish', 'team', 'funnel'];

  // Компоненты вкладок задаём один раз — иначе при каждом computed создаётся новый defineAsyncComponent и контент не переключается
  const TabComponents: Record<TabKey, ReturnType<typeof defineAsyncComponent>> = {
    info: defineAsyncComponent(() => import('@/pages/create-tabs/InfoTab.vue')),
    search: defineAsyncComponent(() => import('@/pages/create-tabs/SearchTab.vue')),
    publish: defineAsyncComponent(() => import('@/pages/create-tabs/PublishTab.vue')),
    team: defineAsyncComponent(() => import('@/pages/create-tabs/TeamTab.vue')),
    funnel: defineAsyncComponent(() => import('@/pages/create-tabs/FunnelTab.vue')),
  };

  const currentTab = ref<TabKey>('info');

  watch(() => route.query.tab, (tab) => {
    if (tab && TAB_ORDER.includes(tab as TabKey)) {
      currentTab.value = tab as TabKey;
    }
  }, { immediate: true });
  const publicationsCount = ref(0);
  provide('setPublicationsCount', (n: number) => { publicationsCount.value = n; });
  const showLoader = ref(false);
  const saveAndContinueHandler = ref<((opt?: { goToPublish?: boolean }) => Promise<{ id?: number } | void>) | null>(null);
  provide('saveAndContinueHandler', saveAndContinueHandler);
  /** Общее сохранение вакансии (create/update) — выставляется InfoTab; при нажатии «Сохранить и продолжить» на других вкладках вызываем его, чтобы вакансия сохранялась. */
  const mainSaveHandler = ref<(() => Promise<{ id?: number } | void>) | null>(null);
  provide('mainSaveHandler', mainSaveHandler);
  provide('vacancyIdRef', vacancyId);
  let loaderTimeout: NodeJS.Timeout | null = null;

  const currentTabComponent = computed(() => TabComponents[currentTab.value]);

  function switchTab(tabName: TabKey) {
    currentTab.value = tabName;
  }

  async function onSaveAndContinue() {
    const handler = saveAndContinueHandler.value;
    if (!handler) return;
    try {
      // На вкладке «Описание» handler уже делает сохранение; на остальных вкладках вызываем общее сохранение (InfoTab), чтобы вакансия сохранялась при нажатии кнопки с любой вкладки.
      let result: { id?: number } | void;
      if (currentTab.value === 'info') {
        result = await handler();
      } else {
        const mainSave = mainSaveHandler.value;
        result = mainSave ? await mainSave() : await handler();
      }
      const createdId = result && typeof result === 'object' && 'id' in result ? result.id : undefined;

      if (createdId != null && !vacancyId.value) {
        vacancyId.value = createdId;
        typeSave.value = 'edit';
        const idx = TAB_ORDER.indexOf(currentTab.value);
        const nextTab = idx >= 0 && idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;
        const query: Record<string, string> = { _vid: String(createdId), ...(route.query as Record<string, string>) };
        if (route.query.application) query.application = String(route.query.application);
        if (nextTab) query.tab = nextTab;
        await router.replace({
          path: `/vacancies/newvacancy/${createdId}`,
          query,
        });
        return;
      }

      const idx = TAB_ORDER.indexOf(currentTab.value);
      if (idx === TAB_ORDER.length - 1) {
        await navigateTo('/vacancies');
      } else if (idx >= 0 && idx < TAB_ORDER.length - 1) {
        switchTab(TAB_ORDER[idx + 1]);
      }
    } catch (_) {
      // Ошибка сохранения — остаёмся на вкладке
    }
  }

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
