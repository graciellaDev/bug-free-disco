<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import MyInput from '~/components/custom/MyInput.vue';
  import MyDropdown from '~/components/custom/MyDropdown.vue';
  import CandidateSearchFieldPicker from '@/components/custom/page-parts/candidate/CandidateSearchFieldPicker.vue';
  import CandidateVacancyPicker from '@/components/custom/page-parts/candidate/CandidateVacancyPicker.vue';
  import DropdownCalendarStatic from '~/components/custom/DropdownCalendarStatic.vue';
  import {
    CANDIDATE_SEARCH_MODE_LABELS,
    normalizeCandidateSearchFields,
    CANDIDATE_RESPONSE_TYPE_OPTIONS,
    createEmptyCandidateSearchRow,
    createDefaultCandidateListState,
    type CandidateListFilters,
    type CandidateListSort,
    type CandidateSearchRow,
    type CandidateSearchMode,
    type CandidateSearchField,
  } from '@/utils/candidateListParams';

  type SelectOption = { value: number | string; name: string };

  const props = defineProps<{
    isOpen: boolean;
    vacanciesOptions?: SelectOption[];
    clientsOptions?: SelectOption[];
    initialSearchRows?: CandidateSearchRow[];
    initialFilters?: CandidateListFilters;
    initialSort?: CandidateListSort;
  }>();

  const emit = defineEmits<{
    close: [];
    apply: [
      payload: {
        searchRows: CandidateSearchRow[];
        filters: CandidateListFilters;
        sort: CandidateListSort;
      },
    ];
    reset: [];
  }>();

  const searchModeOptions = Object.entries(CANDIDATE_SEARCH_MODE_LABELS).map(
    ([value, label]) => ({ value, label })
  );
  const searchRows = ref<CandidateSearchRow[]>([createEmptyCandidateSearchRow()]);
  const vacancyIds = ref<number[]>([]);
  const source = ref('');
  const gender = ref('');
  const responseType = ref('');
  const clientId = ref<number | ''>('');
  const ageFrom = ref('');
  const ageTo = ref('');
  const salaryFrom = ref('');
  const salaryTo = ref('');
  const citizenship = ref('');
  const location = ref('');
  const lastPosition = ref('');
  const tags = ref('');
  const createdAtFrom = ref('');
  const createdAtTo = ref('');
  const isOpenDateFrom = ref(false);
  const isOpenDateTo = ref(false);
  const sort = ref<CandidateListSort>('newest');

  const sourceOptions = [
    { value: '', label: 'Любой источник' },
    { value: 'hh.ru', label: 'HeadHunter' },
    { value: 'avito.ru', label: 'Авито' },
    { value: 'rabota.ru', label: 'Работа.ру' },
    { value: 'superjob', label: 'SuperJob' },
  ];
  const genderOptions = [
    { value: '', label: 'Любой пол' },
    { value: 'male', label: 'Мужской' },
    { value: 'female', label: 'Женский' },
  ];
  const sourceDropdownOptions = sourceOptions.map(opt => ({
    value: opt.value,
    name: opt.label,
  }));
  const responseTypeDropdownOptions = CANDIDATE_RESPONSE_TYPE_OPTIONS.map(opt => ({
    value: opt.value,
    name: opt.label,
  }));
  const genderDropdownOptions = genderOptions.map(opt => ({
    value: opt.value,
    name: opt.label,
  }));
  const clientsDropdownOptions = computed(() => [
    { value: '', name: 'Любой клиент' },
    ...(props.clientsOptions ?? []).map(c => ({ value: c.value, name: c.name })),
  ]);

  function loadFromProps() {
    const defaults = createDefaultCandidateListState();
    const rows = props.initialSearchRows?.length
      ? props.initialSearchRows.map(r => ({ ...r }))
      : defaults.searchRows;
    searchRows.value = (rows.length ? rows : [createEmptyCandidateSearchRow()]).map(
      r => ({
        ...r,
        fields: normalizeCandidateSearchFields(
          Array.isArray(r.fields) ? r.fields : [r.field ?? 'all']
        ),
      })
    );

    const f = props.initialFilters ?? {};
    vacancyIds.value = Array.isArray(f.vacancy_ids)
      ? f.vacancy_ids.map(v => Number(v)).filter(v => Number.isFinite(v) && v > 0)
      : (f.vacancy_id != null && Number(f.vacancy_id) > 0 ? [Number(f.vacancy_id)] : []);
    source.value = f.source ?? '';
    gender.value = f.gender ?? '';
    responseType.value = f.response_type ?? '';
    clientId.value = f.client_id ?? '';
    ageFrom.value = f.age_from != null ? String(f.age_from) : '';
    ageTo.value = f.age_to != null ? String(f.age_to) : '';
    salaryFrom.value = f.salary_from != null ? String(f.salary_from) : '';
    salaryTo.value = f.salary_to != null ? String(f.salary_to) : '';
    citizenship.value = f.citizenship ?? '';
    location.value = f.location ?? '';
    lastPosition.value = f.quick_info ?? '';
    tags.value = f.tags ?? '';
    createdAtFrom.value = f.created_at_from ?? '';
    createdAtTo.value = f.created_at_to ?? '';
    sort.value = props.initialSort ?? 'newest';
  }

  watch(
    () => props.isOpen,
    open => {
      if (open) {
        loadFromProps();
      }
    }
  );

  function addSearchRow() {
    searchRows.value.push(createEmptyCandidateSearchRow());
  }

  function removeSearchRow(index: number) {
    if (searchRows.value.length <= 1) {
      searchRows.value[0] = createEmptyCandidateSearchRow();
      return;
    }
    searchRows.value.splice(index, 1);
  }

  function rowModeLabel(mode: CandidateSearchMode) {
    return CANDIDATE_SEARCH_MODE_LABELS[mode] ?? CANDIDATE_SEARCH_MODE_LABELS.all;
  }

  function buildFilters(): CandidateListFilters {
    const filters: CandidateListFilters = {};
    if (vacancyIds.value.length > 0) {
      filters.vacancy_ids = vacancyIds.value;
      filters.vacancy_id = vacancyIds.value[0];
    }
    if (source.value.trim()) filters.source = source.value.trim();
    if (gender.value.trim()) filters.gender = gender.value.trim();
    if (responseType.value.trim()) filters.response_type = responseType.value.trim();
    const cid = clientId.value;
    if (cid !== '' && Number(cid) > 0) filters.client_id = Number(cid);
    if (ageFrom.value.trim() && Number.isFinite(Number(ageFrom.value))) {
      filters.age_from = Number(ageFrom.value);
    }
    if (ageTo.value.trim() && Number.isFinite(Number(ageTo.value))) {
      filters.age_to = Number(ageTo.value);
    }
    if (salaryFrom.value.trim() && Number.isFinite(Number(salaryFrom.value))) {
      filters.salary_from = Number(salaryFrom.value);
    }
    if (salaryTo.value.trim() && Number.isFinite(Number(salaryTo.value))) {
      filters.salary_to = Number(salaryTo.value);
    }
    if (citizenship.value.trim()) filters.citizenship = citizenship.value.trim();
    if (location.value.trim()) filters.location = location.value.trim();
    if (lastPosition.value.trim()) filters.quick_info = lastPosition.value.trim();
    if (tags.value.trim()) filters.tags = tags.value.trim();
    if (createdAtFrom.value.trim()) filters.created_at_from = createdAtFrom.value.trim();
    if (createdAtTo.value.trim()) filters.created_at_to = createdAtTo.value.trim();
    return filters;
  }

  function handleApply() {
    emit('apply', {
      searchRows: searchRows.value.map(r => ({
        text: r.text.trim(),
        mode: r.mode,
        fields: normalizeCandidateSearchFields(
          Array.isArray(r.fields) ? r.fields : [r.field ?? 'all']
        ),
      })),
      filters: buildFilters(),
      sort: sort.value,
    });
  }

  function handleReset() {
    searchRows.value = [createEmptyCandidateSearchRow()];
    vacancyIds.value = [];
    source.value = '';
    gender.value = '';
    responseType.value = '';
    clientId.value = '';
    ageFrom.value = '';
    ageTo.value = '';
    salaryFrom.value = '';
    salaryTo.value = '';
    citizenship.value = '';
    location.value = '';
    lastPosition.value = '';
    tags.value = '';
    createdAtFrom.value = '';
    createdAtTo.value = '';
    emit('reset');
  }

  const showExtraSearchRows = computed(() => searchRows.value.length > 1);
