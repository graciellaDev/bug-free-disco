<script setup lang="ts">
  import MyCheckbox from '@/components/custom/MyCheckbox.vue';
  import UiAvatar from '@/components/ui/avatar/Avatar.vue';
  import UiAvatarImage from '@/components/ui/avatar/AvatarImage.vue';
  import UiAvatarFallback from '@/components/ui/avatar/AvatarFallback.vue';
  import CardIcon from '@/components/custom/CardIcon.vue';
  import UiDotsLoader from '@/components/custom/UiDotsLoader.vue';

  import type { Candidate } from '@/types/candidates';

  // Карта логотипов источников (5 основных сайтов).
  // Файлы логотипов лежат во фронтенде в /public/logos (*.svg).
  const SOURCE_LOGO_MAP: Record<string, string> = {
    'hh.ru': '/logos/hh.svg',
    'superjob.ru': '/logos/superjob.svg',
    'rabota.ru': '/logos/rabota.svg',
    'avito.ru': '/logos/avito.svg',
    'zarplata.ru': '/logos/zarplata.svg',
  };

  interface Props {
    candidates: Candidate[];
    loading?: boolean;
    selected?: Record<number, boolean>;
    showCheckboxes?: boolean;
    allSelected?: boolean;
    activeCandidateId?: number | null;
  }

  const props: Props = defineProps<{
    candidates: Candidate[];
    loading: boolean;
    selected: Record<number, boolean>;
    showCheckboxes: boolean;
    allSelected: boolean;
    /** ID кандидата, открытого в правой панели — для подсветки строки */
    activeCandidateId?: number | null;
  }>();

  const emit = defineEmits<{
    'item-click': [candidate: Candidate, index: number];
    'selection-change': [selected: Record<number, boolean>];
    'select-all': [isSelected: boolean];
  }>();

  const getFullName = (candidate: Candidate) => {
    const parts = [candidate.firstname, candidate.surname].filter(Boolean);
    return parts.join(' ') || 'Без имени';
  };

  const getInitials = (candidate: Candidate) => {
    const firstnameInitial = candidate.firstname?.[0] || '';
    const surnameInitial = candidate.surname?.[0] || '';
    return `${firstnameInitial}${surnameInitial}`.toUpperCase();
  };

  // const getCompanyName = (candidate: Candidate) => {
  //   return candidate.customer?.toString() || 'Не указано';
  // };

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

  const getPositionTitle = (candidate: Candidate): string | null => {
    const value = candidate.quickInfo?.trim();
    if (!value) return null;
    if (value.toLowerCase() === 'не указан') return null;
    return value;
  };

  const getSourceLogo = (candidate: Candidate): string | null => {
    const key = candidate.source?.trim().toLowerCase() || '';
    return SOURCE_LOGO_MAP[key] ?? null;
  };
</script>

<template>
  <div>
    <!-- Лоадер только при первой загрузке (нет кандидатов) -->
    <div v-if="props.loading && (!candidates || candidates.length === 0)" class="absolute left-1/2 top-1/2">
      <UiDotsLoader />
    </div>

    <!-- Список кандидатов: при обновлении не скрываем, чтобы не пропадала подсветка -->
    <div
      v-if="candidates?.length"
      class="candidate-list relative"
      :class="{ 'candidate-list--refreshing': props.loading }"
    >
      <div v-if="showCheckboxes" class="list-header">
        <MyCheckbox
          id="select-all"
          :label="''"
          :model-value="allSelected"
          @update:model-value="handlerSelectAll"
          :empty-label="true"
        />
      </div>

      <!-- Список элементов -->
      <div
        v-for="(candidate, index) in candidates"
        :key="candidate.id"
        class="candidate-item"
        :class="{ 'candidate-item--active': props.activeCandidateId != null && candidate.id === props.activeCandidateId }"
      >
        <!-- Чекбокс -->
        <div v-if="showCheckboxes" class="checkbox-cell">
          <MyCheckbox
            :id="candidate.id"
            :label="''"
            :model-value="selected?.[candidate.id] || false"
            :empty-label="true"
            @update:model-value="handlerItemSelect(candidate.id, $event)"
          />
        </div>

        <div class="candidate-info" @click="handlerItemClick(candidate, index)">
          <UiAvatar size="candidate">
            <UiAvatarImage
              v-if="candidate.imagePath"
              :src="candidate.imagePath"
              :alt="getFullName(candidate)"
            />
            <UiAvatarFallback>
              {{ getInitials(candidate) }}
            </UiAvatarFallback>
          </UiAvatar>
          <div class="candidate-details">
            <p class="candidate-name">
              {{ getFullName(candidate) }}
            </p>
            <p
              v-if="getPositionTitle(candidate)"
              class="candidate-position"
              :title="getPositionTitle(candidate) || undefined"
            >
              {{ getPositionTitle(candidate) }}
            </p>
          </div>
        </div>

        <div class="candidate-icon">
          <!-- Лого источника (5 сайтов из /logos) как фоновое изображение -->
          <CardIcon
            v-if="getSourceLogo(candidate)"
            :icon="false"
            :isPng="true"
            :imagePath="getSourceLogo(candidate)!"
            :width="20"
            :height="20"
          />
          <!-- Если для источника нет логотипа, показываем иконку кандидата как раньше -->
          <CardIcon
            v-else-if="candidate.icon"
            :icon="candidate.icon"
            :isPng="candidate.isPng || false"
            :imagePath="candidate.icon"
            :width="20"
            :height="20"
          />
        </div>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div
      v-if="!props.loading && (!candidates || candidates.length === 0)"
      class="empty-state"
    >
      <p class="text-center">Кандидаты не найдены</p>
    </div>
  </div>
</template>

<style scoped>
  .candidate-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    /* background-color: white;
    border-radius: 8px; */
  }

  .list-header {
    padding: 12px 16px;
    border-bottom: 1px solid #f4f6f8;
  }

  .candidate-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #f4f6f8;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .candidate-item:hover {
    background-color: #f9fafb;
  }

  .candidate-item--active {
    background-color: #f9fafc;
  }

  .candidate-item--active:hover {
    background-color: #f9fafc;
  }

  .candidate-list--refreshing {
    pointer-events: auto;
  }

  .candidate-item:last-child {
    border-bottom: none;
  }

  .checkbox-cell {
    flex-shrink: 0;
  }

  .candidate-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0; /* Для правильного обрезания текста */
  }

  .candidate-details {
    flex: 1;
    min-width: 0;
  }

  .candidate-name {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .candidate-position {
    font-size: 12px;
    font-weight: 400;
    color: #79869a;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .candidate-company {
    font-size: 12px;
    color: #64748b;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .candidate-icon {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    margin-top: 3px; /* визуально выравниваем логотип источника по верхнему отступу строки */
  }

  .empty-state {
    padding: 40px 20px;
    text-align: center;
    color: #64748b;
  }
</style>
