<script setup lang="ts">
  import {
    ref,
    onMounted,
    onBeforeUnmount,
    toRef,
    watch,
    watchEffect,
    computed,
    provide,
  } from 'vue';
  import { getVacancyById } from '@/src/api/vacancies';
  import { usePopups } from '@/composables/usePopup';
  import { useJoblyToastTopStyle } from '@/composables/useJoblyToastTopStyle';
  import { normalizeUsername } from '@/helpers/messengers';
  import CandidateInfoHeader from './CandidateInfoHeader.vue';
  import CandidateEditPopup from './popups/CandidateEditPopup.vue';
  import CandidateInfoContent from './CandidateInfoContent.vue';
  import CandidateEmailPopup from './popups/CandidateEmailPopup.vue';
  import CandidateDeletePopup from './popups/CandidateDeletePopup.vue';
  import CandidateTransferToVacancyPopup from './popups/CandidateTransferToVacancyPopup.vue';
  import CandidateRemoveFromVacancyPopup from './popups/CandidateRemoveFromVacancyPopup.vue';
  import CandidateRefusePopup from './popups/CandidateRefusePopup.vue';
  import AttachToVacancyDropdown from './AttachToVacancyDropdown.vue';
  import { useCandidateActions } from '../composables/useCandidateActions';
  import { useCandidateActionsUI } from '../composables/useCandidateActionsUI';
  import {
    createCandidate,
    updateCandidate,
    attachCandidateToVacancy,
    sendCandidateEmail,
    createCandidateComment,
  } from '@/src/api/candidates';
  import { getCandidateProfileExternalUrl, getCandidateResumePdfUrl } from '@/utils/candidateSourceLinks';
  import { displayCandidateEmailOrEmpty } from '@/utils/candidateDisplayEmail';
  import { buildCandidateCopyPayload } from '@/utils/buildCandidateCopyPayload';

  import type { Candidate, CandidateUpdateRequest } from '@/types/candidates';
  import type { Stage } from '@/types/funnels';
  import type { Vacancy, TransferMode } from '@/types/vacancy';

  const props = defineProps<{
    candidate: Candidate;
    stages: Stage[] | [];
    isFunnel: boolean;
    vacancy?: Vacancy | null;
  }>();

  const emit = defineEmits<{
    'candidate-updated': [candidate: Candidate];
    'candidate-moved': [candidate: Candidate, newStageId?: number];
    'candidate-deleted': [id: number];
    'update:selectedLabel': [label: string];
    'add-comment': [];
    'add-task': [];
    /** Открыть ленту и блок «Чат на сайте» (пункт меню «Отправить сообщение») */
    'open-site-chat': [];
    'email-sent': [];
    /** Перезагрузить ленту событий (комментарий, смена этапа и т.д.) */
    'candidate-activity-refresh': [];
  }>();

  const isRejectedStage = computed(() => {
    const sid = props.candidate?.stage;
    if (sid == null || !props.stages?.length) return false;
    const st = props.stages.find(s => s.id === sid);
    const name = (st?.name || '').trim();
    return (
      name === 'Отклоненные' ||
      name === 'Отклонённые' ||
      name === 'Отказ' ||
      sid === 4
    );
  });

  const vacancyName = ref<string>('');
  const vacancy = ref<Vacancy | null>(null);

  const selectedLabel = ref<string>('');
  const candidateEditForm = ref<Record<string, any>>({});

  const options = ref<string[]>([]);

  const transferPopupMode = ref<TransferMode>('move');
  const isTransferPopupOpen = ref(false);

  const transferSuccessToast = ref<{ show: boolean; text: string }>({
    show: false,
    text: '',
  });
  let transferToastTimer: ReturnType<typeof setTimeout> | null = null;

  function showTransferSuccessToast(message: string) {
    transferSuccessToast.value = { show: true, text: message };
    if (transferToastTimer) clearTimeout(transferToastTimer);
    transferToastTimer = setTimeout(() => {
      transferSuccessToast.value = { show: false, text: '' };
      transferToastTimer = null;
    }, 4000);
  }

  /** Тост как на вкладке «Поля»: шапка, блок телефона/почты */
  const candidateCardFieldsToast = ref<{
    show: boolean;
    text: string;
    variant: 'success' | 'error';
  }>({ show: false, text: '', variant: 'error' });
  let candidateCardFieldsToastTimer: ReturnType<typeof setTimeout> | null =
    null;

  function showCandidateCardFieldsToast(
    message: string,
    variant: 'success' | 'error' = 'error'
  ) {
    candidateCardFieldsToast.value = {
      show: true,
      text: message,
      variant,
    };
    if (candidateCardFieldsToastTimer)
      clearTimeout(candidateCardFieldsToastTimer);
    candidateCardFieldsToastTimer = setTimeout(() => {
      candidateCardFieldsToast.value = {
        show: false,
        text: '',
        variant: 'error',
      };
      candidateCardFieldsToastTimer = null;
    }, 4000);
  }

  provide('showFieldsTabToast', showCandidateCardFieldsToast);

  const joblyToastTopStyle = useJoblyToastTopStyle(
    computed(
      () =>
        transferSuccessToast.value.show || candidateCardFieldsToast.value.show
    )
  );

  onBeforeUnmount(() => {
    if (transferToastTimer) clearTimeout(transferToastTimer);
    if (candidateCardFieldsToastTimer)
      clearTimeout(candidateCardFieldsToastTimer);
  });

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

  const handleAddCommentClick = () => {
    emit('add-comment');
  };

  const handleNewTaskClick = () => {
    emit('add-task');
  };

  //  Открытие попапа редактирования
  const handleEditCandidate = () => {
    // Инициализация формы текущими данными кандидата
    candidateEditForm.value = {
      firstname: props.candidate.firstname || '',
      surname: props.candidate.surname || '',
      patronymic: props.candidate.patronymic || '',
      email: displayCandidateEmailOrEmpty(props.candidate.email),
      phone: props.candidate.phone || '',
      resume: props.candidate.resume || '',
      source: props.candidate.source || '',
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
    transferPopupMode.value = 'move';
    isTransferPopupOpen.value = true;
  };

  const handleCopyToVacancy = () => {
    transferPopupMode.value = 'copy';
    isTransferPopupOpen.value = true;
  };

  const handleTransferPopupClose = () => {
    isTransferPopupOpen.value = false;
  };

  const handleRemoveFromVacancy = () => {
    popups.removeFromVacancy.open();
  };

  const handleRefuseCandidate = async (data: {
    rejection_reason_id?: number;
    internal_comment?: string;
  }) => {
    if (!props.stages || !props.candidate) {
      console.error('[handkeRefuseCandidate] Недостаточно данных');
      return;
    }

    const rejectedStage = props.stages.find(stage => {
      const name = (stage.name || '').trim();
      return (
        stage.id === 4 ||
        name === 'Отклоненные' ||
        name === 'Отклонённые' ||
        name === 'Отказ'
      );
    });
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
      if (data.rejection_reason_id != null) {
        updateData.rejection_reason_id = data.rejection_reason_id;
      }

      const updated = await updateCandidate(updateData);
      const fresh = updated.data;
      const note = data.internal_comment?.trim();
      if (note) {
        try {
          await createCandidateComment(props.candidate.id, note);
        } catch (commentErr) {
          console.error(
            '[handleRefuseCandidate] Не удалось сохранить комментарий:',
            commentErr
          );
        }
      }

      // Сначала создаём comment, затем обновляем карточку/ленту.
      emit('candidate-moved', fresh);
      emit('candidate-updated', fresh);
      emit('candidate-activity-refresh');
      popups.refuseCandidate.close();
    } catch (err) {
      console.error(
        '[handleRefuseCandidate] Ошибка при отказе кандидату:',
        err
      );
    }
  };

  const candidateActions = useCandidateActions(
    toRef(props, 'candidate'),
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

  const dropdownOptions = computed(() => {
    const c = props.candidate;
    const items: string[] = [];
    const profileUrl = getCandidateProfileExternalUrl(c);
    if (profileUrl) {
      const src = c?.source?.trim();
      items.push(src ? `Смотреть на ${src}` : 'Смотреть на сайте источника');
    }
    if (getCandidateResumePdfUrl(c)) {
      items.push('Скачать резюме');
    }
    items.push(
      'Переместить в вакансию',
      'Копировать в вакансию',
      ...(c?.vacancy_id ? ['Открепить от вакансии'] : []),
      'Отправить сообщение',
      'Удалить'
    );
    return items;
  });

  //  Подтверждение удаления кандидата
  const confirmDelete = async () => {
    try {
      await handleDelete();
    } catch (error) {}
  };

  //  Отправка письма кандидату и добавление карточки в ленту событий
  const sendEmail = async (data: Record<string, any>) => {
    const to = data?.to || props.candidate?.email;
    if (!to || !props.candidate?.id) return;
    const bodyStr = typeof data?.body === 'string' ? data.body : (data?.body?.value ?? '');
    try {
      await sendCandidateEmail(props.candidate.id, {
        subject: (data?.subject ?? '').trim(),
        body: bodyStr || '<p></p>',
        to,
        from_email: data?.from || undefined,
      });
      popups.mailToCandidate.close();
      emit('email-sent');
    } catch (e: any) {
      console.error('Ошибка отправки письма:', e);
      const msg = e?.data?.message || e?.message || 'Не удалось отправить письмо';
      alert(msg);
    }
  };

  const candidateActionsUI = useCandidateActionsUI(toRef(props, 'candidate'), {
    onDelete: () => handleDeleteCandidate(),
    onEmail: () => popups.mailToCandidate.open(),
    onMoveToVacancy: () => handleMoveToVacancy(),
    onRemoveFromVacancy: () => handleRemoveFromVacancy(),
    onCopyToVacancy: () => handleCopyToVacancy(),
    onRefuse: () => popups.refuseCandidate.open(),
    onSendSiteChat: () => emit('open-site-chat'),
  });

  const handleConfirmMove = async (vacancyId: number): Promise<boolean> => {
    try {
      const movedCandidate: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        phone: props.candidate.phone,
        vacancy_id: vacancyId,
      };
      const updated = await updateCandidate(movedCandidate);
      emit('candidate-moved', updated.data);
      return true;
    } catch (err) {
      console.error(
        '[handleConfirmMove] Ошибка при перемещении кандидата: ',
        err
      );
      return false;
    }
  };

  const handleAttachToVacancy = async (vacancyId: number) => {
    try {
      await attachCandidateToVacancy(props.candidate.id, vacancyId);
      emit('candidate-updated', props.candidate);
    } catch (err) {
      console.error('[handleAttachToVacancy] Ошибка:', err);
    }
  };

  const handleConfirmCopy = async (vacancyId: number): Promise<boolean> => {
    try {
      const candidateData = buildCandidateCopyPayload(props.candidate, vacancyId);
      const response = await createCandidate(candidateData);
      if (response?.data) {
        emit('candidate-updated', response.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[handleConfirmCopy] Ошибка при копировании:', err);
      return false;
    }
  };

  const handleTransferCandidateConfirm = async (vacancyId: number) => {
    let ok = false;
    if (transferPopupMode.value === 'move') {
      ok = await handleConfirmMove(vacancyId);
      if (ok) {
        showTransferSuccessToast('Кандидат успешно перемещён в выбранную вакансию');
      }
    } else {
      ok = await handleConfirmCopy(vacancyId);
      if (ok) {
        showTransferSuccessToast('Кандидат успешно скопирован в выбранную вакансию');
      }
    }
    if (ok) {
      handleTransferPopupClose();
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
      const updateData: CandidateUpdateRequest & { context_vacancy_id?: number } = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        phone: props.candidate.phone,
        stage: targetStage.id,
      };
      if (props.vacancy?.id) {
        updateData.context_vacancy_id = props.vacancy.id;
      }

      const updated = await updateCandidate(updateData);
      emit('candidate-moved', updated.data, targetStage.id);
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

        const fresh = response.data as Candidate;
        emit('candidate-moved', fresh);
        emit('candidate-updated', fresh);
        emit('candidate-activity-refresh');

        showTransferSuccessToast('Кандидат успешно откреплён от вакансии');

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
    () => props.vacancy,
    newVacancy => {
      if (newVacancy) {
        vacancy.value = newVacancy;
        vacancyName.value = newVacancy.name || 'Вакансия не определена';
      } else if (props.vacancy === null) {
        vacancy.value = null;
        vacancyName.value = 'Вакансия не определена';
      }
    },
    { immediate: true }
  );

  watch(
    () => props.candidate?.vacancy_id,
    async newVacancyId => {
      if (!props.vacancy && newVacancyId) {
        vacancy.value = await getVacancyById(newVacancyId.toString());
        vacancyName.value = vacancy.value
          ? vacancy.value?.name
          : 'Вакансия не определена';
      } else if (!props.vacancy && !newVacancyId) {
        vacancy.value = null;
        vacancyName.value = 'Вакансия не определена';
      }
    },
    { immediate: true }
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

  const candidateHeaderClipboardEmail = computed(() =>
    displayCandidateEmailOrEmpty(props.candidate.email)
  );

  defineExpose({
    openEmailPopup: () => popups.mailToCandidate.open(),
  });
</script>
<template>
  <div class="relative mb-15px rounded-fifteen bg-white p-25px pt-15px">
    <CandidateInfoHeader
      :isFunnel="isFunnel"
      :options="options"
      :selectedLabel="selectedLabel"
      :dropdownOptions="dropdownOptions"
      :show-refuse-button="!isRejectedStage"
      :candidate-email="candidateHeaderClipboardEmail"
      @select-item="candidateActionsUI.handleSelectItem"
      @add-comment="handleAddCommentClick"
      @new-task="handleNewTaskClick"
      @email="candidateActionsUI.handleClickEmail"
      @refuse="candidateActionsUI.handleClickRefuse"
      @update:selectedLabel="emit('update:selectedLabel', $event)"
      @confirm-transfer="handleConfirmTransfer"
    >
      <template v-if="!isFunnel" #left>
        <AttachToVacancyDropdown
          :candidate="candidate"
          @attach="handleAttachToVacancy"
        />
      </template>
    </CandidateInfoHeader>
    <div class="absolute left-0 top-[70px] h-[1px] w-full bg-athens-gray"></div>
    <CandidateInfoContent
      :candidate="candidate"
      :vacancy-name="vacancyName"
      @telegram="candidateActionsUI.handleClickTelegram"
      @messenger-max="candidateActionsUI.handleClickMessengerMax"
      @write-email="popups.mailToCandidate.open()"
      @candidate-updated="emit('candidate-updated', $event)"
    />
    <CandidateEmailPopup
      :isOpen="popups.mailToCandidate.isOpen"
      :candidate="candidate"
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
    <CandidateTransferToVacancyPopup
      :isOpen="isTransferPopupOpen"
      :candidate="candidate"
      :mode="transferPopupMode"
      @confirm="handleTransferCandidateConfirm"
      @close="handleTransferPopupClose"
    />
    <CandidateRemoveFromVacancyPopup
      v-if="candidate.vacancy_id"
      :isOpen="popups.removeFromVacancy.isOpen"
      :candidate="candidate"
      :vacancyName="vacancyName"
      @close="popups.removeFromVacancy.close"
      @confirm="handleConfirmRemove"
    />
    <CandidateRefusePopup
      :isOpen="popups.refuseCandidate.isOpen"
      @close="popups.refuseCandidate.close"
      @submit="handleRefuseCandidate"
    />
  </div>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="transferSuccessToast.show"
        class="fixed right-4 z-[10001] max-w-[min(90vw,420px)] rounded-fifteen bg-white px-6 py-3 text-center text-sm font-medium leading-150 text-space shadow-[0_0_15px_rgba(0,0,0,0.15)] sm:right-6"
        :style="joblyToastTopStyle"
        role="status"
      >
        {{ transferSuccessToast.text }}
      </div>
    </Transition>
  </Teleport>
  <Teleport to="body">
    <Transition name="fields-tab-toast-fade">
      <div
        v-if="candidateCardFieldsToast.show"
        class="fixed right-4 z-[10001] max-w-[min(90vw,420px)] rounded-fifteen px-6 py-3 text-center text-sm font-medium leading-150 text-space shadow-[0_0_15px_rgba(0,0,0,0.15)] sm:right-6"
        :style="joblyToastTopStyle"
        :class="
          candidateCardFieldsToast.variant === 'success'
            ? 'fields-tab-success-toast'
            : 'fields-tab-error-toast'
        "
        :role="
          candidateCardFieldsToast.variant === 'success' ? 'status' : 'alert'
        "
      >
        {{ candidateCardFieldsToast.text }}
      </div>
    </Transition>
  </Teleport>
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
  .fields-tab-error-toast {
    background-color: #fce7f3 !important;
    border: none !important;
    color: #212936 !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
  .fields-tab-success-toast {
    background-color: #ffffff !important;
    border: none !important;
    color: #212936 !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
  .fields-tab-toast-fade-enter-active,
  .fields-tab-toast-fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fields-tab-toast-fade-enter-from,
  .fields-tab-toast-fade-leave-to {
    opacity: 0;
  }
</style>