</script>

<template>
  <Popup
    :is-open="isOpen"
    width="960px"
    height="auto"
    :show-close-button="false"
    :lg-size="true"
    :parent-rounded="true"
    :content-rounded="false"
    :content-padding="false"
    :no-outer-padding="true"
    :no-scrollbar-gutter="true"
    :disable-overflow-hidden="true"
    :max-height="false"
    @close="emit('close')"
  >
    <div class="candidate-filters-popup">
      <div class="candidate-filters-popup__header">
        <h2 class="candidate-filters-popup__title">
          Поиск и фильтры
        </h2>
        <button
          type="button"
          class="candidate-filters-popup__close"
          aria-label="Закрыть"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <div class="candidate-filters-popup__body popup-scroll">
        <section class="candidate-filters-popup__search">
          <p class="candidate-filters-popup__field-label">
            Поиск по ключевым словам
          </p>
          <div class="candidate-filters-popup__search-rows">
            <div
              v-for="(row, index) in searchRows"
              :key="index"
              class="candidate-filters-search-row"
            >
              <MyInput
                v-model="row.text"
                placeholder="Поиск по ключевым словам"
                class="candidate-filters-search-row__input"
              />
              <MyDropdown
                class="candidate-filters-search-row__mode"
                :options="searchModeOptions.map(o => o.label)"
                :teleport-to-body="true"
                :model-value="rowModeLabel(row.mode)"
                placeholder="Режим"
                @update:model-value="
                  label => {
                    const found = searchModeOptions.find(o => o.label === label);
                    if (found) row.mode = found.value as CandidateSearchMode;
                  }
                "
              />
              <CandidateSearchFieldPicker
                class="candidate-filters-search-row__field"
                v-model="row.fields"
              />
              <button
                v-if="showExtraSearchRows"
                type="button"
                class="candidate-filters-search-row__remove"
                aria-label="Удалить строку поиска"
                @click="removeSearchRow(index)"
              >
                <svg-icon name="dropdown-cross" width="20" height="20" />
              </button>
            </div>
          </div>
          <button
            type="button"
            class="candidate-filters-popup__add-row"
            @click="addSearchRow"
          >
            + Добавить ещё поле
          </button>
        </section>

        <div class="candidate-filters-popup__grid">
          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Вакансия
            </label>
            <CandidateVacancyPicker
              v-model="vacancyIds"
              :options="vacanciesOptions ?? []"
              placeholder="Любая вакансия"
            />
          </div>
          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Последняя должность
            </label>
            <MyInput
              v-model="lastPosition"
              placeholder="Последняя занимаемая должность"
            />
          </div>

          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Возраст
            </label>
            <div class="candidate-filters-popup__range-row">
              <MyInput v-model="ageFrom" placeholder="От" class="flex-1" />
              <MyInput v-model="ageTo" placeholder="До" class="flex-1" />
            </div>
          </div>
          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Дата добавления
            </label>
            <div class="candidate-filters-popup__range-row">
              <div class="min-w-0 flex-1">
                <DropdownCalendarStatic
                  :model-value="createdAtFrom"
                  placeholder="От"
                  :is-open="isOpenDateFrom"
                  @update:model-value="createdAtFrom = $event"
                  @update:is-open="isOpenDateFrom = $event"
                />
              </div>
              <div class="min-w-0 flex-1">
                <DropdownCalendarStatic
                  :model-value="createdAtTo"
                  placeholder="До"
                  :is-open="isOpenDateTo"
                  @update:model-value="createdAtTo = $event"
                  @update:is-open="isOpenDateTo = $event"
                />
              </div>
            </div>
          </div>
          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Тип отклика
            </label>
            <MyDropdown
              :options="responseTypeDropdownOptions"
              :teleport-to-body="true"
              :model-value="responseType"
              placeholder="Любой тип отклика"
              @update:model-value="v => responseType = String(v ?? '')"
            />
          </div>
          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Пол
            </label>
            <MyDropdown
              :options="genderDropdownOptions"
              :teleport-to-body="true"
              :model-value="gender"
              placeholder="Любой пол"
              @update:model-value="v => gender = String(v ?? '')"
            />
          </div>

          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Ожидаемая зарплата
            </label>
            <div class="candidate-filters-popup__range-row">
              <MyInput v-model="salaryFrom" placeholder="От" class="flex-1" />
              <MyInput v-model="salaryTo" placeholder="До" class="flex-1" />
            </div>
          </div>
          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Гражданство
            </label>
            <MyInput
              v-model="citizenship"
              placeholder="Гражданство кандидата"
            />
          </div>
          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Город проживания
            </label>
            <MyInput
              v-model="location"
              placeholder="Город проживания кандидата"
            />
          </div>

          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Источник
            </label>
            <MyDropdown
              :options="sourceDropdownOptions"
              :teleport-to-body="true"
              :model-value="source"
              placeholder="Любой источник"
              @update:model-value="v => source = String(v ?? '')"
            />
          </div>
          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Клиент
            </label>
            <MyDropdown
              :options="clientsDropdownOptions"
              :teleport-to-body="true"
              :model-value="clientId"
              placeholder="Любой клиент"
              @update:model-value="
                v => {
                  if (v === null || v === undefined || v === '') {
                    clientId = '';
                  } else {
                    const num = Number(v);
                    clientId = Number.isFinite(num) && num > 0 ? num : '';
                  }
                }
              "
            />
          </div>
          <div class="candidate-filters-popup__field">
            <label class="candidate-filters-popup__field-label">
              Теги
            </label>
            <MyInput v-model="tags" placeholder="Теги через запятую" />
          </div>
        </div>
      </div>

      <div class="candidate-filters-popup__footer">
        <UiButton
          size="semiaction"
          variant="action"
          @click="handleApply"
        >
          Применить
        </UiButton>
        <button
          type="button"
          class="text-sm font-medium text-slate-custom transition-colors hover:text-dodger"
          @click="handleReset"
        >
          Сбросить фильтры
        </button>
      </div>
    </div>
  </Popup>
