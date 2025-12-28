<script setup lang="ts">
  import type { Candidate } from '@/types/candidates';
  import MyCheckbox from '@/components/custom/MyCheckbox.vue';
  import UiAvatar from '@/components/ui/avatar/Avatar.vue';
  import UiAvatarImage from '@/components/ui/avatar/AvatarImage.vue';
  import UiAvatarFallback from '@/components/ui/avatar/AvatarFallback.vue';
  import CardIcon from '@/components/custom/CardIcon.vue';
  import UiDotsLoader from '@/components/custom/UiDotsLoader.vue';
  import { getVacancyName } from '@/src/api/vacancies';

  interface Props {
    candidates: Candidate[];
    loading?: boolean;
    selected?: Record<number, boolean>;
    showCheckboxes?: boolean;
    containerClass?: string;
    allSelected?: boolean;
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
  <div>
    <div v-if="loading" class="absolute left-1/2 top-1/2">
      <UiDotsLoader />
    </div>
    <div v-else class="table-container" :class="containerClass">
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
        <div class="px-2.5">Вакансия</div>
        <div class="px-2.5">Этап</div>
      </div>
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
              v-if="candidate.imagePath"
              :src="candidate.imagePath"
              :alt="`${candidate.surname} ${candidate.firstname}`"
            />
            <UiAvatarFallback>
              {{ getInitials(candidate) }}
            </UiAvatarFallback>
          </UiAvatar>
          <div>
            <p
              class="mb-5px cursor-pointer text-sm font-medium leading-[170%] text-space"
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
        <div class="px-2.5">
          <slot name="cell-source" :candidate="candidate">
            <CardIcon
              icon="hh"
              :isPng="false"
              imagePath="hh"
              :width="21"
              :height="21"
            />
          </slot>
        </div>
        <div class="px-2.5 text-sm font-normal text-space">
          <slot name="cell-resume" :candidate="candidate">
            {{ candidate.resume || 'Не указано' }}
          </slot>
        </div>
        <div class="px-2.5 text-sm font-normal text-space">
          <slot name="cell-vacancy" :candidate="candidate">
            {{ getVacancyNameForTable(candidate) }}
          </slot>
        </div>
        <div class="px-2.5 text-sm font-normal text-space">
          <slot name="cell-stage" :candidate="candidate">
            {{ getStageName(candidate) }}
          </slot>
        </div>
      </div>
    </div>

    <div
      v-if="!loading && (!candidates || candidates.length === 0)"
      class="empty-state"
    >
      <slot name="empty">
        <p class="text-state-custom text-center">Кандидаты не найдены</p>
      </slot>
    </div>
  </div>
</template>
<style scoped>
  .table-container {
    display: grid;
    grid-template-rows: auto;
    gap: 1px;
  }

  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 1.778% 26.667% 8% 17.778% 17.778% 23.556%;
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
    font-weight: 500;
    font-size: 14px;
    color: #79869a;
    text-align: left;
  }

  .table-row {
    background-color: #ffffff;
  }

  .table-row:not(:last-child) {
    margin-bottom: 1px;
  }

  .table-row:last-child {
    border-radius: 0 0 15px 15px;
  }
</style>
