<script setup lang="ts">
  import type { Candidate } from '@/types/candidates';
  import MyCheckbox from '@/components/custom/MyCheckbox.vue';
  import UiAvatar from '@/components/ui/avatar/Avatar.vue';
  import UiAvatarImage from '@/components/ui/avatar/AvatarImage.vue';
  import UiAvatarFallback from '@/components/ui/avatar/AvatarFallback.vue';
  import CardIcon from '@/components/custom/CardIcon.vue';
  import ListSectionPlaceholder from '@/components/custom/ListSectionPlaceholder.vue';
  import { getVacancyName } from '@/src/api/vacancies';
  import { getCandidateSourceLogoPath } from '@/utils/candidateSourceLogo';
  import { isExternalCandidatePhotoUrl } from '@/utils/candidatePhoto';

  interface Props {
    candidates: Candidate[];
    loading?: boolean;
    selected?: Record<number, boolean>;
    showCheckboxes?: boolean;
    containerClass?: string;
    allSelected?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
  }

  const props: Props = withDefaults(defineProps<Props>(), {
    loading: false,
    showCheckboxes: true,
    selected: () => ({}),
    allSelected: false,
  });

  const emit = defineEmits<{
    'item-click': [candidate: Candidate, index: number];
    'selection-change': [selected: Record<number, boolean>];
    'select-all': [isSelected: boolean];
  }>();

  const vacancyNames = ref<Record<number, string>>({});

  const loadVacancyNames = async () => {
    const uniqueVacancyIds = new Set<number>();

    // Собираем уникальные ID вакансий
    props.candidates.forEach(candidate => {
      if (candidate.vacancy_id) {
        uniqueVacancyIds.add(candidate.vacancy_id);
      }
    });

    // Загружаем названия для всех уникальных вакансий параллельно
    const promises = Array.from(uniqueVacancyIds).map(async vacancyId => {
      if (!vacancyNames.value[vacancyId]) {
        try {
          const name = await getVacancyName(vacancyId);
          vacancyNames.value[vacancyId] = name;
        } catch (error) {
          vacancyNames.value[vacancyId] = 'Неизвестная вакансия';
        }
      }
    });

    await Promise.all(promises);
  };

  const getFullName = (candidate: Candidate) => {
    const parts = [
      candidate.surname,
      candidate.firstname,
      candidate.patronymic,
    ].filter(Boolean);
    return parts.join(' ') || 'Без имени';
  };

  const getInitials = (candidate: Candidate) => {
    const surnameInitial = candidate.surname?.[0] || '';
    const firstnameInitial = candidate.firstname?.[0] || '';
    return `${surnameInitial}${firstnameInitial}`.toUpperCase();
  };

  const getVacancyNameForTable = (candidate: Candidate): string => {
    if (!candidate.vacancy_id) {
      return 'Не указана';
    }
    return vacancyNames.value[candidate.vacancy_id] || 'Загрузка...';
  };

  const getStageName = (candidate: Candidate) => {
    // TODO: сделать функцию определения этапа кандидата
    return 'Новый';
  };

  const getSourceLabel = (candidate: Candidate): string => {
    const s = candidate.source?.trim();
    return s || '—';
  };

  const getCandidatePhoneForTable = (candidate: Candidate): string => {
    const p = candidate.phone?.trim();
    return p || 'Не указано';
  };

  const getCandidateCityForTable = (candidate: Candidate): string => {
    const raw = candidate.location?.trim();
    if (!raw) return 'Не указано';

    // В некоторых источниках в location приходит "Город, адрес ...":
    // для таблицы оставляем только сам город.
    const firstChunk = raw.split(/[;,|·]/u)[0]?.trim() || raw;
    const cityOnly = firstChunk
      .replace(/^г\.\s*/iu, '')
      .replace(/^город\s+/iu, '')
      .trim();

    return cityOnly || 'Не указано';
  };

  const getCandidateCityForDisplay = (candidate: Candidate): string => {
    const city = getCandidateCityForTable(candidate);
    const chars = Array.from(city);
    if (chars.length <= 15) return city;
    return `${chars.slice(0, 15).join('')}...`;
  };

  const handlerItemClick = (candidate: Candidate, index: number) => {
    emit('item-click', candidate, index);
  };

  const handlerItemSelect = (id: number, isSelected: boolean) => {
    const newSelected = { ...props.selected };
    if (isSelected) {
      newSelected[id] = true;
    } else {
      delete newSelected[id];
    }
    emit('selection-change', newSelected);
  };

  const handlerSelectAll = (isSelected: boolean) => {
    emit('select-all', isSelected);
  };

  onMounted(() => {
    loadVacancyNames();
  });

  watch(
    () => props.candidates,
    () => {
      loadVacancyNames();
    },
    { deep: true }
  );
