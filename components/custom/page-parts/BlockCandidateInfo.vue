<script setup lang="ts">
  import { ref, onMounted, toRef } from 'vue';
  import { getVacancyName } from '@/src/api/vacancies';
  import { usePopups } from '@/composables/usePopup';
  import { normalizeUsername } from '@/helpers/messengers';
  import CandidateInfoHeader from './candidate/CandidateInfoHeader.vue';
  import CandidateEditPopup from './candidate/popups/CandidateEditPopup.vue';
  import CandidateEmailPopup from './candidate/popups/CandidateEmailPopup.vue';
  import CandidateInfoContent from './candidate/CandidateInfoContent.vue';
  import CandidateDeletePopup from './candidate/popups/CandidateDeletePopup.vue';
  import { useCandidateActions } from './composables/useCandidateActions';
  import { useCandidateActionsUI } from './composables/useCandidateActionsUI';
  import type { Candidate } from '@/types/candidates';

  const props = defineProps<{
    candidate: Candidate;
    isFunnel: boolean;
  }>();

  const emit = defineEmits<{
    'candidate-updated': [candidate: Candidate];
    'candidate-deleted': [id: number];
    'update:selectedLabel': [label: string];
  }>();

  const vacancyName = ref<string>('');

  const selectedLabel = ref<string>('Подумать');
  const candidateEditForm = ref<Record<string, any>>({});

  const popups = usePopups({
    deleteCandidate: {
      manageBodyScroll: true,
      onClose: () => {
        console.log('Попап удаления закрыт');
      },
    },
    editCandidate: {
      manageBodyScroll: true,
      onClose: () => {
        candidateEditForm.value = {};
        candidateActions.resetFormState();
        console.log('Попап редактирования данных кандидата закрыт');
      },
    },
    mailToCandidate: {
      manageBodyScroll: true,
      onClose: () => {
        console.log('Попап отправки почты закрыт');
      },
    },
  });

  // Открытие попапа удаления
  const handleDeleteCandidate = () => {
    popups.deleteCandidate.open();
  };

  //  Открытие попапа редактирования
  const handleEditCandidate = () => {
    // Инициализация формы текущими данными кандидата
    candidateEditForm.value = {
      firstname: props.candidate.firstname || '',
      surname: props.candidate.surname || '',
      patronymic: props.candidate.patronymic || '',
      email: props.candidate.email || '',
      phone: props.candidate.phone || '',
      resume: props.candidate.resume || '',
      messengerMax: normalizeUsername(props.candidate.messengerMax),
      telegram: normalizeUsername(props.candidate.telegram),
      photo: props.candidate.imagePath || null,
    };

    // Сброс состояния формы
    resetFormState();

    // Открытие попапа
    popups.editCandidate.open();
  };

  const candidateActions = useCandidateActions(
    toRef(props.candidate),
    updated => emit('candidate-updated', updated),
    id => emit('candidate-deleted', id),
    () => popups.editCandidate.close()
  );

  const {
    isSubmitting,
    serverErrors,
    isSuccess,
    successMessage,
    handleDelete,
    handleUpdate,
    resetFormState,
  } = candidateActions;

  const options = [
    'Все',
    'Не разобранное',
    'Подумать',
    'Подходящие',
    'Отклоненные',
    'Служба безопасности',
  ];

  const dropdownOptions = [
    'Поделиться кандидатом',
    'Редактировать',
    'Файл резюме',
    'Переместить в вакансию',
    'Копировать в вакансию',
    'Отправить сообщение',
    'Отправить на оценку {-}',
    'Удалить',
  ];

  //  Подтверждение удаления кандидата
  const confirmDelete = async () => {
    try {
      await handleDelete();
    } catch (error) {}
  };

  //  Обработчик отправки формы редактирования
  const handleFormSubmit = async (formData: Record<string, any>) => {
    await handleUpdate(formData, () => popups.editCandidate.isOpen.value);
  };

  //  Отмена редактирования
  const handleFormCancel = () => {
    popups.editCandidate.close();
  };

  //  Отправка письма кандидату
  const sendEmail = (data: Record<string, any>) => {
    console.log('send email', data);
    // TODO: Реализовать отправку письма
  };

  const candidateActionsUI = useCandidateActionsUI(toRef(props.candidate), {
    onEdit: () => handleEditCandidate(),
    onDelete: () => handleDeleteCandidate(),
    onEmail: () => popups.mailToCandidate.open(),
  });

  onMounted(async () => {
    // Загрузка названия вакансии
    if (props.candidate?.vacancy) {
      vacancyName.value = await getVacancyName(
        props.candidate.vacancy.toString()
      );
    } else {
      vacancyName.value = 'Вакансия не определена';
    }
  });
</script>
<template>
  <div class="relative mb-15px rounded-fifteen bg-white p-25px pt-15px">
    <CandidateInfoHeader
      :isFunnel="isFunnel"
      :options="options"
      :selectedLabel="selectedLabel"
      :dropdownOptions="dropdownOptions"
      @select-item="candidateActionsUI.handleSelectItem"
      @add-comment="candidateActionsUI.handleClickAddComment"
      @new-task="candidateActionsUI.handleClickNewTask"
      @email="candidateActionsUI.handleClickEmail"
      @refuse="candidateActionsUI.handleClickRefuse"
      @update:selectedLabel="emit('update:selectedLabel', $event)"
    />
    <div class="absolute left-0 top-[70px] h-[1px] w-full bg-athens-gray"></div>
    <CandidateInfoContent
      :candidate="candidate"
      :vacancyName="vacancyName"
      @telegram="candidateActionsUI.handleClickTelegram"
      @messengerMax="candidateActionsUI.handleClickMessengerMax"
      @add-tag="candidateActionsUI.handleClickAddTag"
    />
    <CandidateEmailPopup
      :isOpen="popups.mailToCandidate.isOpen"
      @close="popups.mailToCandidate.close"
      @submit="sendEmail"
    />
    <CandidateEditPopup
      :isOpen="popups.editCandidate.isOpen"
      :candidate="candidate"
      :modelValue="candidateEditForm"
      :serverErrors="serverErrors"
      :loading="isSubmitting"
      :isSuccess="isSuccess"
      :successMessage="successMessage"
      @close="popups.editCandidate.close"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
      @clear-error="candidateActions.resetFormState()"
    />
    <CandidateDeletePopup
      :isOpen="popups.deleteCandidate.isOpen"
      :candidate="candidate"
      @close="popups.deleteCandidate.close"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
