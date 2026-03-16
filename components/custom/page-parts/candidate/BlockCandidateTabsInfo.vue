<script setup lang="ts">
  import { ref, watch, nextTick } from 'vue';
  import BtnTab from '~/components/custom/BtnTab.vue';
  import MyInputSecond from '~/components/custom/MyInputSecond.vue';
  import PhoneInputSecond from '~/components/custom/PhoneInputSecond.vue';
  import FileUpload from '~/components/custom/FileUpload.vue';
  import MinDropdownSecond from '~/components/custom/MinDropdownSecond.vue';
  import MoreQuestions from '~/components/custom/MoreQuestions.vue';
  import CandidateLog from '~/components/custom/page-parts/candidate/CandidateLog.vue';
  import ChatInput from '~/components/chat/ChatInput.vue';
  import CommentDeleteConfirmPopup from '~/components/custom/page-parts/candidate/popups/CommentDeleteConfirmPopup.vue';
  import { useForms } from '~/stores/forms';
  import { useChatStore } from '@/stores/chat';
  import {
    getCandidateConsiderations,
    createCandidateComment,
    createCandidateTask,
    completeCandidateTask,
    deleteCandidateComment,
    deleteCandidateTask,
    updateCandidateComment,
    updateCandidateTask,
  } from '@/src/api/candidates';

  import type { Candidate } from '@/types/candidates';
  import type { CandidateConsideration } from '@/types/candidates';
  // import type { TimelineGroup }

  const newName = ref('');
  const newEmail = ref('');
  const newPhone = ref('');
  const newHeader = ref('');
  const newLocation = ref('');
  const newEducation = ref('');
  const newExperience = ref('');
  const uploadPhoto = ref(null);
  const uploadResume = ref(null);
  const uploadLetter = ref(null);
  const newPosition = ref(null);
  const newCustomFirst = ref('');
  const newCustomSecond = ref('');
  const newCustomThird = ref('');
  const questions = ref([]);
  const answers = ref([]);

  const formsStore = useForms();

  const TAB_VALUES = ['resume', 'fields', 'chat', 'review'] as const;
  const STORAGE_KEY = 'candidate-card-tab';

  const activeTab = ref('resume'); // Начальный таб; восстанавливается из sessionStorage при монтировании

  const tabs = [
    { label: 'Резюме', value: 'resume' },
    { label: 'Поля', value: 'fields' },
    { label: 'Лента событий', value: 'chat', notification: '+1' },
    { label: 'Рассмотрения', value: 'review' },
  ];

  const positions = [
    {
      id: 'position_1',
      name: '1 разряд',
    },
    {
      id: 'position_2',
      name: '2 разряд',
    },
    {
      id: 'position_3',
      name: '3 разряд 3 разряд',
    },
    {
      id: 'position_4',
      name: '4 разряд',
    },
    {
      id: 'position_5',
      name: '5 разряд',
    },
  ];

  const dropdownOptions = ['Опция 1', 'Опция 2', 'Опция 3'];

  // function sanitazeCandidate(data) {
  //   if (!data) return null;

  //   let address = data?.area.name ? `г. ${data?.area.name}` : '';
  //   address += data?.metro?.name ? `, м. ${data.metro.name}` : '';

  //   return {
  //     id: data.id ?? null,
  //     created: data.created_at ?? null,
  //     age: data.age ?? null,
  //     firstName: data.first_name ?? '',
  //     surname: data.last_name ?? '',
  //     patronymic: data.patronymic ?? '',
  //     email: data.contact
  //       ? data.contact.find(function (value) {
  //           return value.kind === 'email';
  //         })?.contact_value
  //       : '',
  //     phone: data.contact
  //       ? data.contact.find(function (value) {
  //           return value.kind === 'phone';
  //         })?.contact_value
  //       : '',
  //     location: data?.area.name ?? '',
  //     vacancy: data.title ?? '',
  //     gender: data.gender.name ?? '',
  //     status: data.status ?? '',
  //     skills: data.skill_set ?? [],
  //     experience: data.experience ?? '',
  //     skype: data.skype ?? '',
  //     telegram: data.telegram ?? '',
  //     tags: data.tags ?? '',
  //     quickInfo: data.quickInfo ?? '',
  //     education: data.education ?? '',
  //     attachedFiles: data.attachments ?? [],
  //     links: [
  //       // 'www.testlink-null.com',
  //       // 'www.testlink-one.com',
  //       // 'www.testlink-second.com',
  //     ],
  //     header: data.title ?? '',
  //     locationFull: address,
  //     educationLevel: data.education.level.name ?? '',
  //     resumeDownloadLink: data.resumeDownloadLink ?? '',
  //     coverLetter: data.coverPath ?? '',
  //     comments: data.comments ?? [],
  //     timeline: data.timeline ?? [],
  //     customFields: data.customFields ?? null,
  //     customer: data.customer ?? null,
  //     icon: data.icon ?? null,
  //     photo: data.photo?.medium !== null ? data.photo?.medium : null,
  //   };
  // }

  const props = defineProps<{
    candidate: Candidate;
    /** Увеличивается при обновлении/перемещении кандидата — лог перезапрашивается */
    logRefreshTrigger?: number;
    /** ID вакансии для запроса событий в контексте вакансии (смена этапа и т.д.) */
    vacancyId?: number | null;
  }>();

  interface ChatMessage {
    format: string;
    message: string;
    attachments: File[];
    recipient: string;
  }

  const chatStore = useChatStore();
  const emit = defineEmits<{
    'comment-added': [];
  }>();

  const commentToDeleteEventId = ref<number | null>(null);
  const isCommentDeletePopupOpen = ref(false);
  const taskToDeleteEventId = ref<number | null>(null);
  const editingCommentId = ref<number | null>(null);
  const editingCommentText = ref('');
  const editingTaskId = ref<number | null>(null);
  const editingTaskText = ref('');
  const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null);
  const eventFeedRef = ref<HTMLElement | null>(null);

  const handleDeleteCommentRequest = (eventId: number) => {
    commentToDeleteEventId.value = eventId;
    isCommentDeletePopupOpen.value = true;
  };

  const handleCommentDeleteConfirm = async () => {
    if (props.candidate?.id && commentToDeleteEventId.value != null) {
      try {
        await deleteCandidateComment(props.candidate.id, commentToDeleteEventId.value);
        emit('comment-added');
      } catch (e) {
        console.error('Ошибка удаления комментария:', e);
      }
    }
    isCommentDeletePopupOpen.value = false;
    commentToDeleteEventId.value = null;
  };

  const handleCommentDeleteClose = () => {
    isCommentDeletePopupOpen.value = false;
    commentToDeleteEventId.value = null;
  };

  const handleEditComment = (eventId: number, content: string) => {
    editingCommentId.value = eventId;
    editingCommentText.value = content;
    chatStore.setCurrentFormat('comment');
  };

  const handleCancelEditComment = () => {
    editingCommentId.value = null;
    editingCommentText.value = '';
  };

  const handleDeleteTaskRequest = (eventId: number) => {
    taskToDeleteEventId.value = eventId;
  };

  const handleTaskDeleteConfirm = async () => {
    if (props.candidate?.id && taskToDeleteEventId.value != null) {
      try {
        await deleteCandidateTask(props.candidate.id, taskToDeleteEventId.value);
        emit('comment-added');
      } catch (e) {
        console.error('Ошибка удаления задачи:', e);
      }
    }
    taskToDeleteEventId.value = null;
  };

  const handleTaskDeleteClose = () => {
    taskToDeleteEventId.value = null;
  };

  const handleEditTask = (eventId: number, content: string) => {
    editingTaskId.value = eventId;
    editingTaskText.value = content;
    activeTab.value = 'chat';
    chatStore.setCurrentFormat('task');
  };

  const handleCancelEditTask = () => {
    editingTaskId.value = null;
    editingTaskText.value = '';
  };

  const handleCompleteTask = async (eventId: number) => {
    if (!props.candidate?.id) return;
    try {
      await completeCandidateTask(props.candidate.id, eventId);
      emit('comment-added');
    } catch (e) {
      console.error('Ошибка отметки задачи как выполненной:', e);
    }
  };

  const openCommentAndFocus = () => {
    activeTab.value = 'chat';
    chatStore.setCurrentFormat('comment');
    nextTick(() => {
      chatInputRef.value?.focusInput?.();
    });
  };

  const openTaskAndFocus = () => {
    activeTab.value = 'chat';
    chatStore.setCurrentFormat('task');
    nextTick(() => {
      nextTick(() => {
        chatInputRef.value?.focusTaskForm?.();
      });
    });
  };

  defineExpose({ openCommentAndFocus, openTaskAndFocus, eventFeedRef });

  const handleChatSend = async (
    messageData: ChatMessage & {
      editCommentId?: number;
      taskDate?: string;
      taskTime?: string;
      taskManagerName?: string;
    }
  ) => {
    if (!props.candidate?.id) return;

    if (messageData.format === 'task') {
      if (!messageData.message.trim()) return;
      try {
        const taskDate = messageData.taskDate ?? '';
        const taskTime = messageData.taskTime ?? '';
        const scheduledAt =
          taskDate && taskTime ? `${taskDate}T${taskTime}:00` : undefined;
        if (messageData.editTaskId != null) {
          await updateCandidateTask(props.candidate.id, messageData.editTaskId, {
            content: messageData.message,
            assignee_name: messageData.taskManagerName ?? null,
            scheduled_at: scheduledAt ?? null,
          });
          editingTaskId.value = null;
          editingTaskText.value = '';
        } else {
          await createCandidateTask(props.candidate.id, {
            content: messageData.message,
            assignee_name: messageData.taskManagerName ?? null,
            scheduled_at: scheduledAt ?? null,
          });
        }
        emit('comment-added');
      } catch (e) {
        console.error('Ошибка создания/обновления задачи:', e);
      }
      return;
    }

    if (messageData.format !== 'comment' || !messageData.message.trim()) {
      return;
    }
    try {
      if (messageData.editCommentId != null) {
        await updateCandidateComment(
          props.candidate.id,
          messageData.editCommentId,
          messageData.message
        );
        editingCommentId.value = null;
        editingCommentText.value = '';
      } else {
        await createCandidateComment(props.candidate.id, messageData.message);
      }
      emit('comment-added');
    } catch (e) {
      console.error('Ошибка сохранения комментария:', e);
    }
  };

  const considerations = ref<CandidateConsideration[]>([]);
  const considerationsLoading = ref(false);

  /** Состояние «Развернуть» по индексу записи опыта */
  const expandedExperience = ref<Record<number, boolean>>({});
  const toggleExperience = (idx: number) => {
    expandedExperience.value = {
      ...expandedExperience.value,
      [idx]: !expandedExperience.value[idx],
    };
  };

  const loadConsiderations = async () => {
    if (!props.candidate?.id) return;
    considerationsLoading.value = true;
    try {
      considerations.value = await getCandidateConsiderations(props.candidate.id);
    } catch (e) {
      console.error('Ошибка загрузки рассмотрений:', e);
      considerations.value = [];
    } finally {
      considerationsLoading.value = false;
    }
  };

  // Восстановление вкладки из sessionStorage при появлении candidate.id (в т.ч. после обновления страницы)
  watch(
    () => props.candidate?.id,
    (id) => {
      if (id == null) return;
      try {
        const saved = sessionStorage.getItem(`${STORAGE_KEY}-${id}`);
        if (saved && TAB_VALUES.includes(saved as (typeof TAB_VALUES)[number])) {
          activeTab.value = saved;
        }
      } catch {
        // ignore
      }
    },
    { immediate: true }
  );

  // Сохранение выбранной вкладки, чтобы не сбрасывалась при обновлении
  watch(
    () => [activeTab.value, props.candidate?.id],
    ([tab, id]) => {
      if (id != null && tab && TAB_VALUES.includes(tab as (typeof TAB_VALUES)[number])) {
        try {
          sessionStorage.setItem(`${STORAGE_KEY}-${id}`, tab as string);
        } catch {
          // ignore
        }
      }
    }
  );

  watch(
    () => [activeTab.value, props.candidate?.id, props.candidate],
    ([tab, id]) => {
      if (tab === 'review' && id) loadConsiderations();
    },
    { immediate: true }
  );
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-px shrink-0 rounded-t-fifteen bg-catskill px-25px py-15px">
      <BtnTab :tabs="tabs" v-model="activeTab" />
    </div>
    <div class="min-h-0 flex-1 flex flex-col">
      <div v-if="activeTab === 'resume'">
        <div class="mb-px bg-white p-25px pt-[27px]">
          <p class="mb-15px text-15px font-medium text-space">
            Сопроводительное письмо
          </p>
          <p class="text-sm leading-150 text-slate-custom">
            {{ candidate.coverLetter || 'Сопроводительное письмо не указано' }}
          </p>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Должность</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.quickInfo || '—' }}
          </p>
          <p class="mb-2 text-sm leading-150">
            <span class="text-slate-custom">Специализации: </span>
            <span class="text-space">{{ candidate.specializations || '—' }}</span>
          </p>
          <p class="mb-2 text-sm leading-150">
            <span class="text-slate-custom">Тип занятости: </span>
            <span class="text-space">{{ candidate.employment || '—' }}</span>
          </p>
          <p class="text-sm leading-150">
            <span class="text-slate-custom">Формат работы: </span>
            <span class="text-space">{{ candidate.workFormat || candidate.work_format || '—' }}</span>
          </p>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Опыт работы: {{ candidate.experience || '—' }}
          </p>
          <div
            v-for="(exp, idx) in candidate.experiences"
            :key="exp.id ?? idx"
            class="experience-entry border-b border-athens pb-5 pt-4 first:pt-0 last:border-b-0 last:pb-0"
          >
            <div class="flex gap-4">
              <div class="experience-entry-dates w-[120px] shrink-0">
                <p class="text-sm font-normal text-slate-custom">
                  {{ exp.dates || [exp.start_date, exp.end_date].filter(Boolean).join(' – ') || '—' }}
                </p>
                <p v-if="exp.duration" class="mt-0.5 text-xs font-normal text-slate-custom">
                  {{ exp.duration }}
                </p>
              </div>
              <div class="experience-entry-details min-w-0 flex-1">
                <p class="text-sm font-semibold text-space">
                  {{ exp.company || '—' }}
                </p>
                <p v-if="exp.location" class="mt-0.5 text-sm font-normal text-space">
                  {{ exp.location }}
                </p>
                <div v-if="exp.industry || exp.description" class="mt-0.5 flex items-center justify-between gap-2">
                  <p v-if="exp.industry" class="text-sm font-normal text-space">
                    {{ exp.industry }}
                  </p>
                  <button
                    v-if="exp.description"
                    type="button"
                    class="experience-toggle shrink-0 text-sm font-normal text-dodger hover:underline"
                    :class="{ 'ml-auto': !exp.industry }"
                    @click="toggleExperience(idx)"
                  >
                    {{ expandedExperience[idx] ? 'Свернуть' : 'Развернуть' }}
                  </button>
                </div>
                <p v-if="exp.job_title" class="mt-1.5 text-sm font-semibold text-space">
                  {{ exp.job_title }}
                </p>
                <p v-if="exp.role_dates" class="mt-0.5 text-sm font-normal text-space">
                  {{ exp.role_dates }}
                </p>
                <div
                  v-if="exp.description"
                  class="mt-1.5 text-sm font-normal leading-150 text-space"
                  :class="{ 'line-clamp-2': !expandedExperience[idx] }"
                >
                  {{ exp.description }}
                </div>
              </div>
            </div>
          </div>
          <p
            v-if="(!candidate.experiences || candidate.experiences.length === 0) && candidate.experience"
            class="text-sm leading-150 text-slate-custom"
          >
            {{ candidate.experience }}
          </p>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Краткие сведения
          </p>
          <p class="text-sm leading-150 text-slate-custom">
            {{ candidate.quickInfo }}
          </p>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Образование</p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Уровень</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.educationLevel || candidate.education || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Название заведения</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.educationInstitution || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Факультет</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.educationFaculty || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Специализация</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.educationSpecialization || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Год окончания</p>
          <p class="text-sm font-normal leading-150 text-space">
            {{ candidate.educationYear || '—' }}
          </p>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Курсы повышения квалификации
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Название</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.courseName || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Проводившая организация</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.courseOrganization || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Специализация</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.courseSpecialization || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Год окончания</p>
          <p class="text-sm font-normal leading-150 text-space">
            {{ candidate.courseYear || '—' }}
          </p>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Навыки</p>
          <div v-if="!candidate?.skills || candidate.skills.length === 0">
            <p class="text-sm font-normal text-slate-custom">
              Кандидат не указал навыки
            </p>
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="(skill, index) in candidate.skills"
              :key="(typeof skill === 'object' && skill?.id) ?? index"
              class="inline-flex items-center justify-center rounded-lg bg-athens-gray px-3 py-1.5 text-sm font-normal text-space"
            >
              {{ typeof skill === 'object' && skill && 'name' in skill ? skill.name : skill }}
            </span>
          </div>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Языки</p>
          <p class="mb-2 text-sm leading-150">
            <span class="text-slate-custom">Родной: </span>
            <span class="text-space">{{ candidate.nativeLanguage || '—' }}</span>
          </p>
          <p class="text-sm leading-150">
            <span class="text-slate-custom">Другие языки: </span>
            <span class="text-space">{{ candidate.otherLanguages || '—' }}</span>
          </p>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Обо мне
          </p>
          <p class="text-sm leading-150 text-slate-custom">
            {{ candidate.aboutMe || 'Не указано' }}
          </p>
        </div>
        <div class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Дополнительно</p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Желательное время в пути до работы</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.commuteTime || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Командировки</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.businessTrips || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Гражданство</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.citizenship || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Разрешение на работу</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.workPermit || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Наличие машины</p>
          <p class="mb-3 text-sm font-normal leading-150 text-space">
            {{ candidate.hasCar || '—' }}
          </p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Наличие прав</p>
          <p class="text-sm font-normal leading-150 text-space">
            {{ candidate.hasDriverLicense || '—' }}
          </p>
        </div>
      </div>
      <div v-if="activeTab === 'fields'">
        <div class="fields-tab-block mb-px bg-white p-25px pb-[37px] pl-30px">
          <div class="mb-22px flex items-center">
            <p class="mr-2.5 text-lg font-bold leading-normal text-space">
              Форма отклика
            </p>
            <span
              class="rounded-fifteen bg-feta px-2.5 py-[3.5px] text-xs font-normal text-white"
            >
              Заполнено
            </span>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Фамилия Имя Отчество
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              {{ [candidate.surname, candidate.firstname, candidate.patronymic].filter(Boolean).join(' ') || '—' }}
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Электронная почта
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              {{ candidate.email || '—' }}
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Телефон
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              {{ candidate.phone || '—' }}
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Заголовок
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              {{ candidate.quickInfo || candidate.resume || '—' }}
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Адрес проживания
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              {{ candidate.location ? `г. ${candidate.location}` : '—' }}
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Образование
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              {{ candidate.education || '—' }}
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Опыт работы
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              {{ candidate.experience || '—' }}
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Фото
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              <a
                v-if="candidate.imagePath"
                :href="candidate.imagePath"
                target="_blank"
                rel="noopener noreferrer"
                class="text-dodger underline hover:no-underline"
              >
                {{ candidate.imagePath.split('/').pop() || 'Файл' }}
              </a>
              <template v-else-if="candidate.attachments?.length">
                <a
                  v-for="att in candidate.attachments"
                  :key="att.id"
                  :href="att.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-dodger underline hover:no-underline"
                >
                  {{ att.link?.split('/').pop() || 'Файл' }}
                </a>
              </template>
              <span v-else>—</span>
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Загрузка резюме
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              <a
                v-if="candidate.resumePath"
                :href="candidate.resumePath"
                target="_blank"
                rel="noopener noreferrer"
                class="text-dodger underline hover:no-underline"
              >
                {{ candidate.resume || candidate.resumePath?.split('/').pop() || 'Резюме' }}
              </a>
              <span v-else>—</span>
            </p>
          </div>
          <div class="fields-row flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Сопроводительное письмо
            </p>
            <p class="text-right text-sm font-normal leading-150 text-space">
              <a
                v-if="candidate.coverPath"
                :href="candidate.coverPath"
                target="_blank"
                rel="noopener noreferrer"
                class="text-dodger underline hover:no-underline"
              >
                {{ candidate.coverPath?.split('/').pop() || 'Файл' }}
              </a>
              <span v-else>—</span>
            </p>
          </div>
        </div>
        <div class="fields-tab-block mb-px rounded-b-fifteen bg-white p-25px pl-30px">
          <div class="mb-22px flex items-center">
            <p class="mr-2.5 text-lg font-bold leading-normal text-space">
              Анкета
            </p>
            <span
              class="rounded-fifteen bg-serenade px-2.5 py-[3.5px] text-xs font-normal text-white"
            >
              Отправлено, ожидает заполнения
            </span>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Фамилия Имя Отчество
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Электронная почта
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Телефон
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Заголовок
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Адрес проживания
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Образование
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Опыт работы
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Фото
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
          <div class="fields-row mb-5 flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Загрузка резюме
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
          <div class="fields-row flex justify-between gap-2.5">
            <p class="min-w-[200px] shrink-0 text-sm font-normal text-space">
              Сопроводительное письмо
            </p>
            <p class="text-right text-sm font-normal leading-150 text-slate-custom">
              ...
            </p>
          </div>
        </div>
        <!-- Секция "Пользовательские поля" скрыта по макету
        <div class="bg-white p-25px pl-30px">
          <div class="mb-26px flex items-center">
            <p class="mr-2.5 text-lg font-bold leading-normal text-space">
              Пользовательские поля
            </p>
            <span
              class="h-fit rounded-fifteen bg-athens-gray px-2.5 py-[3.5px] text-xs font-normal"
            >
              Используется в системе
            </span>
          </div>
          <div class="flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Разряд</p>
            <MinDropdownSecond :options="positions" v-model="newPosition" />
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Раз</p>
            <MyInputSecond v-model="newCustomFirst" />
          </div>
          <div class="mb-0.5 flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Два</p>
            <MyInputSecond v-model="newCustomSecond" />
          </div>
          <div class="flex items-center gap-2.5">
            <p class="min-w-[240px] text-sm font-normal text-space">Три</p>
            <MyInputSecond v-model="newCustomThird" />
          </div>
          <div
                v-for="(q, idx) in questions"
                :key="q.id"
                class="flex items-center gap-2.5"
              >
                <div v-if="q.type === 'Поле для ввода в одну строку'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyInput
                    :placeholder="'Введите ваш ответ'"
                    v-model="answers[idx]"
                  />
                </div>
                <div v-if="q.type === 'Поле для ввода в несколько строк'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyTextarea
                    :maxHeight="100"
                    :placeholder="'Введите ваш ответ'"
                    v-model="answers[idx]"
                  />
                </div>
                <div v-if="q.type === 'Выпадающий список (один выбор)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyDropdown
                    :defaultValue="'Выберите вариант ответа'"
                    :options="q.options"
                    v-model="answers[idx]"
                  />
                </div>
                <div
                  v-if="q.type === 'Мультисписок (вопрос с вариантами ответа)'"
                >
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MultiSelect :options="q.options" v-model="answers[idx]" />
                </div>
                <div v-if="q.type === 'Время (выбор времени)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <ChooseTime v-model="answers[idx]" />
                </div>
                <div v-if="q.type === 'Дата (выбор даты)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <DropdownCalendarStatic
                    :is-open="isOpenDate"
                    @isOpen="isOpenCalendar"
                    v-model="answers[idx]"
                  />
                </div>
                <div v-if="q.type === 'Дата (срок)'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <div class="flex gap-x-15px">
                    <DropdownCalendarStatic
                      :is-open="isOpenDateFrom"
                      @isOpen="isOpenCalendarFrom"
                      v-model="answers[idx + '_from']"
                      :dateFrom="true"
                    />
                    <DropdownCalendarStatic
                      :is-open="isOpenDateTo"
                      @isOpen="isOpenCalendarTo"
                      v-model="answers[idx + '_to']"
                      :dateTo="true"
                    />
                  </div>
                </div>
                <div v-if="q.type === 'Ссылка'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <MyInput :placeholder="'https://'" v-model="answers[idx]" />
                </div>
                <div v-if="q.type === 'Адрес'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <geo-input v-model="answers[idx]" />
                </div>
                <div v-if="q.type === 'Файл'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <InputUpload v-model="answers[idx]" :minStyle="true" />
                </div>
                <div v-if="q.type === 'Чекбокс'">
                  <p class="mb-15px text-sm font-medium leading-150 text-space">
                    {{ q.title }}
                  </p>
                  <div class="[&>*:not(:last-child)]:mb-2.5">
                    <CheckboxGroup
                      :options="
                        q.options.map(opt => ({ label: opt, value: opt }))
                      "
                      v-model="answers[idx]"
                    />
                  </div>
                </div>
              </div>
          <button class="mt-25px flex items-center gap-x-5px">
            <MoreQuestions
              v-model:modelValue="questions"
              texButton="Добавить"
            />
          </button>
        </div>
        <div class="rounded-b-fifteen bg-white px-15px pb-25px">
          <div>
            <UiButton class="mr-15px" variant="semiaction" size="semiaction">
              Сохранить изменения
            </UiButton>
            <UiButton variant="back" size="back">Отмена</UiButton>
          </div>
        </div>
        -->
      </div>
      <div v-if="activeTab === 'chat'" ref="eventFeedRef" class="flex flex-col">
        <div class="h-[500px] overflow-hidden border border-athens-gray bg-athens-gray">
          <CandidateLog
            :candidate-id="candidate?.id"
            :refresh-trigger="props.logRefreshTrigger"
            :vacancy-id="props.vacancyId"
            @delete-request="handleDeleteCommentRequest"
            @edit-comment="handleEditComment"
            @delete-task-request="handleDeleteTaskRequest"
            @edit-task="handleEditTask"
            @complete-task="handleCompleteTask"
          />
        </div>
        <ChatInput
          ref="chatInputRef"
          :initial-recipient="`${candidate.firstname} ${candidate.surname}`"
          :initial-edit-text="editingCommentText"
          :edit-comment-id="editingCommentId"
          :initial-edit-task-text="editingTaskText"
          :edit-task-id="editingTaskId"
          @send="handleChatSend"
          @cancel-edit="handleCancelEditComment"
          @cancel-edit-task="handleCancelEditTask"
        />
      </div>
      <div v-if="activeTab === 'review'" class="considerations-block mb-px bg-white">
        <div class="considerations-table-wrap">
          <div class="considerations-table-header">
            <div class="cell-inner">Вакансия и отв. рекрутеры</div>
            <div class="cell-inner">Статус кандидата и обновление</div>
            <div class="cell-inner">Заказчик</div>
          </div>
          <div v-if="considerationsLoading" class="considerations-loading">
            <p class="text-sm text-slate-custom">Загрузка...</p>
          </div>
          <template v-else-if="considerations.length">
            <div
              v-for="(row, idx) in considerations"
              :key="row.vacancy_id"
              class="considerations-table-row"
              :class="{ 'considerations-table-row-last': idx === considerations.length - 1 }"
            >
              <div class="cell-inner flex flex-col gap-0.5">
                <NuxtLink
                  :to="{
                    path: `/vacancies/${row.vacancy_id}`,
                    query: {
                      candidate: String(candidate.id),
                      ...(row.stage_id != null ? { stage: String(row.stage_id) } : {}),
                    },
                  }"
                  class="text-sm font-medium text-dodger hover:underline"
                >
                  {{ row.vacancy_name }}
                </NuxtLink>
                <p v-if="row.recruiters?.length" class="text-xs text-bali">
                  {{ row.recruiters.join(', ') }}
                </p>
              </div>
              <div class="cell-inner flex flex-col gap-0.5">
                <span class="text-sm font-medium text-space">{{ row.stage_name || '—' }}</span>
                <span v-if="row.updated_at" class="text-xs text-bali">{{ row.updated_at }}</span>
              </div>
              <div class="cell-inner flex flex-col gap-0.5">
                <span class="text-sm font-medium text-space">
                  {{ row.customers?.[0] || '—' }}
                </span>
                <p
                  v-if="row.customers && row.customers.length > 1"
                  class="text-xs text-bali"
                >
                  {{ row.customers.slice(1).join(', ') }}
                </p>
              </div>
            </div>
          </template>
          <div v-else class="considerations-empty">
            <p class="text-sm text-slate-custom">Нет рассмотрений по вакансиям.</p>
          </div>
        </div>
      </div>
    </div>
    <CommentDeleteConfirmPopup
      :is-open="isCommentDeletePopupOpen"
      @close="handleCommentDeleteClose"
      @confirm="handleCommentDeleteConfirm"
    />
    <CommentDeleteConfirmPopup
      :is-open="taskToDeleteEventId != null"
      description="Задача будет удалена без возможности восстановления."
      @close="handleTaskDeleteClose"
      @confirm="handleTaskDeleteConfirm"
    />
  </div>
</template>

<style scoped>
/* Как на вкладке «Резюме»: полоса над таблицей — тот же 1px за счёт mb-px у табов, без отдельного border */
.considerations-block {
  border-radius: 0 0 15px 15px;
  overflow: hidden;
}
.considerations-table-wrap {
  display: grid;
  gap: 0;
  width: 100%;
  min-width: 0;
}
.considerations-table-header,
.considerations-table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 15px;
  padding: 20px 25px;
  align-items: center;
  border-bottom: 1px solid #e8eaef;
}
.considerations-table-header {
  background-color: #ffffff;
  font-weight: 500;
  font-size: 14px;
  color: #79869a;
  text-align: left;
}
.considerations-table-row {
  background-color: #ffffff;
}
.considerations-table-row-last {
  border-radius: 0 0 15px 15px;
  border-bottom: none;
}
.considerations-loading,
.considerations-empty {
  padding: 20px 25px;
  background-color: #ffffff;
  border-radius: 0 0 15px 15px;
  border-bottom: 1px solid #e8eaef;
}
.considerations-empty {
  border-bottom: none;
}
.text-bali {
  color: #79869a;
}
</style>