</template>

<style scoped>
.candidate-filters-popup {
  display: flex;
  width: 100%;
  max-height: min(90vh, 100dvh);
  flex-direction: column;
  overflow: hidden;
  border-radius: 15px;
  background: #fff;
}

.candidate-filters-popup__header {
  position: relative;
  flex-shrink: 0;
  padding: 20px 25px 12px;
}

.candidate-filters-popup__title {
  padding-right: 2rem;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  color: #2f353d;
}

.candidate-filters-popup__close {
  position: absolute;
  top: 20px;
  right: 25px;
  font-size: 1.125rem;
  line-height: 1;
  color: #79869a;
  transition: color 0.15s ease;
}

.candidate-filters-popup__close:hover {
  color: #2f353d;
}

.candidate-filters-popup__body {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 25px 15px;
}

.candidate-filters-popup__search {
  margin-bottom: 20px;
}

.candidate-filters-popup__search-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.candidate-filters-popup__add-row {
  margin-top: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #5898ff;
  transition: opacity 0.15s ease;
}

.candidate-filters-popup__add-row:hover {
  opacity: 0.8;
}

.candidate-filters-popup__range-row {
  display: flex;
  gap: 12px;
}

.candidate-filters-popup__field-label {
  display: block;
  margin-bottom: 7px;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  color: #2f353d;
}

.candidate-filters-popup__grid {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 15px;
  row-gap: 12px;
  padding-top: 4px;
}

@media (min-width: 768px) {
  .candidate-filters-popup__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.candidate-filters-popup__field {
  min-width: 0;
}

.candidate-filters-popup__footer {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 15px;
  row-gap: 8px;
  border-top: 1px solid #edeff5;
  padding: 12px 25px 15px;
}

.candidate-filters-search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.candidate-filters-search-row__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: #79869a;
  cursor: pointer;
  transition: color 0.15s ease;
}

.candidate-filters-search-row__remove:hover {
  color: #2f353d;
}

@media (min-width: 768px) {
  .candidate-filters-search-row {
    grid-template-columns: minmax(0, 1fr) 200px minmax(160px, 220px) auto;
  }
}
</style>
