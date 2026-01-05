<script setup lang="ts">
  import { ref, onMounted, toRef, watch } from 'vue';
  import { getVacancyById } from '@/src/api/vacancies';
  import { usePopups } from '@/composables/usePopup';
  import { normalizeUsername } from '@/helpers/messengers';
  import CandidateInfoHeader from './CandidateInfoHeader.vue';
  import CandidateEditPopup from './popups/CandidateEditPopup.vue';
  import CandidateEmailPopup from './popups/CandidateEmailPopup.vue';
  import CandidateInfoContent from './CandidateInfoContent.vue';
  import CandidateDeletePopup from './popups/CandidateDeletePopup.vue';
  import CandidateMoveToVacancyPopup from './popups/CandidateMoveToVacancyPopup.vue';
  import CandidateRemoveFromVacancyPopup from './popups/CandidateRemoveFromVacancyPopup.vue';
  import CandidateRefusePopup from './popups/CandidateRefusePopup.vue';
  import { useCandidateActions } from '../composables/useCandidateActions';
  import { useCandidateActionsUI } from '../composables/useCandidateActionsUI';
  import { updateCandidate } from '@/src/api/candidates';

  import type { Candidate, CandidateUpdateRequest } from '@/types/candidates';
  import type { Stage } from '@/types/funnels';
  import type { Vacancy } from '@/types/vacancy';

  const props = defineProps<{
    candidate: Candidate;
    stages: Stage[] | [];
    isFunnel: boolean;
  }>();

  const emit = defineEmits<{
    'candidate-updated': [candidate: Candidate];
    'candidate-deleted': [id: number];
    'update:selectedLabel': [label: string];
  }>();

  const vacancyName = ref<string>('');
  const vacancy = ref<Vacancy | null>(null);

  const selectedLabel = ref<string>('');
  const candidateEditForm = ref<Record<string, any>>({});

  const options = ref<string[]>([]);

  const popups = usePopups({
    deleteCandidate: {
      manageBodyScroll: true,
      onClose: () => {
        // console.log('Попап удаления закрыт');
      },
    },
    editCandidate: {
      manageBodyScroll: true,
      onClose: () => {
        candidateEditForm.value = {};
        candidateActions.resetFormState();
        // console.log('Попап редактирования данных кандидата закрыт');
      },
    },
    mailToCandidate: {
      manageBodyScroll: true,
      onClose: () => {
        // console.log('Попап отправки почты закрыт');
      },
    },
    moveToVacancy: {
      manageBodyScroll: true,
      onClose: () => {
        // console.log('Попап переноса кандидата в другую вакансию закрыт');
      },
    },
    removeFromVacancy: {
      manageBodyScroll: true,
      onClose: () => {
        // console.log('Попап удаления кандидата из вакансии закрыт');
      },
    },
    refuseCandidate: {
      manageBodyScroll: true,
      onClose: () => {
        // console.log('Попап отказа кандидату закрыт');
      },
    },
  });

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

  const handleMoveToVacancy = () => {
    popups.moveToVacancy.open();
  };

  const handleRemoveFromVacancy = () => {
    popups.removeFromVacancy.open();
  };

  const handleRefuseCandidate = async (data: {
    sendEmail: boolean;
    subject?: string;
    body?: string;
  }) => {
    if (!props.stages || !props.candidate) {
      console.error('[handkeRefuseCandidate] Недостаточно данных');
      return;
    }

    const rejectedStage = props.stages.find(
      stage => stage.name === 'Отклоненные' || stage.id === 3
    );
    if (!rejectedStage) {
      console.error('[handkeRefuseCandidate] Этап "Отклонённые" не найден');
      return;
    }

    try {
      const updateData: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        phone: props.candidate.phone,
        stage: rejectedStage.id,
      };

      const updated = await updateCandidate(updateData);
      emit('candidate-updated', updated.data);

      if (data.sendEmail && data.subject && data.body) {
        sendEmail({
          subject: data.subject,
          body: data.body,
        });
      }

      popups.refuseCandidate.close();
    } catch (err) {
      console.error(
        '[handleRefuseCandidate] Ошибка при отказе кандидату:',
        err
      );
    }
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

  const dropdownOptions = [
    'Поделиться кандидатом',
    'Редактировать',
    'Файл резюме',
    'Переместить в вакансию',
    'Копировать в вакансию',
    ...(props.candidate?.vacancy_id ? ['Открепить от вакансии'] : []),
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

  //  Отправка письма кандидату
  const sendEmail = (data: Record<string, any>) => {
    console.log('send email', data);
    // TODO: Реализовать отправку письма
  };

  const candidateActionsUI = useCandidateActionsUI(toRef(props.candidate), {
    onEdit: () => handleEditCandidate(),
    onDelete: () => handleDeleteCandidate(),
    onEmail: () => popups.mailToCandidate.open(),
    onMoveToVacancy: () => handleMoveToVacancy(),
    onRemoveFromVacancy: () => handleRemoveFromVacancy(),
    // onCopyToVacancy: () => popups.copyCand
    onRefuse: () => popups.refuseCandidate.open(),
  });

  const handleConfirmMove = async (vacancyId: number) => {
    try {
      const movedCandidate: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        phone: props.candidate.phone,
        vacancy_id: vacancyId,
      };
      const updated = await updateCandidate(movedCandidate);
      emit('candidate-updated', updated.data);

      popups.moveToVacancy.close();
      // TODO: Сообщение об успехе при необходимости
    } catch (err) {
      console.error(
        '[handleConfirmMove] Ошибка при перемещении кандидата: ',
        err
      );
    }
  };

  //  Обработчик отправки формы редактирования
  const handleFormSubmit = async (formData: Record<string, any>) => {
    await handleUpdate(formData, () => popups.editCandidate.isOpen.value);
  };

  //  Отмена редактирования
  const handleFormCancel = () => {
    popups.editCandidate.close();
  };

  const handleConfirmTransfer = async (stageName: string) => {
    if (!props.stages || !props.candidate) {
      console.error('[handleConfirmTransfer] Недостаточно данных для переноса');
      return;
    }

    const targetStage = props.stages.find(stage => stage.name === stageName);
    if (!targetStage) {
      console.error(`[handleConfirmTransfer] Этап ${stageName} не найден.`);
      return;
    }

    try {
      const updateData: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        phone: props.candidate.phone,
        stage: targetStage.id,
      };

      console.log('upadateData: ', updateData);

      const updated = await updateCandidate(updateData);
      emit('candidate-updated', updated.data);
    } catch (err) {
      console.error(
        '[handleConfirmTransfer] Ошибка при переносе кандидата на другой этап: ',
        err
      );
    }
  };

  const handleConfirmRemove = async () => {
    try {
      const updateData: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        phone: props.candidate.phone,
        vacancy_id: null,
        stage: 1,
      };

      const response = await updateCandidate(updateData);
      if (response && typeof response === 'object' && response.data) {
        vacancy.value = null;
        vacancyName.value = 'Вакансия не определена';

        emit('candidate-updated', response.data as Candidate);

        popups.removeFromVacancy.close();
      }
    } catch (error: any) {
      console.error(
        '[handleConfirmRemove] Ошибка при откреплении от вакансии:',
        error
      );
      const errors = candidateActions.parseServerErrors(error);

      // TODO: Обработка ошибок (показать сообщение пользователю)
      // Показать ошибку пользователю
      // Вариант 1: alert (простой)
      // alert(errors._general || 'Не удалось открепить кандидата от вакансии');

      // Вариант 2: Использовать toast/notification компонент
      // showNotification('error', errors._general || 'Ошибка при откреплении');
    }
  };

  const getNextStageName = (
    currentStageId: number | null | undefined,
    stagesList: Stage[]
  ): string => {
    if (!stagesList || stagesList.length === 0) {
      return '';
    }

    const currentStageIndex = stagesList.findIndex(
      stage => stage.id === currentStageId
    );

    let nextStage: Stage | null = null;

    if (currentStageIndex >= 0) {
      nextStage =
        currentStageIndex === stagesList.length - 1
          ? stagesList[0]
          : stagesList[currentStageIndex + 1];
    } else {
      nextStage = stagesList[0];
    }

    return nextStage?.name || '';
  };

  watch(
    () => props.candidate,
    async newCandidate => {
      if (props.stages && props.stages.length > 0 && newCandidate) {
        selectedLabel.value = getNextStageName(
          newCandidate.stage,
          props.stages
        );
      }
    },
    { immediate: true }
  );

  watch(
    () => props.candidate?.vacancy_id,
    async newVacancyId => {
      if (newVacancyId) {
        vacancy.value = await getVacancyById(newVacancyId.toString());
        vacancyName.value = vacancy.value
          ? vacancy.value?.name
          : 'Вакансия не определена';
      } else {
        vacancy.value = null;
        vacancyName.value = 'Вакансия не определена';
      }
    }
  );

  watchEffect(() => {
    if (props.stages && props.stages.length > 0) {
      options.value = [
        ...props.stages
          .filter(stage => stage.id !== props.candidate.stage)
          .map(stage => stage.name),
      ];

      if (props.candidate) {
        selectedLabel.value = getNextStageName(
          props.candidate.stage,
          props.stages
        );
      }
    }
  });

  onMounted(async () => {
    if (props.candidate?.vacancy_id) {
      vacancy.value = await getVacancyById(
        props.candidate.vacancy_id.toString()
      );
    }
    vacancyName.value = vacancy.value
      ? vacancy.value?.name
      : 'Вакансия не определена';
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
      @confirm-transfer="handleConfirmTransfer"
    />
    <div class="absolute left-0 top-[70px] h-[1px] w-full bg-athens-gray"></div>
    <CandidateInfoContent
      :candidate="candidate"
      :vacancyName="vacancyName"
      @telegram="candidateActionsUI.handleClickTelegram"
      @messengerMax="candidateActionsUI.handleClickMessengerMax"
      @candidate-updated="emit('candidate-updated', $event)"
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
    <CandidateMoveToVacancyPopup
      :isOpen="popups.moveToVacancy.isOpen"
      :candidate="candidate"
      @close="popups.moveToVacancy.close"
      @confirm="handleConfirmMove"
    />
    <CandidateRemoveFromVacancyPopup
      v-if="vacancy"
      :isOpen="popups.removeFromVacancy.isOpen"
      :candidate="candidate"
      :vacancyName="vacancy.name"
      @close="popups.removeFromVacancy.close"
      @confirm="handleConfirmRemove"
    />
    <CandidateRefusePopup
      :isOpen="popups.refuseCandidate.isOpen"
      :candidateName="`${candidate.firstname || ''} ${candidate.surname || ''}`"
      :vacancyName="vacancyName"
      @close="popups.refuseCandidate.close"
      @submit="handleRefuseCandidate"
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