</script>

<template>
  <div class="relative rounded-fifteen bg-white" :class="containerClass">
    <ListSectionPlaceholder
      v-if="loading"
      variant="candidates"
      loading
    />

    <ListSectionPlaceholder
      v-else-if="!candidates || candidates.length === 0"
      variant="candidates"
      :title="emptyTitle"
      :description="emptyDescription"
    >
      <slot name="empty-action" />
    </ListSectionPlaceholder>

    <template v-else>
    <div class="table-container">
      <div class="table-header">
        <div v-if="showCheckboxes">
          <MyCheckbox
            id="select-all"
            :label="''"
            :model-value="allSelected"
            @update:model-value="handlerSelectAll"
            :empty-label="true"
          />
        </div>
        <div class="px-2.5">Кандидат</div>
        <div class="px-2.5">Источник</div>
        <div class="px-2.5">Резюме</div>
        <div class="px-2.5">Телефон</div>
        <div class="px-2.5">Город</div>
      </div>

    <div class="table-body">
      <div
        v-for="(candidate, index) in candidates"
        :key="candidate.id"
        class="table-row"
      >
        <div v-if="showCheckboxes">
          <MyCheckbox
            :id="candidate.id"
            :label="''"
            :model-value="selected?.[candidate.id] || false"
            :empty-label="true"
            @update:model-value="handlerItemSelect(candidate.id, $event)"
          />
        </div>

        <div class="flex items-center gap-2.5 p-2.5">
          <UiAvatar size="candidate">
            <UiAvatarImage
              v-if="
                candidate.imagePath &&
                !isExternalCandidatePhotoUrl(candidate.imagePath)
              "
              :src="candidate.imagePath"
              :alt="`${candidate.surname} ${candidate.firstname}`"
            />
            <UiAvatarFallback>
              {{ getInitials(candidate) }}
            </UiAvatarFallback>
          </UiAvatar>
          <div>
            <p
              class="cursor-pointer text-sm font-medium leading-150 text-space"
              :class="{ 'mb-5px': Array.isArray(candidate.tags) && candidate.tags.length > 0 }"
              @click="handlerItemClick(candidate, index)"
            >
              {{ getFullName(candidate) }}
            </p>
            <div class="flex gap-2.5">
              <span
                v-for="tag in candidate.tags"
                :key="tag.id"
                class="text-13px font-normal text-dodger"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>
        <div class="px-2.5 flex items-center gap-2 min-w-0">
          <slot name="cell-source" :candidate="candidate">
            <CardIcon
              v-if="getCandidateSourceLogoPath(candidate)"
              :icon="false"
              :isPng="true"
              :imagePath="getCandidateSourceLogoPath(candidate)!"
              :width="21"
              :height="21"
            />
            <CardIcon
              v-else-if="candidate.icon"
              :icon="candidate.icon"
              :isPng="candidate.isPng || false"
              :imagePath="candidate.icon"
              :width="21"
              :height="21"
            />
            <span
              v-else
              class="text-sm font-normal text-slate-custom truncate max-w-[140px]"
              :title="getSourceLabel(candidate)"
            >
              {{ getSourceLabel(candidate) }}
            </span>
          </slot>
        </div>
        <div class="px-2.5 text-sm font-normal text-space">
          <slot name="cell-resume" :candidate="candidate">
            {{ candidate.quickInfo || candidate.resume || 'Не указано' }}
          </slot>
        </div>
        <div class="px-2.5 text-sm font-normal text-space">
          {{ getCandidatePhoneForTable(candidate) }}
        </div>
        <div
          class="min-w-0 truncate whitespace-nowrap px-2.5 text-sm font-normal text-space"
          :title="getCandidateCityForTable(candidate)"
        >
          {{ getCandidateCityForDisplay(candidate) }}
        </div>
      </div>
    </div>
    </div>
    </template>
  </div>
</template>
<style scoped>
  .table-container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 2% 34% 10% 24% 12% 18%;
    gap: 10px;
    padding: 26px 25px;
    align-items: center;
  }

  .table-row {
    padding-top: 0;
    padding-bottom: 0;
  }

  .table-header {
    background-color: #f5f7fa;
    border-radius: 15px 15px 0 0;
    border-bottom: 1px solid #edeff5;
    font-weight: 500;
    font-size: 14px;
    color: #79869a;
    text-align: left;
  }

  .table-row {
    background-color: #ffffff;
    border-bottom: 1px solid #edeff5;
  }

  .table-row:last-child {
    border-bottom: none;
    border-radius: 0 0 15px 15px;
  }
</style>
