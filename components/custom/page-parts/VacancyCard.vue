<template>
  <div>
    <div
      class="mb-px bg-white p-25px pb-15px"
      :class="!vacancy.footerData ? 'rounded-fifteen' : 'rounded-t-fifteen'"
    >
      <div class="mb-[27px] flex justify-between items-baseline gap-x-3">
        <div class="flex items-baseline gap-x-2 min-w-0 flex-1">
          <NuxtLink :to="`/vacancies/${vacancy.id}`" class="min-w-0">
            <h2 class="text-lg font-medium leading-normal text-space truncate">
              {{ vacancy.title }}
            </h2>
          </NuxtLink>
          <span v-if="titleMetaLine" class="text-13px font-normal text-bali-light shrink-0">{{ titleMetaLine }}</span>
        </div>
        <div class="shrink-0 flex items-center gap-x-15px">
          <UiButton v-if="vacancy.editButton" variant="orange" size="action">
            Продолжить редактирование
          </UiButton>
          <MyDropdown
            v-if="currentStatusDisplay != null"
            trigger-variant="semiaction"
            placeholder="Статус"
            :options="statusOptions"
            :model-value="currentStatusDisplay"
            @update:model-value="onStatusChange"
          />
          <DotsDropdown
            :items="props.dropdownItems"
            @select-item="handleDropdownSelect"
          />
        </div>
      </div>
      <div
        class="mb-15px w-full rounded-fifteen border border-athens px-1 py-4 leading-normal"
      >
        <div class="columns grid auto-cols-fr grid-flow-col">
          <span
            v-for="(column, index) in displayStages"
            :key="column.id ?? index"
            class="title-parent [&:not(:last-child)]:border-r [&:not(:last-child)]:border-athens"
          >
            <div class="title-wrapper">
              <div
                class="rounded-ten p-1 text-center cursor-pointer"
                role="button"
                tabindex="0"
                @click="goToStage(column)"
                @keydown.enter.prevent="goToStage(column)"
                @keydown.space.prevent="goToStage(column)"
              >
                <div class="mb-1 text-sm font-normal text-space">
                  {{ column.count !== undefined && column.count !== null ? column.count : '-' }}
                </div>
                <div
                  class="truncate text-13px font-normal text-slate-custom"
                  :title="column.name"
                >
                  {{ column.name }}
                </div>
              </div>
            </div>
          </span>
        </div>
      </div>
      <div v-if="vacancy.message" class="mt-[26px] flex">
        <svg-icon name="card-message" width="20" height="20" />
        <p class="ml-5px text-13px text-space">{{ vacancy.message }}</p>
      </div>
      <div v-if="vacancy.messageArchive" class="mt-[26px] flex">
        <svg-icon name="card-message-archive" width="20" height="20" />
        <p class="ml-5px text-13px text-space">
          Была отправлена в архив {{ vacancy.messageArchive.date }}
          {{ vacancy.messageArchive.position }}
          {{ vacancy.messageArchive.fullName }}
        </p>
      </div>
    </div>
    <div
      v-if="vacancy.footerData"
      class="footer flex justify-between rounded-b-fifteen bg-catskill px-25px py-15px"
    >
      <div class="flex gap-x-25px">
        <p
          class="text-13px font-normal text-bali-light"
          v-if="vacancy.footerData.sites != null"
        >
          Публикаций:
          {{ vacancy.footerData.sites }}
        </p>
        <p
          class="text-13px font-normal text-bali-light"
          v-if="vacancy.footerData.candidatesInWork"
        >
          Кандидатов в работе: {{ vacancy.footerData.candidatesInWork }}
        </p>
        <p
          class="text-13px font-normal text-bali-light"
          v-if="recruiterLabel"
        >
          {{ recruiterLabel }}{{ recruiterNamesText }}
        </p>
        <p
          class="text-13px font-normal text-bali-light"
          v-if="vacancy.footerData.applicationId"
        >
          Заявка: {{ vacancy.footerData.applicationId }}
        </p>
      </div>
      <p
        v-if="footerCandidatesLine"
        class="text-13px font-normal text-bali-light shrink-0"
      >
        {{ footerCandidatesLine }}
      </p>
    </div>

    <Popup
      :is-open="showDeletePopup"
      width="490px"
      :show-close-button="false"
      :lg-size="true"
      :parent-rounded="true"
      :content-rounded="false"
      :content-padding="false"
      @close="closeDeletePopup"
    >
      <div class="popup-delete-content flex flex-col gap-y-6">
        <h2 class="text-xl font-semibold text-space">Удаление вакансии «{{ vacancy?.title || vacancy?.name || 'Без названия' }}»</h2>
        <p class="text-sm text-slate-custom">История работы по кандидатам по этой вакансии будет удалена. Кандидаты, которые привязаны к этой вакансии, останутся в базе.</p>
        <p v-if="deleteErrorMessage" class="text-red-500 text-xs">{{ deleteErrorMessage }}</p>
        <div class="flex gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
            :disabled="isDeleting"
            @click="confirmDeleteVacancy"
          >
            {{ isDeleting ? 'Удаление...' : 'Удалить' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
            @click="closeDeletePopup"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>
  </div>
</template>

<script setup>
  import { ref, computed, defineProps, defineEmits } from 'vue';
  import DotsDropdown from '~/components/custom/DotsDropdown.vue';
  import MyDropdown from '~/components/custom/MyDropdown.vue';
  import Popup from '~/components/custom/Popup.vue';
  import { useRouter } from 'vue-router';
  import { deleteVacancy } from '~/utils/deleteVacancy';
  import { updateVacancy } from '~/utils/updateVacancy';
  import { getVacancy } from '~/utils/getVacancies';
  import { createVacancy } from '~/utils/createVacancy';

  const STATUS_OPTIONS = ['Открыта', 'Приостановлена', 'Закрыта', 'Архив'];
  const STATUS_TO_API = { 'Открыта': 'active', 'Приостановлена': 'draft', 'Закрыта': 'closed', 'Архив': 'archive' };
  const API_TO_STATUS = { active: 'Открыта', draft: 'Приостановлена', closed: 'Закрыта', archive: 'Архив' };

  const props = defineProps({
    vacancy: {
      type: Object,
      required: true,
    },
    dropdownItems: {
      type: Array,
      required: true,
    },
    /** Текущий статус вакансии в списке: 'active' | 'draft' | 'closed' | 'archive' */
    currentStatus: {
      type: String,
      default: 'active',
    },
    class: String,
  });

  const statusOptions = STATUS_OPTIONS;
  const currentStatusDisplay = computed(() => API_TO_STATUS[props.currentStatus] ?? 'Открыта');

  const MAX_RECRUITER_NAMES_LENGTH = 50;

  function goToStage(column) {
    const id = props.vacancy?.id;
    if (id == null) return;
    const stageId = column?.id;
    const url = stageId != null ? `/vacancies/${id}?stage=${stageId}` : `/vacancies/${id}`;
    router.push(url);
  }

  /** Этапы с счётчиками: приоритет у footerData.stages (гарантированно приходит с бэкенда) */
  const displayStages = computed(() => {
    const fd = props.vacancy?.footerData;
    if (fd && Array.isArray(fd.stages) && fd.stages.length) return fd.stages;
    return Array.isArray(props.vacancy?.stages) ? props.vacancy.stages : [];
  });

  const titleMetaLine = computed(() => {
    const id = props.vacancy?.id;
    const city = props.vacancy?.city;
    const idStr = id != null ? `${id} ID` : '';
    const cityStr = city ? String(city).trim() : '';
    if (idStr && cityStr) return `${idStr} · ${cityStr}`;
    return idStr || cityStr || '';
  });

  const footerCandidatesLine = computed(() => {
    const fd = props.vacancy?.footerData;
    if (!fd || fd.candidatesTotal == null || Number(fd.candidatesTotal) < 1) return '';
    const total = Number(fd.candidatesTotal);
    const active = fd.candidatesActive != null ? Number(fd.candidatesActive) : total;
    const lastAt = fd.lastCandidateAt ? String(fd.lastCandidateAt) : '';
    const parts = [`Кандидатов: ${total}`, `Активно в воронке: ${active}`];
    if (lastAt) parts.push(`Последний кандидат: ${lastAt}`);
    return parts.join(' · ');
  });

  const recruiterNames = computed(() => {
    const fd = props.vacancy?.footerData;
    if (!fd) return [];
    if (Array.isArray(fd.recruiters) && fd.recruiters.length) {
      return fd.recruiters.map((r) => (r && typeof r === 'object' ? r.name : r)).filter(Boolean);
    }
    const r = fd.responsible;
    if (r && typeof r === 'object' && r.name) return [r.name];
    if (r === 'Не назначен' || !r) return [];
    return [String(r)];
  });

  const recruiterLabel = computed(() => {
    const names = recruiterNames.value;
    if (names.length > 1) return 'Рекрутеры: ';
    return 'Рекрутер: ';
  });

  const recruiterNamesText = computed(() => {
    const names = recruiterNames.value;
    if (!names.length) return 'Не назначен';
    const str = names.join(', ');
    return str.length > MAX_RECRUITER_NAMES_LENGTH ? str.slice(0, MAX_RECRUITER_NAMES_LENGTH) + '...' : str;
  });

  function closeDeletePopup() {
    showDeletePopup.value = false;
    deleteErrorMessage.value = '';
  }

  async function confirmDeleteVacancy() {
    if (isDeleting.value || !props.vacancy?.id) return;
    deleteErrorMessage.value = '';
    isDeleting.value = true;
    try {
      const { data, error } = await deleteVacancy(props.vacancy.id);
      if (error) {
        deleteErrorMessage.value = error.data?.message || error.message || 'Не удалось удалить вакансию';
        return;
      }
      closeDeletePopup();
      emit('vacancy-deleted', props.vacancy.id);
    } catch (err) {
      deleteErrorMessage.value = err?.message || 'Ошибка при удалении';
    } finally {
      isDeleting.value = false;
    }
  }

  const emit = defineEmits(['vacancy-deleted', 'vacancy-archived', 'vacancy-status-changed', 'vacancy-copied']);
  const router = useRouter();
  const statusChanging = ref(false);
  const copying = ref(false);
  const showDeletePopup = ref(false);
  const deleteErrorMessage = ref('');
  const isDeleting = ref(false);

  function dateToDmY(val) {
    if (!val) return null;
    const s = String(val);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
    return s;
  }

  async function duplicateVacancy() {
    if (copying.value || !props.vacancy?.id) return;
    copying.value = true;
    try {
      const data = await getVacancy(String(props.vacancy.id));
      if (!data || !data.name || !data.description) {
        alert('Не удалось загрузить вакансию для копирования');
        return;
      }
      const place = data.place ?? data.place_ids;
      const placeIds = Array.isArray(place) ? place.map((p) => (typeof p === 'object' ? p?.id ?? p : p)) : (place != null ? [place] : []);
      const payload = {
        name: (data.name || 'Вакансия') + ' (копия)',
        description: data.description || '',
        status: 'draft',
        dateEnd: dateToDmY(data.dateEnd),
        code: data.code ?? '',
        specializations: data.specializations ?? '',
        industry: data.industry ?? '',
        employment: data.employment ?? '',
        schedule: data.schedule ?? '',
        work_hours_per_day: data.work_hours_per_day ?? '',
        has_evening_night_shifts: data.has_evening_night_shifts ?? false,
        experience: data.experience ?? '',
        education: data.education ?? '',
        salary_type: data.salary_type ?? '',
        salary_from: data.salary_from ?? '',
        salary_to: data.salary_to ?? '',
        currency: data.currency ?? '',
        salary_frequency: data.salary_frequency ?? '',
        salary_payment_frequency: data.salary_payment_frequency ?? '',
        place: placeIds.length ? placeIds : ['1'],
        location: data.location ?? '',
        work_address: data.work_address ?? '',
        oformlenie: Array.isArray(data.oformlenie) ? data.oformlenie : (data.oformlenie ? [data.oformlenie] : []),
        languages: data.languages ?? [],
        comment: data.comment ?? '',
        department: data.department ?? '',
        peoples: data.peoples ?? null,
        executor_name: data.executor_name ?? null,
        executor_phone: data.executor_phone ?? null,
        executor_email: data.executor_email ?? null,
        show_executor: data.show_executor ?? false,
      };
      const { data: result, error } = await createVacancy(payload);
      if (error) {
        const msg = error?.data?.message || error?.data?.error || 'Не удалось создать копию';
        alert(msg);
        return;
      }
      const newId = result?.data?.id ?? result?.id;
      if (newId) {
        emit('vacancy-copied', newId);
        router.push({ path: '/vacancies/newvacancy', query: { id: newId, type: 'edit' } });
      }
    } finally {
      copying.value = false;
    }
  }

  async function onStatusChange(displayValue) {
    const apiStatus = STATUS_TO_API[displayValue];
    if (!apiStatus || apiStatus === props.currentStatus) return;
    if (statusChanging.value) return;
    statusChanging.value = true;
    try {
      const { error } = await updateVacancy(props.vacancy.id, { status: apiStatus });
      if (error) {
        const msg = error?.data?.message || error?.data?.error || 'Не удалось изменить статус';
        alert(msg);
        return;
      }
      emit('vacancy-status-changed', props.vacancy.id, apiStatus);
    } finally {
      statusChanging.value = false;
    }
  }

  const handleDropdownSelect = async item => {
    if (item === 'Предпросмотр вакансии') {
      const companyId = props.vacancy.customer_id ?? props.vacancy.customerId;
      const path = `/public/vacancies/${props.vacancy.id}${companyId != null ? `?company=${companyId}` : ''}`;
      const url = typeof window !== 'undefined' ? new URL(path, window.location.origin).href : path;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item === 'Создать копию') {
      await duplicateVacancy();
      return;
    }
    if (item === 'Удалить вакансию') {
      showDeletePopup.value = true;
      return;
    }
    if (item === 'Настроить воронку') {
      router.push({
        path: '/vacancies/newvacancy',
        query: { id: props.vacancy.id, type: 'edit', tab: 'funnel' },
      });
      return;
    }
    if (item === 'Редактировать') {
      router.push({
        path: '/vacancies/newvacancy',
        query: { id: props.vacancy.id, type: 'edit' },
      });
      return;
    }
    if (item === 'Разархивировать' || item === 'Открыть снова') {
      onStatusChange('Открыта');
      return;
    }
    if (item === 'В архив') {
      onStatusChange('Архив');
      return;
    }
  };
</script>

<style scoped>
  /* .title-parent {
    transition-property: background-color;
    transition-duration: .3s;
    transition-timing-function: ease-in-out;
} */

  .title-parent:first-of-type .title-wrapper {
    padding-right: 10px;
  }

  .title-parent:not(:first-of-type) .title-wrapper {
    padding: 0 10px;
  }

  .title-parent:last-of-type .title-wrapper {
    padding-left: 10px;
    padding-right: 0;
  }
</style>
