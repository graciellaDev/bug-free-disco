<script setup lang="ts">
  import {
    ref,
    watch,
    nextTick,
    computed,
    onBeforeUnmount,
    provide,
  } from 'vue';
  import BtnTab from '~/components/custom/BtnTab.vue';
  import TextWithLinks from '~/components/custom/TextWithLinks.vue';
  import MyInputSecond from '~/components/custom/MyInputSecond.vue';
  import FileUpload from '~/components/custom/FileUpload.vue';
  import MinDropdownSecond from '~/components/custom/MinDropdownSecond.vue';
  import MoreQuestions from '~/components/custom/MoreQuestions.vue';
  import CandidateLog from '~/components/custom/page-parts/candidate/CandidateLog.vue';
  import ChatInput from '~/components/chat/ChatInput.vue';
  import CommentDeleteConfirmPopup from '~/components/custom/page-parts/candidate/popups/CommentDeleteConfirmPopup.vue';
  import CandidateEmailViewPopup from '~/components/custom/page-parts/candidate/popups/CandidateEmailViewPopup.vue';
  import CandidateAddCustomFieldPopup from '~/components/custom/page-parts/candidate/popups/CandidateAddCustomFieldPopup.vue';
  import CandidateEditCustomFieldPopup from '~/components/custom/page-parts/candidate/popups/CandidateEditCustomFieldPopup.vue';
  import CandidateLocalCustomFieldRow from '~/components/custom/page-parts/candidate/CandidateLocalCustomFieldRow.vue';
  import draggable from 'vuedraggable';
  import PlainSingleSelectDropdown from '~/components/custom/PlainSingleSelectDropdown.vue';
  import PlainMultiSelectDropdown from '~/components/custom/PlainMultiSelectDropdown.vue';
  import PlainInlineTextInput from '~/components/custom/PlainInlineTextInput.vue';
  import PlainDateSelectDropdown from '~/components/custom/PlainDateSelectDropdown.vue';
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
    updateCandidate,
    sendCandidateChatMessage,
  } from '@/src/api/candidates';
  import {
    getRejectionReasons,
    type RejectionReasonRow,
  } from '@/src/api/rejectionReasons';
  import { getExecutors, getVacancyTeamMembers } from '@/src/api/executors';

  import type {
    Candidate,
    CandidateUpdateRequest,
    CandidateConsideration,
    CandidateEvent,
    HhEducationPrimaryEntry,
    HhEducationAdditionalEntry,
    HhCertificateDisplayItem,
  } from '@/types/candidates';
  import type {
    LocalCandidateCustomField,
    CandidateCustomFieldEditorKind,
    LocalCustomFieldValuesRow,
  } from '@/types/candidateLocalCustomFields';
  import {
    mergeDefinitionWithValues,
    valuesRowFromFull,
  } from '@/types/candidateLocalCustomFields';
  import {
    buildMergedFieldsForCandidate,
    persistMergedCustomFields,
    pruneCustomFieldValuesForLocalId,
    loadDefinitions,
    saveDefinitions,
  } from '@/utils/accountCustomFieldsStorage';
  import {
    fetchAccountCustomFields,
    createAccountCustomField,
    updateAccountCustomField,
    reorderAccountCustomFields,
    deleteAccountCustomField,
  } from '@/src/api/accountCustomFields';
  import { hasDisplayableCandidateEmail } from '@/utils/candidateDisplayEmail';
  import { getCandidateChatPlatformFromSource } from '@/utils/candidateChatPlatform';
  import { formatCandidateSalaryLine } from '@/utils/candidateSalaryLine';
  import { formatCandidateExperienceForDisplay } from '@/utils/formatCandidateExperience';
  import { formatExperienceWorkPeriod } from '@/utils/formatExperienceWorkPeriod';
  import { useJoblyToastTopStyle } from '@/composables/useJoblyToastTopStyle';
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
    { label: 'Лента событий', value: 'chat' },
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

  /** Предустановленные значения поля «Источник» (свободный текст на бэке до 50 символов) */
  const CANDIDATE_SOURCE_OPTIONS: string[] = [
    'hh.ru',
    'Хабр Карьера',
    'SuperJob',
    'Avito Работа',
    'Работа.ru',
    'Зарплата.ru',
    'Telegram',
    'LinkedIn',
    'Сайт компании',
    'Рекомендация',
  ];

  /** Поле «Тип отклика» — одно значение из списка (как источник) */
  const CANDIDATE_RESPONSE_TYPE_OPTIONS: string[] = [
    'Не указан',
    'Прямой отклик',
    'Холодный поиск',
  ];

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
  const route = useRoute();
  const router = useRouter();

  const emit = defineEmits<{
    'comment-added': [];
    'open-email-popup': [];
    'candidate-updated': [candidate: Candidate];
    /** Перезагрузить ленту (системные события после сохранения пользовательских полей и т.п.) */
    'candidate-activity-refresh': [];
  }>();

  const localCandidateCustomFields = ref<LocalCandidateCustomField[]>([]);
  /** Не давать Sortable начинать drag с контролов (как в воронке настроек). */
  const LOCAL_CF_SORTABLE_FILTER = [
    'input',
    'textarea',
    'button',
    'select',
    'a[href]',
    '[contenteditable="true"]',
    'label',
    '[role="switch"]',
    '[role="menu"]',
    '[role="menuitem"]',
    '[role="listbox"]',
    '[role="option"]',
    '[role="combobox"]',
  ].join(', ');
  /** Не показывать тост при подгрузке из storage / смене кандидата */
  const isHydratingLocalCustomFields = ref(false);
  /** Схема полей загружена с API (аккаунт); иначе — только localStorage. */
  const serverAccountCustomFieldsReady = ref(false);
  let localCustomFieldsSaveToastTimer: ReturnType<typeof setTimeout> | null =
    null;
  let accountCustomFieldValuesSaveTimer: ReturnType<typeof setTimeout> | null =
    null;
  let hydrateLocalCustomFieldsSeq = 0;

  const isAddCustomFieldPopupOpen = ref(false);
  const editingLocalCustomField = ref<LocalCandidateCustomField | null>(
    null
  );
  /** Ручка DnD + карандаш; «Сохранить» в строке заголовка — выход из режима */
  const isLocalCustomFieldsLayoutEditMode = ref(false);
  const localCustomFieldPendingDelete = ref<LocalCandidateCustomField | null>(
    null
  );

  const localCustomFieldDeleteDescription = computed(() => {
    const f = localCustomFieldPendingDelete.value;
    const n = (f?.name ?? '').trim() || 'поле';
    return `Удалить общее поле «${n}»? Оно исчезнет у всех кандидатов, данные по этому полю у каждого кандидата будут безвозвратно потеряны.`;
  });

  function onLocalCustomFieldDeleteRequest(field: LocalCandidateCustomField) {
    localCustomFieldPendingDelete.value = field;
  }

  function closeLocalCustomFieldDeleteConfirm() {
    localCustomFieldPendingDelete.value = null;
  }

  function confirmLocalCustomFieldDelete() {
    const f = localCustomFieldPendingDelete.value;
    localCustomFieldPendingDelete.value = null;
    if (f) {
      onLocalCustomFieldDeleted(f.localId);
    }
  }

  function scheduleLocalCustomFieldsSavedToast() {
    if (!props.candidate?.id) return;
    if (isHydratingLocalCustomFields.value) return;
    if (localCustomFieldsSaveToastTimer) {
      clearTimeout(localCustomFieldsSaveToastTimer);
      localCustomFieldsSaveToastTimer = null;
    }
    localCustomFieldsSaveToastTimer = setTimeout(() => {
      localCustomFieldsSaveToastTimer = null;
      showFieldsTabToast('Поля сохранены', 'success');
    }, 450);
  }

  function parseAccountCustomFieldValueJson(
    raw?: string
  ): Partial<LocalCustomFieldValuesRow> {
    if (!raw || !raw.trim()) return {};
    try {
      const o = JSON.parse(raw) as unknown;
      if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
      return o as Partial<LocalCustomFieldValuesRow>;
    } catch {
      return {};
    }
  }

  function buildAccountCustomFieldValuesPayload(
    fields: LocalCandidateCustomField[]
  ): Record<string, string> {
    const m: Record<string, string> = {};
    for (const f of fields) {
      const id = Number(f.localId);
      if (!Number.isInteger(id) || id <= 0) continue;
      m[String(id)] = JSON.stringify(valuesRowFromFull(f));
    }
    return m;
  }

  function scheduleAccountCustomFieldValuesSave() {
    if (!props.candidate?.id || !serverAccountCustomFieldsReady.value) return;
    if (isHydratingLocalCustomFields.value) return;
    if (accountCustomFieldValuesSaveTimer) {
      clearTimeout(accountCustomFieldValuesSaveTimer);
      accountCustomFieldValuesSaveTimer = null;
    }
    accountCustomFieldValuesSaveTimer = setTimeout(() => {
      accountCustomFieldValuesSaveTimer = null;
      void flushAccountCustomFieldValuesSave();
    }, 550);
  }

  async function flushAccountCustomFieldValuesSave() {
    const id = props.candidate?.id;
    if (!id || !serverAccountCustomFieldsReady.value) return;
    const payload = buildAccountCustomFieldValuesPayload(
      localCandidateCustomFields.value
    );
    try {
      const res = await updateCandidate({
        id,
        account_custom_field_values: payload,
      } as CandidateUpdateRequest);
      emit('candidate-updated', res.data as Candidate);
      emit('candidate-activity-refresh');
    } catch (e) {
      console.error('Ошибка сохранения пользовательских полей:', e);
      showFieldsTabToast('Не удалось сохранить пользовательские поля', 'error');
    }
  }

  async function hydrateLocalCandidateCustomFields() {
    const id = props.candidate?.id;
    hydrateLocalCustomFieldsSeq += 1;
    const seq = hydrateLocalCustomFieldsSeq;
    isHydratingLocalCustomFields.value = true;
    serverAccountCustomFieldsReady.value = false;
    if (accountCustomFieldValuesSaveTimer) {
      clearTimeout(accountCustomFieldValuesSaveTimer);
      accountCustomFieldValuesSaveTimer = null;
    }
    if (!id) {
      localCandidateCustomFields.value = [];
      void nextTick(() => {
        isHydratingLocalCustomFields.value = false;
      });
      return;
    }
    try {
      let rows = await fetchAccountCustomFields();
      if (seq !== hydrateLocalCustomFieldsSeq) return;

      if (rows.length === 0 && typeof localStorage !== 'undefined') {
        const localDefs = loadDefinitions();
        if (localDefs.length > 0) {
          for (const d of localDefs) {
            await createAccountCustomField({
              name: d.name,
              field_kind: d.fieldKind,
              options: d.options,
            });
            if (seq !== hydrateLocalCustomFieldsSeq) return;
          }
          saveDefinitions([]);
          rows = await fetchAccountCustomFields();
          if (seq !== hydrateLocalCustomFieldsSeq) return;
        }
      } else if (rows.length > 0 && typeof localStorage !== 'undefined') {
        saveDefinitions([]);
      }

      serverAccountCustomFieldsReady.value = true;
      const valueMap = props.candidate?.accountCustomFieldValues ?? {};
      localCandidateCustomFields.value = rows.map(row =>
        mergeDefinitionWithValues(
          {
            localId: String(row.id),
            name: row.name,
            fieldKind: row.field_kind as CandidateCustomFieldEditorKind,
            options: Array.isArray(row.options) ? row.options : [],
          },
          parseAccountCustomFieldValueJson(valueMap[String(row.id)])
        )
      );
    } catch (e) {
      console.warn(
        'Пользовательские поля: API недоступен, используется localStorage',
        e
      );
      if (seq !== hydrateLocalCustomFieldsSeq) return;
      serverAccountCustomFieldsReady.value = false;
      try {
        localCandidateCustomFields.value = buildMergedFieldsForCandidate(id);
      } catch {
        localCandidateCustomFields.value = [];
      }
    } finally {
      if (seq === hydrateLocalCustomFieldsSeq) {
        void nextTick(() => {
          isHydratingLocalCustomFields.value = false;
        });
      }
    }
  }

  function persistLocalCandidateCustomFields() {
    const id = props.candidate?.id;
    if (!id || typeof localStorage === 'undefined') return;
    persistMergedCustomFields(id, localCandidateCustomFields.value);
  }

  watch(
    () => props.candidate?.id,
    () => {
      isLocalCustomFieldsLayoutEditMode.value = false;
      void hydrateLocalCandidateCustomFields();
    },
    { immediate: true }
  );

  /** Подтянуть значения с сервера, если карточка обновилась с тем же id (без повторной загрузки схемы). */
  watch(
    () =>
      props.candidate?.id != null
        ? JSON.stringify({
            id: props.candidate.id,
            values: props.candidate.accountCustomFieldValues ?? {},
          })
        : null,
    (cur, prev) => {
      if (cur == null || prev == null || cur === prev) return;
      let parsedCur: { id: number; values: Record<string, string> };
      let parsedPrev: { id: number; values: Record<string, string> };
      try {
        parsedCur = JSON.parse(cur) as { id: number; values: Record<string, string> };
        parsedPrev = JSON.parse(prev) as { id: number; values: Record<string, string> };
      } catch {
        return;
      }
      if (parsedCur.id !== parsedPrev.id) return;
      if (!serverAccountCustomFieldsReady.value) return;
      if (isHydratingLocalCustomFields.value) return;
      const valueMap = parsedCur.values;
      const next = localCandidateCustomFields.value.map(f => {
        const fid = Number(f.localId);
        if (!Number.isInteger(fid) || fid <= 0) return f;
        const raw = valueMap[String(fid)];
        if (raw === undefined) return f;
        return mergeDefinitionWithValues(
          {
            localId: f.localId,
            name: f.name,
            fieldKind: f.fieldKind,
            options: f.options,
          },
          parseAccountCustomFieldValueJson(raw)
        );
      });
      isHydratingLocalCustomFields.value = true;
      localCandidateCustomFields.value = next;
      void nextTick(() => {
        isHydratingLocalCustomFields.value = false;
      });
    }
  );

  watch(
    localCandidateCustomFields,
    () => {
      if (isHydratingLocalCustomFields.value) return;
      if (serverAccountCustomFieldsReady.value) {
        scheduleAccountCustomFieldValuesSave();
      } else {
        persistLocalCandidateCustomFields();
      }
      scheduleLocalCustomFieldsSavedToast();
    },
    { deep: true }
  );

  async function onLocalCustomFieldAdded(field: LocalCandidateCustomField) {
    if (serverAccountCustomFieldsReady.value) {
      try {
        const row = await createAccountCustomField({
          name: field.name,
          field_kind: field.fieldKind,
          options: field.options,
        });
        const def = {
          localId: String(row.id),
          name: row.name,
          fieldKind: row.field_kind as CandidateCustomFieldEditorKind,
          options: Array.isArray(row.options) ? row.options : [],
        };
        localCandidateCustomFields.value = [
          ...localCandidateCustomFields.value,
          mergeDefinitionWithValues(def, valuesRowFromFull(field)),
        ];
      } catch (e) {
        console.error(e);
        showFieldsTabToast('Не удалось создать поле', 'error');
      }
      return;
    }
    localCandidateCustomFields.value = [
      ...localCandidateCustomFields.value,
      field,
    ];
  }

  function openEditLocalCustomField(field: LocalCandidateCustomField) {
    editingLocalCustomField.value = field;
  }

  function closeEditLocalCustomField() {
    editingLocalCustomField.value = null;
  }

  async function onLocalCustomFieldUpdated(field: LocalCandidateCustomField) {
    const i = localCandidateCustomFields.value.findIndex(
      f => f.localId === field.localId
    );
    if (i < 0) return;
    if (serverAccountCustomFieldsReady.value) {
      const fid = Number(field.localId);
      if (Number.isInteger(fid) && fid > 0) {
        try {
          await updateAccountCustomField(fid, {
            name: field.name,
            field_kind: field.fieldKind,
            options: field.options,
          });
        } catch (e) {
          console.error(e);
          showFieldsTabToast('Не удалось сохранить поле', 'error');
          return;
        }
      }
    }
    const next = [...localCandidateCustomFields.value];
    next[i] = field;
    localCandidateCustomFields.value = next;
  }

  async function onLocalCustomFieldDeleted(localId: string) {
    if (editingLocalCustomField.value?.localId === localId) {
      editingLocalCustomField.value = null;
    }
    if (serverAccountCustomFieldsReady.value) {
      const fid = Number(localId);
      if (Number.isInteger(fid) && fid > 0) {
        try {
          await deleteAccountCustomField(fid);
        } catch (e) {
          console.error(e);
          showFieldsTabToast('Не удалось удалить поле', 'error');
          return;
        }
      }
    } else {
      pruneCustomFieldValuesForLocalId(localId);
    }
    localCandidateCustomFields.value =
      localCandidateCustomFields.value.filter(f => f.localId !== localId);
    if (localCandidateCustomFields.value.length === 0) {
      isLocalCustomFieldsLayoutEditMode.value = false;
    }
  }

  async function finishLocalCustomFieldsLayoutEdit() {
    if (!serverAccountCustomFieldsReady.value) {
      persistLocalCandidateCustomFields();
    } else {
      const ids = localCandidateCustomFields.value
        .map(f => Number(f.localId))
        .filter(n => Number.isInteger(n) && n > 0);
      if (
        ids.length > 0 &&
        ids.length === localCandidateCustomFields.value.length
      ) {
        try {
          await reorderAccountCustomFields(ids);
        } catch (e) {
          console.error(e);
          showFieldsTabToast('Не удалось сохранить порядок полей', 'error');
        }
      }
      await flushAccountCustomFieldValuesSave();
    }
    if (localCustomFieldsSaveToastTimer) {
      clearTimeout(localCustomFieldsSaveToastTimer);
      localCustomFieldsSaveToastTimer = null;
    }
    if (props.candidate?.id) {
      showFieldsTabToast('Поля сохранены', 'success');
    }
    isLocalCustomFieldsLayoutEditMode.value = false;
  }

  /** Блок «Пользовательские поля»: подпись и значение из API `customFields` */
  const candidateCustomFieldRows = computed(() => {
    const raw = props.candidate?.customFields;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const rows: { id: number; label: string; text: string }[] = [];
    for (const item of raw) {
      const o = item as Record<string, unknown>;
      const id = Number(o.id);
      if (!Number.isFinite(id)) continue;
      const nameFromObj =
        typeof o.name === 'string' ? o.name.trim() : '';
      const pivot = o.pivot as Record<string, unknown> | undefined;
      const nameFromPivot =
        pivot && typeof pivot.name === 'string'
          ? String(pivot.name).trim()
          : '';
      const label = nameFromObj || nameFromPivot || `Поле ${id}`;
      const valueTop = typeof o.value === 'string' ? o.value.trim() : '';
      const valuePivot =
        pivot && typeof pivot.value === 'string'
          ? String(pivot.value).trim()
          : '';
      const text = valueTop || valuePivot || '—';
      rows.push({ id, label, text });
    }
    return rows;
  });

  const hasAnyCustomFields = computed(() => {
    if (serverAccountCustomFieldsReady.value) {
      return localCandidateCustomFields.value.length > 0;
    }
    return (
      candidateCustomFieldRows.value.length > 0 ||
      localCandidateCustomFields.value.length > 0
    );
  });

  const sourceFieldSaving = ref(false);
  const responseTypeFieldSaving = ref(false);

  const rejectionReasonList = ref<RejectionReasonRow[]>([]);
  const rejectionReasonOptions = ref<string[]>([]);
  const rejectionReasonsLoading = ref(false);
  const rejectionReasonFieldSaving = ref(false);

  async function loadRejectionReasonsOptions() {
    rejectionReasonsLoading.value = true;
    try {
      const res = await getRejectionReasons();
      const reasons = res.data?.reasons ?? [];
      rejectionReasonList.value = reasons;
      rejectionReasonOptions.value = [...reasons]
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order ||
            a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' })
        )
        .map(r => r.name.trim())
        .filter(Boolean);
    } catch (e) {
      console.error('Не удалось загрузить причины отказа:', e);
      rejectionReasonList.value = [];
      rejectionReasonOptions.value = [];
    } finally {
      rejectionReasonsLoading.value = false;
    }
  }

  async function handleRejectionReasonFieldUpdate(selectedName: string) {
    if (!props.candidate?.id) return;
    const trimmed = selectedName.trim();
    const curId = props.candidate.rejection_reason_id ?? null;

    let nextId: number | null = null;
    if (!trimmed) {
      if (curId === null) return;
      nextId = null;
    } else {
      const row = rejectionReasonList.value.find(
        r => r.name.trim() === trimmed
      );
      nextId = row?.id ?? null;
      if (nextId == null) {
        showFieldsTabToast('Выберите причину из списка', 'error');
        return;
      }
    }

    if (nextId === curId) return;

    rejectionReasonFieldSaving.value = true;
    try {
      const payload: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        ...(props.candidate.phone != null &&
        String(props.candidate.phone).trim() !== ''
          ? { phone: props.candidate.phone }
          : {}),
        source: props.candidate.source ?? undefined,
        response_type: props.candidate.response_type ?? undefined,
        rejection_reason_id: nextId,
      };
      const res = await updateCandidate(payload);
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения причины отказа:', e);
      showFieldsTabToast('Не удалось сохранить причину отказа', 'error');
    } finally {
      rejectionReasonFieldSaving.value = false;
    }
  }

  async function handleSourceFieldUpdate(next: string) {
    if (!props.candidate?.id) return;
    const trimmed = next.trim();
    const current = (props.candidate.source || '').trim();
    if (trimmed === current) return;

    sourceFieldSaving.value = true;
    try {
      const payload: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        ...(props.candidate.phone != null && String(props.candidate.phone).trim() !== ''
          ? { phone: props.candidate.phone }
          : {}),
        source: trimmed ? trimmed : null,
      };
      const res = await updateCandidate(payload);
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения источника:', e);
      alert('Не удалось сохранить источник');
    } finally {
      sourceFieldSaving.value = false;
    }
  }

  async function handleResponseTypeFieldUpdate(next: string) {
    if (!props.candidate?.id) return;
    const normalized =
      next.trim() === '' || next.trim() === 'Не указан' ? '' : next.trim();
    const current = (props.candidate.response_type || '').trim();
    const currentNorm =
      current === '' || current === 'Не указан' ? '' : current;
    const nextNorm = normalized;
    if (nextNorm === currentNorm) return;

    responseTypeFieldSaving.value = true;
    try {
      const payload: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        ...(props.candidate.phone != null && String(props.candidate.phone).trim() !== ''
          ? { phone: props.candidate.phone }
          : {}),
        source: props.candidate.source,
        response_type: nextNorm ? nextNorm : null,
      };
      const res = await updateCandidate(payload);
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения типа отклика:', e);
      alert('Не удалось сохранить тип отклика');
    } finally {
      responseTypeFieldSaving.value = false;
    }
  }

  const surnameEdit = ref('');
  const firstnameEdit = ref('');
  const patronymicEdit = ref('');
  const nameFieldsSaving = ref(false);

  /** Как в CandidateController `$validUpdateFields['email']` */
  const CANDIDATE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /** Как в CandidateController `$validUpdateFields['phone']` */
  const PHONE_API_REGEX = /^\+7\d{10}$/;

  /** Цифры для «Желаемая зарплата»: salaryFrom, иначе salaryTo (без пробелов/₽) */
  function candidateSalaryDigitsFromCard(c: Candidate): string {
    const from = c.salaryFrom;
    const to = c.salaryTo;
    const hasFrom = typeof from === 'number' && !Number.isNaN(from);
    const hasTo = typeof to === 'number' && !Number.isNaN(to);
    if (!hasFrom && !hasTo) return '';
    if (hasFrom) return String(Math.trunc(from as number));
    return String(Math.trunc(to as number));
  }

  function parsePhoneInputToApi(input: string): string | null {
    const d = input.replace(/\D/g, '');
    if (d.length === 0) return null;
    let n = d;
    if (n.startsWith('8')) n = '7' + n.slice(1);
    if (n.length === 10) n = '7' + n;
    if (n.length === 11 && n.startsWith('7')) return `+${n}`;
    return null;
  }

  function normalizeCandidatePhoneForCompare(raw: string | null | undefined): string {
    if (raw == null || String(raw).trim() === '') return '';
    const t = String(raw).trim();
    if (PHONE_API_REGEX.test(t)) return t;
    const parsed = parsePhoneInputToApi(t);
    return parsed && PHONE_API_REGEX.test(parsed) ? parsed : '';
  }

  /** Сообщение для строки: +7 (XXX) XXX-XX-XX; иначе как пришло с API */
  function formatCandidatePhoneDisplay(raw: string | null | undefined): string {
    if (raw == null || String(raw).trim() === '') return '';
    const t = String(raw).trim();
    if (PHONE_API_REGEX.test(t)) {
      const digits = t.slice(2);
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
    }
    return t;
  }

  function emailHasAtAndDot(raw: string): boolean {
    const t = raw.trim();
    return t.includes('@') && t.includes('.');
  }

  function normalizeBirthDateForInput(raw: unknown): string {
    if (raw == null) return '';
    const s = String(raw).trim();
    if (!s) return '';
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const ru = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
    if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
    return '';
  }

  const emailEdit = ref('');
  const emailFieldSaving = ref(false);
  /** Красный пунктир: нет @ или точки при попытке сохранить (blur) */
  const emailLineError = ref(false);

  const birthDateEdit = ref('');
  const birthDateFieldSaving = ref(false);

  const phoneEdit = ref('');
  const phoneFieldSaving = ref(false);
  const phoneLineError = ref(false);

  const salaryDesiredEdit = ref('');
  const salaryFieldSaving = ref(false);

  /** Город (из резюме / поле `location` в API) */
  const cityEdit = ref('');
  const cityFieldSaving = ref(false);

  /** Гражданство (из резюме / поле `citizenship` в API) */
  const citizenshipEdit = ref('');
  const citizenshipFieldSaving = ref(false);

  const recruiterOptions = ref<{ id: number; name: string }[]>([]);
  const recruitersListLoading = ref(false);
  const recruiterFieldSaving = ref(false);
  const recruiterIdsEdit = ref<number[]>([]);

  async function loadRecruiterOptions() {
    recruitersListLoading.value = true;
    try {
      const [executorRows, teamRows] = await Promise.all([
        getExecutors(),
        props.vacancyId ? getVacancyTeamMembers(props.vacancyId) : Promise.resolve([]),
      ]);
      const byId = new Map<number, { id: number; name: string }>();
      for (const r of [...executorRows, ...teamRows]) {
        const id = Number(r.id);
        if (!Number.isFinite(id) || id <= 0) continue;
        const name = (r.name ?? '').trim();
        if (!name) continue;
        byId.set(id, { id, name });
      }
      recruiterOptions.value = [...byId.values()].sort((a, b) =>
        a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' })
      );
    } catch (e) {
      console.error('Не удалось загрузить список рекрутеров:', e);
      recruiterOptions.value = [];
    } finally {
      recruitersListLoading.value = false;
    }
  }

  async function onRecruitersModelUpdate(nextIds: number[]) {
    recruiterIdsEdit.value = nextIds;
    await handleRecruitersFieldUpdate(nextIds);
  }

  async function handleRecruitersFieldUpdate(nextIds: number[]) {
    if (!props.candidate?.id) return;
    const cur = [...(props.candidate.recruiter_ids ?? [])].sort((a, b) => a - b);
    const n = [...nextIds].sort((a, b) => a - b);
    if (JSON.stringify(cur) === JSON.stringify(n)) return;

    recruiterFieldSaving.value = true;
    try {
      const payload: CandidateUpdateRequest = {
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        ...(props.candidate.phone != null &&
        String(props.candidate.phone).trim() !== ''
          ? { phone: props.candidate.phone }
          : {}),
        source: props.candidate.source ?? undefined,
        response_type: props.candidate.response_type ?? undefined,
        recruiter_ids: n,
      };
      const res = await updateCandidate(payload);
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения рекрутеров:', e);
      showFieldsTabToast('Не удалось сохранить рекрутеров', 'error');
      recruiterIdsEdit.value = Array.isArray(props.candidate.recruiter_ids)
        ? [...props.candidate.recruiter_ids]
        : [];
    } finally {
      recruiterFieldSaving.value = false;
    }
  }

  /** Тост в том же стиле, что уведомление об успешном перемещении кандидата (BlockCandidateInfo) */
  const fieldsTabToast = ref<{
    show: boolean;
    text: string;
    variant: 'success' | 'error';
  }>({
    show: false,
    text: '',
    variant: 'error',
  });
  let fieldsTabToastTimer: ReturnType<typeof setTimeout> | null = null;

  const fieldsTabToastFixedStyle = useJoblyToastTopStyle(
    computed(() => fieldsTabToast.value.show)
  );

  function showFieldsTabToast(
    message: string,
    variant: 'success' | 'error' = 'error'
  ) {
    fieldsTabToast.value = { show: true, text: message, variant };
    if (fieldsTabToastTimer) clearTimeout(fieldsTabToastTimer);
    fieldsTabToastTimer = setTimeout(() => {
      fieldsTabToast.value = { show: false, text: '', variant: 'error' };
      fieldsTabToastTimer = null;
    }, 4000);
  }

  provide('showFieldsTabToast', showFieldsTabToast);

  watch(
    () => activeTab.value,
    tab => {
      if (tab === 'fields') {
        void loadRejectionReasonsOptions();
      }
    },
    { immediate: true }
  );

  watch(
    () => props.candidate,
    c => {
      if (!c) return;
      surnameEdit.value = c.surname ?? '';
      firstnameEdit.value = c.firstname ?? '';
      patronymicEdit.value = c.patronymic ?? '';
      emailEdit.value = c.email ?? '';
      emailLineError.value = false;
      birthDateEdit.value = normalizeBirthDateForInput(c.birth_date);
      phoneEdit.value = formatCandidatePhoneDisplay(c.phone);
      phoneLineError.value = false;
      salaryDesiredEdit.value = candidateSalaryDigitsFromCard(c);
      cityEdit.value = c.location ?? '';
      citizenshipEdit.value = c.citizenship ?? '';
      recruiterIdsEdit.value = Array.isArray(c.recruiter_ids)
        ? [...c.recruiter_ids]
        : [];
    },
    { immediate: true, deep: false }
  );

  watch(
    () => activeTab.value === 'fields',
    isFields => {
      if (isFields) {
        void loadRecruiterOptions();
      }
    },
    { immediate: true }
  );

  watch(emailEdit, v => {
    if (emailLineError.value && emailHasAtAndDot(v)) {
      emailLineError.value = false;
    }
  });

  watch(phoneEdit, v => {
    if (!phoneLineError.value) return;
    const p = parsePhoneInputToApi(v);
    if (p && PHONE_API_REGEX.test(p)) {
      phoneLineError.value = false;
    }
  });

  async function flushNameFieldsFromBlur() {
    if (!props.candidate?.id) return;
    const f = firstnameEdit.value.trim();
    const s = surnameEdit.value.trim();
    const p = patronymicEdit.value.trim();
    const cf = (props.candidate.firstname || '').trim();
    const cs = (props.candidate.surname || '').trim();
    const cp = (props.candidate.patronymic || '').trim();
    if (f === cf && s === cs && p === cp) return;
    if (f.length < 3) {
      alert('Имя должно быть не короче 3 символов');
      firstnameEdit.value = props.candidate.firstname ?? '';
      return;
    }
    nameFieldsSaving.value = true;
    try {
      const res = await updateCandidate({
        id: props.candidate.id,
        firstname: f,
        email: props.candidate.email,
        phone: props.candidate.phone,
        surname: s || null,
        patronymic: p || null,
      });
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения ФИО:', e);
      alert('Не удалось сохранить ФИО');
      surnameEdit.value = props.candidate.surname ?? '';
      firstnameEdit.value = props.candidate.firstname ?? '';
      patronymicEdit.value = props.candidate.patronymic ?? '';
    } finally {
      nameFieldsSaving.value = false;
    }
  }

  async function flushEmailFromBlur() {
    if (!props.candidate?.id) return;
    const next = emailEdit.value.trim();
    const current = (props.candidate.email ?? '').trim();
    if (next === current) {
      emailLineError.value = false;
      return;
    }

    if (next.length === 0) {
      emailLineError.value = false;
      emailFieldSaving.value = true;
      try {
        const res = await updateCandidate({
          id: props.candidate.id,
          firstname: props.candidate.firstname,
          email: null,
          phone: props.candidate.phone,
          surname: props.candidate.surname,
          patronymic: props.candidate.patronymic ?? undefined,
        });
        emit('candidate-updated', res.data);
        showFieldsTabToast('Поля сохранены', 'success');
      } catch (e) {
        console.error('Ошибка сохранения e-mail:', e);
        showFieldsTabToast('Не удалось сохранить e-mail');
        emailEdit.value = props.candidate.email ?? '';
      } finally {
        emailFieldSaving.value = false;
      }
      return;
    }
    if (!emailHasAtAndDot(next)) {
      emailLineError.value = true;
      showFieldsTabToast('Введите корректный e-mail (например, user@example.ru)');
      return;
    }
    if (next.length > 50 || !CANDIDATE_EMAIL_REGEX.test(next)) {
      emailLineError.value = false;
      showFieldsTabToast('Введите корректный e-mail (например, user@example.ru)');
      emailEdit.value = props.candidate.email ?? '';
      return;
    }

    emailLineError.value = false;
    emailFieldSaving.value = true;
    try {
      const res = await updateCandidate({
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: next,
        phone: props.candidate.phone,
        surname: props.candidate.surname,
        patronymic: props.candidate.patronymic ?? undefined,
      });
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения e-mail:', e);
      showFieldsTabToast('Не удалось сохранить e-mail');
      emailEdit.value = props.candidate.email ?? '';
    } finally {
      emailFieldSaving.value = false;
    }
  }

  async function flushPhoneFromBlur() {
    if (!props.candidate?.id) return;
    const currentCanon = normalizeCandidatePhoneForCompare(props.candidate.phone);
    const trimmed = phoneEdit.value.trim();
    const nextCanon = parsePhoneInputToApi(phoneEdit.value);

    if (trimmed === '' && !currentCanon) {
      phoneLineError.value = false;
      return;
    }

    if (nextCanon && nextCanon === currentCanon) {
      phoneLineError.value = false;
      phoneEdit.value = formatCandidatePhoneDisplay(props.candidate.phone);
      return;
    }

    if (trimmed === '') {
      if (currentCanon) {
        phoneLineError.value = false;
        showFieldsTabToast('Телефон не может быть пустым');
        phoneEdit.value = formatCandidatePhoneDisplay(props.candidate.phone);
      }
      return;
    }

    if (!nextCanon || !PHONE_API_REGEX.test(nextCanon)) {
      phoneLineError.value = true;
      showFieldsTabToast(
        'Введите номер: +7 и 10 цифр (например, +7 (926) 304-46-43)'
      );
      phoneEdit.value = formatCandidatePhoneDisplay(props.candidate.phone);
      return;
    }

    phoneLineError.value = false;
    phoneFieldSaving.value = true;
    try {
      const res = await updateCandidate({
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        phone: nextCanon,
        surname: props.candidate.surname,
        patronymic: props.candidate.patronymic ?? undefined,
      });
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения телефона:', e);
      showFieldsTabToast('Не удалось сохранить телефон');
      phoneEdit.value = formatCandidatePhoneDisplay(props.candidate.phone);
    } finally {
      phoneFieldSaving.value = false;
    }
  }

  async function flushCityFromBlur() {
    if (!props.candidate?.id) return;
    const trimmed = cityEdit.value.trim();
    const current = (props.candidate.location ?? '').trim();
    if (trimmed === current) {
      cityEdit.value = props.candidate.location ?? '';
      return;
    }
    if (trimmed.length > 100) {
      showFieldsTabToast('Город не длиннее 100 символов', 'error');
      cityEdit.value = props.candidate.location ?? '';
      return;
    }

    cityFieldSaving.value = true;
    try {
      const res = await updateCandidate({
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        ...(props.candidate.phone != null &&
        String(props.candidate.phone).trim() !== ''
          ? { phone: props.candidate.phone }
          : {}),
        surname: props.candidate.surname,
        patronymic: props.candidate.patronymic ?? undefined,
        location: trimmed === '' ? null : trimmed,
      });
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения города:', e);
      showFieldsTabToast('Не удалось сохранить город', 'error');
      cityEdit.value = props.candidate.location ?? '';
    } finally {
      cityFieldSaving.value = false;
    }
  }

  async function flushCitizenshipFromBlur() {
    if (!props.candidate?.id) return;
    const trimmed = citizenshipEdit.value.trim();
    const current = (props.candidate.citizenship ?? '').trim();
    if (trimmed === current) {
      citizenshipEdit.value = props.candidate.citizenship ?? '';
      return;
    }
    if (trimmed.length > 255) {
      showFieldsTabToast('Гражданство не длиннее 255 символов', 'error');
      citizenshipEdit.value = props.candidate.citizenship ?? '';
      return;
    }

    citizenshipFieldSaving.value = true;
    try {
      const res = await updateCandidate({
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        ...(props.candidate.phone != null &&
        String(props.candidate.phone).trim() !== ''
          ? { phone: props.candidate.phone }
          : {}),
        surname: props.candidate.surname,
        patronymic: props.candidate.patronymic ?? undefined,
        citizenship: trimmed === '' ? null : trimmed,
      });
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения гражданства:', e);
      showFieldsTabToast('Не удалось сохранить гражданство', 'error');
      citizenshipEdit.value = props.candidate.citizenship ?? '';
    } finally {
      citizenshipFieldSaving.value = false;
    }
  }

  async function handleBirthDateFieldUpdate(nextRaw: string) {
    if (!props.candidate?.id) return;
    const next = normalizeBirthDateForInput(nextRaw);
    birthDateEdit.value = next;
    const current = normalizeBirthDateForInput(props.candidate.birth_date);
    if (next === current) return;

    birthDateFieldSaving.value = true;
    try {
      const res = await updateCandidate({
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        ...(props.candidate.phone != null &&
        String(props.candidate.phone).trim() !== ''
          ? { phone: props.candidate.phone }
          : {}),
        birth_date: next || null,
      });
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения даты рождения:', e);
      showFieldsTabToast('Не удалось сохранить дату рождения', 'error');
      birthDateEdit.value = normalizeBirthDateForInput(props.candidate.birth_date);
    } finally {
      birthDateFieldSaving.value = false;
    }
  }

  async function flushSalaryDesiredFromBlur() {
    if (!props.candidate?.id) return;
    const digits = salaryDesiredEdit.value.replace(/\D/g, '').slice(0, 12);
    const cf = props.candidate.salaryFrom ?? null;
    const ct = props.candidate.salaryTo ?? null;

    let nextFrom: number | null;
    let nextTo: number | null;

    if (digits === '') {
      nextFrom = null;
      nextTo = null;
      if (cf == null && ct == null) return;
    } else {
      const n = Number.parseInt(digits, 10);
      if (!Number.isFinite(n) || n < 0) {
        showFieldsTabToast('Введите корректную сумму', 'error');
        salaryDesiredEdit.value = candidateSalaryDigitsFromCard(props.candidate);
        return;
      }
      nextFrom = n;
      nextTo = null;
      const hadRange = cf != null && ct != null && ct !== cf;
      if (hadRange && n === cf) {
        return;
      }
    }

    if ((cf ?? null) === (nextFrom ?? null) && (ct ?? null) === (nextTo ?? null)) {
      return;
    }

    salaryFieldSaving.value = true;
    try {
      const res = await updateCandidate({
        id: props.candidate.id,
        firstname: props.candidate.firstname,
        email: props.candidate.email,
        ...(props.candidate.phone != null &&
        String(props.candidate.phone).trim() !== ''
          ? { phone: props.candidate.phone }
          : {}),
        surname: props.candidate.surname,
        patronymic: props.candidate.patronymic ?? undefined,
        salaryFrom: nextFrom,
        salaryTo: nextTo,
      });
      emit('candidate-updated', res.data);
      showFieldsTabToast('Поля сохранены', 'success');
    } catch (e) {
      console.error('Ошибка сохранения зарплаты:', e);
      showFieldsTabToast('Не удалось сохранить зарплату', 'error');
      salaryDesiredEdit.value = candidateSalaryDigitsFromCard(props.candidate);
    } finally {
      salaryFieldSaving.value = false;
    }
  }

  const commentToDeleteEventId = ref<number | null>(null);
  const isCommentDeletePopupOpen = ref(false);
  const taskToDeleteEventId = ref<number | null>(null);
  const isEmailViewOpen = ref(false);
  const selectedEmailEvent = ref<CandidateEvent | null>(null);
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

  const handleOpenEmailCard = (event: CandidateEvent) => {
    if (event?.type !== 'email') return;
    selectedEmailEvent.value = event;
    isEmailViewOpen.value = true;
  };

  const handleEmailViewClose = () => {
    isEmailViewOpen.value = false;
    selectedEmailEvent.value = null;
  };

  const handleEmailViewReply = () => {
    isEmailViewOpen.value = false;
    selectedEmailEvent.value = null;
    emit('open-email-popup');
  };

  const openCommentAndFocus = () => {
    activeTab.value = 'chat';
    chatStore.setCurrentFormat('comment');
    nextTick(() => {
      chatInputRef.value?.focusInput?.();
    });
  };

  /** Вкладка «Лента событий» + режим «Чат на сайте» и фокус поля (как «Отправить сообщение» в шапке). */
  const openChatAndFocus = () => {
    activeTab.value = 'chat';
    chatStore.setCurrentFormat('chat');
    nextTick(() => {
      nextTick(() => {
        chatInputRef.value?.focusInput?.();
      });
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

  /** Проскроллить ленту так, чтобы блок ввода (задача/комментарий) был виден */
  const scrollEventFeedToInput = () => {
    nextTick(() => {
      const el = chatInputRef.value?.$el;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    });
  };

  defineExpose({
    openCommentAndFocus,
    openChatAndFocus,
    openTaskAndFocus,
    eventFeedRef,
  });

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

    if (messageData.format === 'chat') {
      if (!messageData.message.trim()) return;
      const chatPlatform = getCandidateChatPlatformFromSource(props.candidate?.source);
      if (!chatPlatform) {
        console.warn(
          'Чат с площадкой: укажите источник (hh.ru, SuperJob, Авито, Rabota.ru) у кандидата.'
        );
        return;
      }
      try {
        await sendCandidateChatMessage(props.candidate.id, {
          content: messageData.message,
          vacancy_id: props.vacancyId ?? null,
          platform: chatPlatform,
        });
        emit('comment-added');
      } catch (e) {
        console.error('Ошибка отправки сообщения в чат:', e);
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

  /** Текст описания не помещается в 2 строки (line-clamp) — нужна кнопка */
  const experienceDescOverflow = ref<Record<number, boolean>>({});
  const experienceDescEls = new Map<number, HTMLElement>();
  const experienceDescObservers = new Map<number, ResizeObserver>();

  function measureExpDescriptionOverflow(idx: number) {
    const el = experienceDescEls.get(idx);
    if (!el) return;
    if (expandedExperience.value[idx]) return;
    const hasMore = el.scrollHeight > el.clientHeight + 2;
    if (experienceDescOverflow.value[idx] === hasMore) return;
    experienceDescOverflow.value[idx] = hasMore;
  }

  function setExperienceDescriptionEl(el: unknown, idx: number) {
    if (!(el instanceof HTMLElement)) {
      if (experienceDescEls.has(idx)) {
        experienceDescObservers.get(idx)?.disconnect();
        experienceDescObservers.delete(idx);
        experienceDescEls.delete(idx);
        if (idx in experienceDescOverflow.value) {
          delete experienceDescOverflow.value[idx];
        }
      }
      return;
    }

    if (experienceDescEls.get(idx) === el) return;

    experienceDescObservers.get(idx)?.disconnect();
    experienceDescEls.set(idx, el);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        measureExpDescriptionOverflow(idx);
      });
      ro.observe(el);
      experienceDescObservers.set(idx, ro);
    }
    nextTick(() => measureExpDescriptionOverflow(idx));
  }

  watch(expandedExperience, () => {
    nextTick(() => {
      experienceDescEls.forEach((_, idx) => measureExpDescriptionOverflow(idx));
    });
  });

  watch(
    () => props.candidate?.id,
    (newId, oldId) => {
      if (newId === oldId) return;
      expandedExperience.value = {};
      experienceDescOverflow.value = {};
      experienceDescObservers.forEach((o) => o.disconnect());
      experienceDescObservers.clear();
      experienceDescEls.clear();
    }
  );

  onBeforeUnmount(() => {
    if (fieldsTabToastTimer) clearTimeout(fieldsTabToastTimer);
    if (localCustomFieldsSaveToastTimer) {
      clearTimeout(localCustomFieldsSaveToastTimer);
      localCustomFieldsSaveToastTimer = null;
    }
    experienceDescObservers.forEach((o) => o.disconnect());
    experienceDescObservers.clear();
    experienceDescEls.clear();
  });

  const experienceDisplay = computed(() => {
    const f = formatCandidateExperienceForDisplay(props.candidate.experience);
    return f !== '' ? f : '—';
  });

  const toggleExperience = (idx: number) => {
    expandedExperience.value = {
      ...expandedExperience.value,
      [idx]: !expandedExperience.value[idx],
    };
  };

  let considerationsAbort: AbortController | null = null;

  const loadConsiderations = async (ac: AbortController) => {
    if (!props.candidate?.id) return;
    considerationsLoading.value = true;
    try {
      considerations.value = await getCandidateConsiderations(props.candidate.id, {
        signal: ac.signal,
      });
    } catch (e: unknown) {
      if (ac.signal.aborted) return;
      console.error('Ошибка загрузки рассмотрений:', e);
      considerations.value = [];
    } finally {
      if (considerationsAbort === ac) {
        considerationsLoading.value = false;
      }
    }
  };

  // Восстановление вкладки из sessionStorage при появлении candidate.id (в т.ч. после обновления страницы)
  watch(
    () => props.candidate?.id,
    (id) => {
      if (id == null) return;

      /** Переход из планировщика задач: ?tab=chat&editTask=&taskContent= */
      const rawEdit = route.query.editTask;
      const editStr =
        typeof rawEdit === 'string' ? rawEdit : Array.isArray(rawEdit) ? rawEdit[0] : '';
      const eventId = editStr !== '' ? Number(editStr) : NaN;
      const tabQ = route.query.tab;
      const tabIsChatOrOmitted =
        tabQ === 'chat' || tabQ === undefined || tabQ === null || tabQ === '';
      if (tabIsChatOrOmitted && Number.isFinite(eventId) && eventId > 0) {
        const rawC = route.query.taskContent;
        const enc =
          typeof rawC === 'string' ? rawC : Array.isArray(rawC) ? rawC[0] : '';
        let content = '';
        if (enc) {
          try {
            content = decodeURIComponent(enc);
          } catch {
            content = '';
          }
        }
        activeTab.value = 'chat';
        nextTick(() => {
          handleEditTask(eventId, content);
          nextTick(() => {
            chatInputRef.value?.focusTaskForm?.();
          });
          const q = { ...route.query } as Record<string, string | string[] | undefined>;
          delete q.editTask;
          delete q.taskContent;
          delete q.tab;
          void router.replace({ path: route.path, query: q });
        });
        return;
      }

      try {
        const saved = sessionStorage.getItem(`${STORAGE_KEY}-${id}`);
        if (saved && TAB_VALUES.includes(saved as (typeof TAB_VALUES)[number])) {
          // Не открываем тяжёлые вкладки автоматически при переключении кандидата:
          // именно это вызывало зависание на «тяжёлых» HH-профилях.
          activeTab.value =
            saved === 'chat' || saved === 'review' ? 'resume' : saved;
        } else {
          activeTab.value = 'resume';
        }
      } catch {
        // ignore
        activeTab.value = 'resume';
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
    () => [activeTab.value, props.candidate?.id] as const,
    ([tab, id]) => {
      considerationsAbort?.abort();
      considerationsAbort = null;
      if (tab === 'review' && id) {
        const ac = new AbortController();
        considerationsAbort = ac;
        void loadConsiderations(ac);
      } else {
        considerationsLoading.value = false;
      }
    },
    { immediate: true }
  );

  /** Карточка должности: показываем, если есть данные (тип занятости в условие не входит) */
  const hasResumePositionBlock = computed(() => {
    const c = props.candidate;
    if (!c) return false;
    const nonEmpty = (v: unknown) =>
      typeof v === 'string' && v.trim().length > 0;
    const hasSalary = formatCandidateSalaryLine(c) !== '';
    return !!(
      nonEmpty(c.quickInfo) ||
      nonEmpty(c.specializations) ||
      nonEmpty(c.employment) ||
      nonEmpty(c.workFormat) ||
      nonEmpty(c.work_format) ||
      hasSalary
    );
  });

  const resumeSalaryLine = computed(() =>
    formatCandidateSalaryLine(props.candidate)
  );

  const hhSkillSetItems = computed(() => {
    const raw = (props.candidate as { skill_set?: unknown }).skill_set;
    if (Array.isArray(raw)) {
      return raw
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
    }
    if (typeof raw !== 'string') return [];
    const text = raw.trim();
    if (!text) return [];

    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean);
        }
      } catch {
        // ignore parse errors and fallback to separators below
      }
    }

    return text
      .split(/[\n,;]+/u)
      .map((item) => item.trim())
      .filter(Boolean);
  });

  type HhLanguageItem = {
    name: string;
    level?: string;
    isNative: boolean;
  };

  function splitLanguageCsv(raw: string): string[] {
    return raw
      .split(/[,;\n]+/u)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseLanguageLabel(raw: string): { name: string; level?: string } {
    const text = raw.trim();
    if (!text) return { name: '' };
    const paren = /^(.*?)\s*\((.*?)\)\s*$/u.exec(text);
    if (paren) {
      return {
        name: paren[1].trim(),
        level: paren[2].trim() || undefined,
      };
    }
    const dash = /^(.*?)\s*[-–—]\s*(.*?)$/u.exec(text);
    if (dash) {
      return {
        name: dash[1].trim(),
        level: dash[2].trim() || undefined,
      };
    }
    return { name: text };
  }

  const hhLanguageItems = computed(() => {
    const raw = (props.candidate as { language?: unknown }).language;
    if (raw == null) {
      const fallback: HhLanguageItem[] = [];
      const nativeRaw = props.candidate.nativeLanguage?.trim() || '';
      const otherRaw = props.candidate.otherLanguages?.trim() || '';
      if (nativeRaw) {
        splitLanguageCsv(nativeRaw).forEach((name) => {
          fallback.push({ name, isNative: true });
        });
      }
      if (otherRaw) {
        splitLanguageCsv(otherRaw).forEach((line) => {
          const parsed = parseLanguageLabel(line);
          if (parsed.name) {
            fallback.push({
              name: parsed.name,
              level: parsed.level,
              isNative: false,
            });
          }
        });
      }
      return fallback;
    }

    let source: unknown = raw;
    if (typeof source === 'string') {
      const text = source.trim();
      if (!text) return [] as HhLanguageItem[];
      if (text.startsWith('[') || text.startsWith('{')) {
        try {
          source = JSON.parse(text);
        } catch {
          return [{ name: text, isNative: false }];
        }
      } else {
        return text
          .split(/[\n,;]+/u)
          .map((item) => item.trim())
          .filter(Boolean)
          .map((name) => ({ name, isNative: false }));
      }
    }

    if (!Array.isArray(source)) return [] as HhLanguageItem[];

    const parsed = source
      .map((item) => {
        if (typeof item === 'string') {
          const name = item.trim();
          if (!name) return null;
          return { name, isNative: false };
        }
        if (!item || typeof item !== 'object') return null;
        const obj = item as Record<string, unknown>;
        const name =
          (typeof obj.name === 'string' && obj.name.trim()) ||
          (typeof obj.title === 'string' && obj.title.trim()) ||
          '';
        if (!name) return null;
        const levelObj =
          obj.level && typeof obj.level === 'object'
            ? (obj.level as Record<string, unknown>)
            : null;
        const level =
          (typeof levelObj?.name === 'string' && levelObj.name.trim()) ||
          (typeof obj.level === 'string' && obj.level.trim()) ||
          undefined;
        const isNative =
          obj.native === true ||
          obj.is_native === true ||
          (typeof level === 'string' && /родн/i.test(level));
        return { name, level, isNative };
      })
      .filter((item): item is HhLanguageItem => item !== null);

    if (parsed.length > 0) return parsed;

    const fallback: HhLanguageItem[] = [];
    const nativeRaw = props.candidate.nativeLanguage?.trim() || '';
    const otherRaw = props.candidate.otherLanguages?.trim() || '';
    if (nativeRaw) {
      splitLanguageCsv(nativeRaw).forEach((name) => {
        fallback.push({ name, isNative: true });
      });
    }
    if (otherRaw) {
      splitLanguageCsv(otherRaw).forEach((line) => {
        const parsedLine = parseLanguageLabel(line);
        if (parsedLine.name) {
          fallback.push({
            name: parsedLine.name,
            level: parsedLine.level,
            isNative: false,
          });
        }
      });
    }

    return fallback;
  });

  const hhNativeLanguages = computed(() =>
    hhLanguageItems.value.filter((item) => item.isNative)
  );

  const hhOtherLanguages = computed(() =>
    hhLanguageItems.value
      .filter((item) => !item.isNative)
      .sort((a, b) => {
        const levelOrder = (level?: string) => {
          const s = (level || '').trim().toUpperCase();
          if (!s) return 0;
          if (s.includes('C2')) return 62;
          if (s.includes('C1')) return 61;
          if (s.includes('B2')) return 52;
          if (s.includes('B1')) return 51;
          if (s.includes('A2')) return 42;
          if (s.includes('A1')) return 41;
          if (s.includes('ADVANCED')) return 60;
          if (s.includes('UPPER-INTERMEDIATE')) return 52;
          if (s.includes('INTERMEDIATE')) return 51;
          if (s.includes('ELEMENTARY')) return 41;
          if (s.includes('НАЧАЛЬНЫЙ')) return 41;
          if (s.includes('СРЕДНИЙ')) return 51;
          if (s.includes('ПРОДВИНУТ')) return 60;
          return 1;
        };
        const byLevel = levelOrder(b.level) - levelOrder(a.level);
        if (byLevel !== 0) return byLevel;
        return a.name.localeCompare(b.name, 'ru');
      })
  );

  type HhRecommendationItem = {
    name: string;
    position?: string;
    company?: string;
  };

  function parseHhRecommendationItem(item: unknown): HhRecommendationItem | null {
    if (!item || typeof item !== 'object') return null;
    const obj = item as Record<string, unknown>;

    const name =
      (typeof obj.name === 'string' && obj.name.trim()) ||
      (typeof obj.person_name === 'string' && obj.person_name.trim()) ||
      (typeof obj.fio === 'string' && obj.fio.trim()) ||
      '';
    if (!name) return null;

    const position =
      (typeof obj.position === 'string' && obj.position.trim()) ||
      (typeof obj.post === 'string' && obj.post.trim()) ||
      (typeof obj.role === 'string' && obj.role.trim()) ||
      undefined;

    const company =
      (typeof obj.organization === 'string' && obj.organization.trim()) ||
      (typeof obj.company === 'string' && obj.company.trim()) ||
      undefined;

    return { name, position, company };
  }

  const hhRecommendations = computed(() => {
    const raw = (props.candidate as { recommendation?: unknown }).recommendation;
    if (raw == null) return [] as HhRecommendationItem[];

    let source: unknown = raw;
    if (typeof source === 'string') {
      const text = source.trim();
      if (!text) return [] as HhRecommendationItem[];
      if (text.startsWith('[') || text.startsWith('{')) {
        try {
          source = JSON.parse(text);
        } catch {
          return [{ name: text }];
        }
      } else {
        return text
          .split(/\n{2,}|[\n;]+/u)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => ({ name: line }));
      }
    }

    if (!Array.isArray(source)) {
      const single = parseHhRecommendationItem(source);
      return single ? [single] : [];
    }

    return source
      .map((item) => parseHhRecommendationItem(item))
      .filter((item): item is HhRecommendationItem => item !== null);
  });

  function parseHhEducationPrimaryEntry(item: unknown): HhEducationPrimaryEntry | null {
    if (!item || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name : '';
    const organization = typeof o.organization === 'string' ? o.organization : '';
    const result = typeof o.result === 'string' ? o.result : '';
    const year = typeof o.year === 'string' ? o.year : '';
    const city = typeof o.city === 'string' ? o.city : '';
    const level = typeof o.level === 'string' ? o.level : '';
    if (
      !name.trim() &&
      !organization.trim() &&
      !result.trim() &&
      !year.trim() &&
      !city.trim()
    ) {
      return null;
    }
    return { name, organization, result, year, city, level };
  }

  const resumeEducationLevelLabel = computed(() => {
    const c = props.candidate as Record<string, unknown>;
    const v = c.education_level_id ?? c.educationLevel;
    return typeof v === 'string' && v.trim() !== '' ? v.trim() : '';
  });

  const hhEducationPrimaryEntries = computed((): HhEducationPrimaryEntry[] => {
    const raw = (props.candidate as { education_primary?: unknown }).education_primary;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw
      .map((item) => parseHhEducationPrimaryEntry(item))
      .filter((e): e is HhEducationPrimaryEntry => e !== null);
  });

  const legacyEducationFallback = computed(() => {
    if (hhEducationPrimaryEntries.value.length > 0) return '';
    const ed = props.candidate.education;
    return typeof ed === 'string' && ed.trim() !== '' ? ed.trim() : '';
  });

  function formatHhEducationLine1(entry: HhEducationPrimaryEntry): string {
    const name = entry.name.trim();
    const org = (entry.organization || '').trim();
    const city = (entry.city || '').trim();
    const institution = name || org;
    const parts: string[] = [];
    if (institution) parts.push(institution);
    if (city) parts.push(city);
    return parts.length ? parts.join(', ') : '—';
  }

  function formatHhEducationLine2(entry: HhEducationPrimaryEntry, globalLevel: string): string {
    const name = entry.name.trim();
    const org = (entry.organization || '').trim();
    const parts: string[] = [];
    if (name && org) parts.push(org);
    const res = (entry.result || '').trim();
    if (res) parts.push(res);
    const y = (entry.year || '').trim();
    if (y) parts.push(y);
    const lvl = (entry.level || '').trim() || globalLevel.trim();
    if (lvl) parts.push(lvl);
    return parts.join(' · ');
  }

  const hasResumeEducationBlock = computed(
    () =>
      !!resumeEducationLevelLabel.value ||
      hhEducationPrimaryEntries.value.length > 0 ||
      !!legacyEducationFallback.value
  );

  function parseHhEducationAdditionalItem(item: unknown): HhEducationAdditionalEntry | null {
    if (!item || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name : '';
    const organization = typeof o.organization === 'string' ? o.organization : '';
    const result = typeof o.result === 'string' ? o.result : '';
    const year =
      typeof o.year === 'string'
        ? o.year
        : typeof o.year === 'number'
          ? String(o.year)
          : '';
    const idRaw = o.id;
    const id =
      typeof idRaw === 'string'
        ? idRaw
        : typeof idRaw === 'number'
          ? String(idRaw)
          : '';
    if (
      !name.trim() &&
      !organization.trim() &&
      !result.trim() &&
      !year.trim()
    ) {
      return null;
    }
    return {
      ...(id.trim() ? { id: id.trim() } : {}),
      name,
      organization,
      result,
      year,
    };
  }

  const hhEducationAdditionalEntries = computed((): HhEducationAdditionalEntry[] => {
    const raw = (props.candidate as { education_additional?: unknown }).education_additional;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw
      .map((row) => parseHhEducationAdditionalItem(row))
      .filter((e): e is HhEducationAdditionalEntry => e !== null);
  });

  const hasCourseQualificationBlock = computed(() => {
    if (hhEducationAdditionalEntries.value.length > 0) return true;
    const c = props.candidate;
    return [c.courseName, c.courseOrganization, c.courseSpecialization, c.courseYear].some(
      (v) => typeof v === 'string' && v.trim() !== ''
    );
  });

  function formatHhCourseTitleLine(entry: HhEducationAdditionalEntry): string {
    const name = (entry.name || '').trim();
    const org = (entry.organization || '').trim();
    const res = (entry.result || '').trim();
    return name || res || org || '—';
  }

  function formatHhCourseSecondaryLine(entry: HhEducationAdditionalEntry): string {
    const title = formatHhCourseTitleLine(entry);
    const org = (entry.organization || '').trim();
    const res = (entry.result || '').trim();
    const y = (entry.year || '').trim();
    const parts: string[] = [];
    if (org && org !== title) parts.push(org);
    if (res && res !== title) parts.push(res);
    if (y) parts.push(y);
    return parts.join(' · ');
  }

  /** Первая строка: название курса; иначе специализация или организация (как на HH). */
  const courseQualificationTitle = computed(() => {
    const c = props.candidate;
    const name = (c.courseName || '').trim();
    if (name) return name;
    const spec = (c.courseSpecialization || '').trim();
    if (spec) return spec;
    const org = (c.courseOrganization || '').trim();
    if (org) return org;
    return '';
  });

  /** Вторая строка: организация · квалификация · год (без дубля с первой строкой). */
  const courseQualificationDetails = computed(() => {
    const c = props.candidate;
    const title = courseQualificationTitle.value;
    const org = (c.courseOrganization || '').trim();
    const spec = (c.courseSpecialization || '').trim();
    const year = (c.courseYear || '').trim();
    const parts: string[] = [];
    if (org && org !== title) parts.push(org);
    if (spec && spec !== title) parts.push(spec);
    if (year) parts.push(year);
    return parts.length > 0 ? parts.join(' · ') : '';
  });

  function extractHhCertificateUrl(o: Record<string, unknown>): string {
    for (const k of ['url', 'alternate_url', 'link']) {
      const v = o[k];
      if (typeof v === 'string' && /^https?:\/\//i.test(v.trim())) return v.trim();
    }
    const file = o.file;
    if (file && typeof file === 'object') {
      const u = (file as Record<string, unknown>).url;
      if (typeof u === 'string' && /^https?:\/\//i.test(u.trim())) return u.trim();
    }
    const actions = o.actions;
    if (actions && typeof actions === 'object') {
      const download = (actions as Record<string, unknown>).download;
      if (download && typeof download === 'object') {
        for (const val of Object.values(download as Record<string, unknown>)) {
          if (val && typeof val === 'object' && 'url' in val) {
            const u2 = (val as { url?: unknown }).url;
            if (typeof u2 === 'string' && /^https?:\/\//i.test(u2.trim())) return u2.trim();
          }
        }
      }
    }
    return '';
  }

  function parseHhCertificateItem(item: unknown): HhCertificateDisplayItem | null {
    if (typeof item === 'string') {
      const t = item.trim();
      return t ? { title: t } : null;
    }
    if (!item || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;

    let title = '';
    for (const k of ['title', 'name', 'description', 'result']) {
      const v = o[k];
      if (typeof v === 'string' && v.trim() !== '') {
        title = v.trim();
        break;
      }
    }
    if (!title && typeof o.organization === 'string' && o.organization.trim() !== '') {
      title = o.organization.trim();
    }
    if (!title && o.type && typeof o.type === 'object') {
      const n = (o.type as { name?: unknown }).name;
      if (typeof n === 'string' && n.trim() !== '') title = n.trim();
    }

    let year = '';
    if (typeof o.year === 'number') year = String(o.year);
    else if (typeof o.year === 'string' && o.year.trim() !== '') year = o.year.trim();
    if (!year && typeof o.achieved_at === 'string') {
      const m = /^(\d{4})/.exec(o.achieved_at.trim());
      if (m) year = m[1];
    }
    if (!year && typeof o.date === 'string') {
      const m = /^(\d{4})/.exec(o.date.trim());
      if (m) year = m[1];
    }

    const url = extractHhCertificateUrl(o);
    if (!title && url) title = 'Сертификат';
    if (!title) return null;

    return {
      title,
      ...(year ? { year } : {}),
      ...(url ? { url } : {}),
    };
  }

  const hhCertificateEntries = computed((): HhCertificateDisplayItem[] => {
    const raw = props.candidate.certificate;
    let list: unknown = raw;
    if (typeof raw === 'string') {
      const t = raw.trim();
      if (!t) return [];
      if (t.startsWith('[') || t.startsWith('{')) {
        try {
          list = JSON.parse(t);
        } catch {
          return [{ title: t }];
        }
      } else {
        return [{ title: t }];
      }
    }
    if (list == null) return [];
    if (typeof list === 'object' && !Array.isArray(list)) {
      const items = (list as Record<string, unknown>).items;
      if (Array.isArray(items)) {
        list = items;
      }
    }
    if (!Array.isArray(list)) {
      if (typeof list === 'object' && list !== null) {
        const one = parseHhCertificateItem(list);
        return one ? [one] : [];
      }
      return [];
    }
    return list
      .map((row) => parseHhCertificateItem(row))
      .filter((x): x is HhCertificateDisplayItem => x !== null);
  });

  function pickCandidateStr(c: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
      const v = c[key];
      if (typeof v === 'string' && v.trim() !== '') return v.trim();
    }
    return '';
  }

  function normalizeDriverLicenseTypes(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item === 'string' && item.trim() !== '') {
        out.push(item.trim());
        continue;
      }
      if (item && typeof item === 'object' && 'name' in item) {
        const n = (item as { name?: unknown }).name;
        if (typeof n === 'string' && n.trim() !== '') out.push(n.trim());
      }
    }
    return [...new Set(out)];
  }

  /** HH: has_vehicle + driver_license_types → одна строка как на hh.ru */
  function formatCandidateDrivingLine(c: Record<string, unknown>): string {
    const vehicle = pickCandidateStr(c, 'has_vehicle', 'hasCar');
    const licenses = normalizeDriverLicenseTypes(c.driver_license_types);
    const chunks: string[] = [];
    if (vehicle === 'Да') {
      chunks.push('Есть своя машина');
    } else if (vehicle === 'Нет') {
      chunks.push('Нет собственного автомобиля');
    } else if (vehicle) {
      chunks.push(vehicle);
    }
    if (licenses.length > 0) {
      chunks.push(`права категории ${licenses.join(', ')}`);
    }
    return chunks.join(', ');
  }

  const candidateAdditionalRows = computed(() => {
    const c = props.candidate as Record<string, unknown>;
    const commute = pickCandidateStr(c, 'commute_time', 'commuteTime');
    const business = pickCandidateStr(c, 'business_trip_readiness', 'businessTrips');
    const citizenship = pickCandidateStr(c, 'citizenship');
    const workPermit = pickCandidateStr(c, 'work_ticket', 'workPermit');
    const driving = formatCandidateDrivingLine(c);
    const licenseLegacy = pickCandidateStr(c, 'hasDriverLicense');
    const drivingFinal = driving || licenseLegacy;

    return [
      {
        label: 'Желательное время в пути до работы',
        value: commute,
      },
      { label: 'Командировки', value: business },
      { label: 'Гражданство', value: citizenship },
      { label: 'Разрешение на работу', value: workPermit },
      { label: 'Опыт вождения', value: drivingFinal },
    ] as const;
  });

  const hasCoverLetter = computed(() => {
    const t = props.candidate.coverLetter;
    return typeof t === 'string' && t.trim() !== '';
  });

  const hasAboutMeText = computed(() => {
    const t = props.candidate.aboutMe;
    return typeof t === 'string' && t.trim() !== '';
  });

  const hasResumeExperienceBlock = computed(() => {
    const exps = props.candidate.experiences;
    if (Array.isArray(exps) && exps.length > 0) return true;
    const agg = props.candidate.experience;
    return typeof agg === 'string' && agg.trim() !== '';
  });

  const candidateAdditionalRowsFilled = computed(() =>
    candidateAdditionalRows.value.filter((row) => row.value.trim() !== '')
  );

  const hasAdditionalInfoSection = computed(
    () => candidateAdditionalRowsFilled.value.length > 0
  );
</script>

<template>
  <div class="flex flex-col">
    <div class="mb-px shrink-0 rounded-t-fifteen bg-catskill px-25px py-15px">
      <BtnTab :tabs="tabs" v-model="activeTab" />
    </div>
    <div class="min-h-0 flex-1 flex flex-col">
      <div
        v-if="activeTab === 'resume'"
        class="candidate-resume-tab-text [&>div:last-child]:rounded-b-fifteen"
      >
        <div v-if="hasCoverLetter" class="mb-px bg-white p-25px pt-[27px]">
          <p class="mb-15px text-15px font-medium text-space">
            Сопроводительное письмо
          </p>
          <p class="break-words text-sm leading-150 text-slate-custom">
            <TextWithLinks :text="candidate.coverLetter || ''" />
          </p>
        </div>
        <div v-if="hasResumePositionBlock" class="mb-px bg-white p-25px">
          <div
            class="mb-15px flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
          >
            <p class="min-w-0 flex-1 text-15px font-medium leading-normal text-space">
              {{ candidate.quickInfo?.trim() || 'Должность' }}
            </p>
            <p
              v-if="resumeSalaryLine"
              class="shrink-0 text-right text-15px font-medium leading-normal text-space"
            >
              {{ resumeSalaryLine }}
            </p>
          </div>
          <p class="mb-3 text-sm font-normal leading-150">
            <span class="text-slate-custom">Специализации: </span>
            <span class="text-space">{{ candidate.specializations || '—' }}</span>
          </p>
          <p class="mb-3 text-sm font-normal leading-150">
            <span class="text-slate-custom">Тип занятости: </span>
            <span class="text-space">{{ candidate.employment || '—' }}</span>
          </p>
          <p class="text-sm font-normal leading-150">
            <span class="text-slate-custom">Формат работы: </span>
            <span class="text-space">{{ candidate.workFormat || candidate.work_format || '—' }}</span>
          </p>
        </div>
        <div v-if="hasResumeExperienceBlock" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Опыт работы: {{ experienceDisplay }}
          </p>
          <div class="space-y-5">
            <div
              v-for="(exp, idx) in candidate.experiences"
              :key="exp.id ?? idx"
              class="experience-entry"
            >
              <div class="flex gap-4">
              <div class="experience-entry-dates w-[118px] shrink-0">
                <template
                  v-for="period in [formatExperienceWorkPeriod(exp)]"
                  :key="'exp-period-' + (exp.id ?? idx)"
                >
                  <template v-if="period">
                    <p class="text-sm font-normal leading-normal text-space">
                      {{ period.line1 }}
                    </p>
                    <p class="text-sm font-normal leading-normal text-space">
                      {{ period.line2 }}
                    </p>
                    <p
                      class="mt-0.5 text-xs font-normal leading-normal text-slate-custom"
                    >
                      {{ period.line3 }}
                    </p>
                  </template>
                  <template v-else>
                    <p class="text-sm font-normal text-slate-custom">
                      {{
                        exp.dates ||
                          [exp.start_date, exp.end_date]
                            .filter(Boolean)
                            .join(' – ') ||
                          '—'
                      }}
                    </p>
                    <p
                      v-if="exp.duration"
                      class="mt-0.5 text-xs font-normal text-slate-custom"
                    >
                      {{ exp.duration }}
                    </p>
                  </template>
                </template>
              </div>
              <div class="experience-entry-details min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <p class="min-w-0 flex-1 text-sm font-semibold leading-normal text-space">
                    {{ exp.company || '—' }}
                  </p>
                  <button
                    v-if="
                      exp.description &&
                      (expandedExperience[idx] ||
                        experienceDescOverflow[idx] === true)
                    "
                    type="button"
                    class="experience-toggle inline-flex shrink-0 items-center gap-1 pt-px text-sm font-normal leading-normal text-slate-custom hover:text-space"
                    @click="toggleExperience(idx)"
                  >
                    <span>{{ expandedExperience[idx] ? 'Свернуть' : 'Развернуть' }}</span>
                    <svg-icon
                      name="dropdown-arrow"
                      width="14"
                      height="14"
                      class="shrink-0 transition-transform duration-200"
                      :class="{ 'rotate-180': expandedExperience[idx] }"
                    />
                  </button>
                </div>
                <p v-if="exp.location" class="mt-0.5 text-sm font-normal text-space">
                  {{ exp.location }}
                </p>
                <p
                  v-if="exp.industry"
                  class="mt-0.5 text-sm font-normal text-space"
                >
                  {{ exp.industry }}
                </p>
                <p v-if="exp.job_title" class="mt-1.5 text-sm font-semibold text-space">
                  {{ exp.job_title }}
                </p>
                <p v-if="exp.role_dates" class="mt-0.5 text-sm font-normal text-space">
                  {{ exp.role_dates }}
                </p>
                <div
                  v-if="exp.description"
                  :ref="(el) => setExperienceDescriptionEl(el, idx)"
                  class="mt-1.5 text-sm font-normal leading-150 text-space"
                  :class="{ 'line-clamp-2': !expandedExperience[idx] }"
                >
                  <TextWithLinks :text="exp.description" />
                </div>
              </div>
            </div>
          </div>
          </div>
          <p
            v-if="(!candidate.experiences || candidate.experiences.length === 0) && candidate.experience"
            class="text-sm leading-150 text-slate-custom"
          >
            {{ experienceDisplay }}
          </p>
        </div>
        <div v-if="hhSkillSetItems.length > 0" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Навыки</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(skill, index) in hhSkillSetItems"
              :key="`${skill}-${index}`"
              class="inline-flex items-center rounded-fifteen bg-athens-gray px-3 py-1.5 text-sm font-normal leading-normal text-space"
            >
              {{ skill }}
            </span>
          </div>
        </div>
        <div
          v-if="hhNativeLanguages.length > 0 || hhOtherLanguages.length > 0"
          class="mb-px bg-white p-25px"
        >
          <p class="mb-15px text-15px font-medium text-space">Языки</p>
          <div v-if="hhNativeLanguages.length > 0" class="mb-4">
            <p class="mb-2 text-sm font-normal text-slate-custom">Родной</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(lang, index) in hhNativeLanguages"
                :key="`${lang.name}-native-${index}`"
                class="inline-flex items-center rounded-fifteen bg-athens-gray px-3 py-1.5 text-sm font-normal leading-normal text-space"
              >
                {{ lang.name }}
              </span>
            </div>
          </div>
          <div v-if="hhOtherLanguages.length > 0">
            <p class="mb-2 text-sm font-normal text-slate-custom">Другие языки</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(lang, index) in hhOtherLanguages"
                :key="`${lang.name}-other-${index}`"
                class="inline-flex items-center rounded-fifteen bg-[#DFF3E8] px-3 py-1.5 text-sm font-normal leading-normal text-[#12A45C]"
              >
                {{ lang.name }}<span v-if="lang.level"> — {{ lang.level }}</span>
              </span>
            </div>
          </div>
        </div>
        <div v-if="hasAboutMeText" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Обо мне
          </p>
          <p class="text-sm leading-150 text-slate-custom">
            <TextWithLinks :text="candidate.aboutMe || ''" />
          </p>
        </div>
        <div v-if="hhRecommendations.length > 0" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Рекомендации</p>
          <div class="space-y-4">
            <div
              v-for="(rec, index) in hhRecommendations"
              :key="`${rec.name}-${index}`"
            >
              <p class="text-sm font-medium leading-normal text-space">
                {{ rec.name }}
              </p>
              <p
                v-if="rec.position || rec.company"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                {{ rec.position || '—' }}<span v-if="rec.company"> · {{ rec.company }}</span>
              </p>
            </div>
          </div>
        </div>
        <div v-if="hasResumeEducationBlock" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Образование</p>
          <p class="mb-1 text-sm font-normal text-slate-custom">Уровень</p>
          <p
            class="text-sm font-normal leading-150 text-space"
            :class="
              hhEducationPrimaryEntries.length > 0 || legacyEducationFallback ? 'mb-5' : ''
            "
          >
            {{ resumeEducationLevelLabel || '—' }}
          </p>
          <div v-if="hhEducationPrimaryEntries.length > 0" class="space-y-5">
            <div v-for="(edu, eduIdx) in hhEducationPrimaryEntries" :key="eduIdx">
              <p class="text-sm font-normal leading-150 text-space">
                {{ formatHhEducationLine1(edu) }}
              </p>
              <p
                v-if="formatHhEducationLine2(edu, resumeEducationLevelLabel)"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                {{ formatHhEducationLine2(edu, resumeEducationLevelLabel) }}
              </p>
            </div>
          </div>
          <p
            v-else-if="legacyEducationFallback"
            class="text-sm font-normal leading-150 text-space"
          >
            {{ legacyEducationFallback }}
          </p>
        </div>
        <div v-if="hasCourseQualificationBlock" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">
            Курсы повышения квалификации
          </p>
          <div v-if="hhEducationAdditionalEntries.length > 0" class="space-y-5">
            <div
              v-for="(course, cIdx) in hhEducationAdditionalEntries"
              :key="course.id || String(cIdx)"
            >
              <p class="text-sm font-normal leading-150 text-space">
                {{ formatHhCourseTitleLine(course) }}
              </p>
              <p
                v-if="formatHhCourseSecondaryLine(course)"
                class="mt-1 text-sm font-normal leading-150 text-slate-custom"
              >
                <TextWithLinks :text="formatHhCourseSecondaryLine(course)" />
              </p>
            </div>
          </div>
          <template v-else>
            <p class="text-sm font-normal leading-150 text-space">
              {{ courseQualificationTitle || '—' }}
            </p>
            <p
              v-if="courseQualificationDetails"
              class="mt-1 text-sm font-normal leading-150 text-slate-custom"
            >
              <TextWithLinks :text="courseQualificationDetails" />
            </p>
          </template>
        </div>
        <div v-if="hhCertificateEntries.length > 0" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Сертификаты</p>
          <div class="space-y-5">
            <div
              v-for="(cert, certIdx) in hhCertificateEntries"
              :key="certIdx"
              class="min-w-0"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="min-w-0 flex-1 text-sm font-normal leading-150 text-space">
                  <TextWithLinks :text="cert.title" />
                </p>
                <a
                  v-if="cert.url"
                  :href="cert.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="shrink-0 text-sm font-normal text-slate-custom hover:text-dodger"
                >
                  Посмотреть &gt;
                </a>
              </div>
              <p
                v-if="cert.year"
                class="mt-1 text-xs font-normal leading-normal text-slate-custom"
              >
                {{ cert.year }}
              </p>
            </div>
          </div>
        </div>
        <div v-if="hasAdditionalInfoSection" class="mb-px bg-white p-25px">
          <p class="mb-15px text-15px font-medium text-space">Дополнительно</p>
          <ul class="list-none space-y-3 p-0">
            <li
              v-for="(row, rowIdx) in candidateAdditionalRowsFilled"
              :key="rowIdx"
              class="text-sm font-normal leading-150"
            >
              <span class="text-slate-custom">{{ row.label }}: </span>
              <span class="text-space">{{ row.value }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div v-if="activeTab === 'fields'">
        <div
          class="fields-tab-block mb-px rounded-b-fifteen bg-white py-25px px-30px"
        >
          <div class="mb-22px">
            <p class="text-lg font-bold leading-normal text-space">
              Системные поля
            </p>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Источник
            </span>
            <span class="fields-tab-line__dots" aria-hidden="true" />
            <div class="fields-tab-line__value">
              <PlainSingleSelectDropdown
                :model-value="candidate.source || ''"
                :options="CANDIDATE_SOURCE_OPTIONS"
                placeholder="Выбрать"
                :disabled="sourceFieldSaving"
                @update:model-value="handleSourceFieldUpdate"
              />
            </div>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Рекрутеры
            </span>
            <span class="fields-tab-line__dots" aria-hidden="true" />
            <div class="fields-tab-line__value">
              <PlainMultiSelectDropdown
                :model-value="recruiterIdsEdit"
                :options="recruiterOptions"
                placeholder="Выбрать"
                :disabled="recruiterFieldSaving || recruitersListLoading"
                @update:model-value="onRecruitersModelUpdate"
              />
            </div>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Тип отклика
            </span>
            <span class="fields-tab-line__dots" aria-hidden="true" />
            <div class="fields-tab-line__value">
              <PlainSingleSelectDropdown
                :model-value="
                  (candidate.response_type || '').trim() === ''
                    ? 'Не указан'
                    : candidate.response_type || ''
                "
                :options="CANDIDATE_RESPONSE_TYPE_OPTIONS"
                placeholder="Выбрать"
                :disabled="responseTypeFieldSaving"
                @update:model-value="handleResponseTypeFieldUpdate"
              />
            </div>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Причина отказа
            </span>
            <span class="fields-tab-line__dots" aria-hidden="true" />
            <div class="fields-tab-line__value">
              <PlainSingleSelectDropdown
                :model-value="candidate.rejection_reason?.name?.trim() || ''"
                :options="rejectionReasonOptions"
                placeholder="Выбрать"
                :disabled="
                  rejectionReasonFieldSaving || rejectionReasonsLoading
                "
                @update:model-value="handleRejectionReasonFieldUpdate"
              />
            </div>
          </div>
          <div class="mb-22px mt-30px">
            <p class="text-lg font-bold leading-normal text-space">
              Информация
            </p>
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Фамилия
            </span>
            <PlainInlineTextInput
              v-model="surnameEdit"
              leader-full-width
              placeholder=""
              autocomplete="family-name"
              :disabled="nameFieldsSaving"
              @blur="flushNameFieldsFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Имя
            </span>
            <PlainInlineTextInput
              v-model="firstnameEdit"
              leader-full-width
              placeholder=""
              autocomplete="given-name"
              :disabled="nameFieldsSaving"
              @blur="flushNameFieldsFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Отчество
            </span>
            <PlainInlineTextInput
              v-model="patronymicEdit"
              leader-full-width
              placeholder=""
              autocomplete="additional-name"
              :disabled="nameFieldsSaving"
              @blur="flushNameFieldsFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span
              class="fields-tab-line__label text-sm font-normal transition-colors duration-150"
              :class="emailLineError ? 'text-[#ef4444]' : 'text-bali'"
            >
              Электронная почта
            </span>
            <PlainInlineTextInput
              v-model="emailEdit"
              leader-full-width
              :line-error="emailLineError"
              type="email"
              placeholder=""
              autocomplete="email"
              :disabled="emailFieldSaving"
              @blur="flushEmailFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Дата рождения
            </span>
            <PlainDateSelectDropdown
              :model-value="birthDateEdit"
              :disabled="birthDateFieldSaving"
              @update:model-value="handleBirthDateFieldUpdate"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span
              class="fields-tab-line__label text-sm font-normal transition-colors duration-150"
              :class="phoneLineError ? 'text-[#ef4444]' : 'text-bali'"
            >
              Телефон
            </span>
            <PlainInlineTextInput
              v-model="phoneEdit"
              leader-full-width
              :line-error="phoneLineError"
              type="tel"
              placeholder=""
              autocomplete="tel"
              :disabled="phoneFieldSaving"
              @blur="flushPhoneFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Город
            </span>
            <PlainInlineTextInput
              v-model="cityEdit"
              leader-full-width
              type="text"
              placeholder=""
              autocomplete="address-level2"
              :disabled="cityFieldSaving"
              @blur="flushCityFromBlur"
            />
          </div>
          <div class="fields-tab-line mb-5">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Гражданство
            </span>
            <PlainInlineTextInput
              v-model="citizenshipEdit"
              leader-full-width
              type="text"
              placeholder=""
              autocomplete="off"
              :disabled="citizenshipFieldSaving"
              @blur="flushCitizenshipFromBlur"
            />
          </div>
          <div class="fields-tab-line">
            <span class="fields-tab-line__label text-sm font-normal text-bali">
              Желаемая зарплата
            </span>
            <PlainInlineTextInput
              v-model="salaryDesiredEdit"
              leader-full-width
              digits-only
              type="text"
              placeholder=""
              autocomplete="off"
              :disabled="salaryFieldSaving"
              @blur="flushSalaryDesiredFromBlur"
            />
          </div>
          <div
            class="mb-22px mt-30px flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2"
          >
            <p
              class="min-w-0 pr-2 text-lg font-bold leading-normal text-space"
            >
              Пользовательские поля
            </p>
            <div
              v-if="localCandidateCustomFields.length > 0"
              class="flex shrink-0 items-center gap-3"
            >
              <button
                v-if="!isLocalCustomFieldsLayoutEditMode"
                type="button"
                class="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-normal leading-normal text-dodger transition-opacity hover:opacity-85"
                @click="isLocalCustomFieldsLayoutEditMode = true"
              >
                <svg
                  class="local-cf-header-stroke-icon shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Настроить
              </button>
              <button
                v-else
                type="button"
                class="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-normal leading-normal text-dodger transition-opacity hover:opacity-85"
                @click="finishLocalCustomFieldsLayoutEdit"
              >
                <svg
                  class="local-cf-header-stroke-icon shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                  />
                  <path d="M17 21v-8H7v8" />
                  <path d="M7 3v8h8" />
                </svg>
                Сохранить
              </button>
            </div>
          </div>
          <!-- Старый вывод customFields с API (только текст) — не показываем вместе с полями аккаунта с сервера, иначе дубль -->
          <template
            v-if="
              candidateCustomFieldRows.length && !serverAccountCustomFieldsReady
            "
          >
            <div
              v-for="row in candidateCustomFieldRows"
              :key="'api-cf-' + row.id"
              :class="[
                'fields-tab-line mb-5',
                localCandidateCustomFields.length > 0 &&
                  isLocalCustomFieldsLayoutEditMode &&
                  'fields-tab-line--cf-pencil-gap',
              ]"
            >
              <span class="fields-tab-line__label text-sm font-normal text-bali">
                {{ row.label }}
              </span>
              <span class="fields-tab-line__dots" aria-hidden="true" />
              <p
                class="fields-tab-line__value fields-tab-line__value--truncate text-sm font-normal leading-150 text-slate-custom"
              >
                {{ row.text }}
              </p>
            </div>
          </template>
          <ClientOnly>
            <draggable
              v-if="isLocalCustomFieldsLayoutEditMode"
              v-model="localCandidateCustomFields"
              item-key="localId"
              :animation="200"
              easing="cubic-bezier(0.25, 1, 0.5, 1)"
              ghost-class="local-cf-sortable-ghost"
              chosen-class="local-cf-sortable-chosen"
              drag-class="local-cf-sortable-drag"
              :filter="LOCAL_CF_SORTABLE_FILTER"
              :prevent-on-filter="false"
            >
              <template #item="{ element }">
                <CandidateLocalCustomFieldRow
                  :key="element.localId"
                  :field="element"
                  :layout-edit-mode="true"
                  @edit="openEditLocalCustomField"
                  @delete-request="onLocalCustomFieldDeleteRequest"
                />
              </template>
            </draggable>
            <template v-else>
              <CandidateLocalCustomFieldRow
                v-for="field in localCandidateCustomFields"
                :key="field.localId"
                :field="field"
                :layout-edit-mode="false"
                @edit="openEditLocalCustomField"
                @delete-request="onLocalCustomFieldDeleteRequest"
              />
            </template>
            <template #fallback>
              <CandidateLocalCustomFieldRow
                v-for="field in localCandidateCustomFields"
                :key="field.localId"
                :field="field"
                :layout-edit-mode="false"
                @edit="openEditLocalCustomField"
                @delete-request="onLocalCustomFieldDeleteRequest"
              />
            </template>
          </ClientOnly>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-dodger transition-opacity hover:opacity-85"
            :class="hasAnyCustomFields ? 'mt-2' : ''"
            @click="isAddCustomFieldPopupOpen = true"
          >
            <span
              class="inline-flex h-[16.25px] w-[16.25px] shrink-0 items-center justify-center rounded-full bg-dodger text-white"
              aria-hidden="true"
            >
              <svg
                class="block h-[8.125px] w-[8.125px]"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 2.25v7.5M2.25 6h7.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="text-[13px] font-normal leading-normal">
              Добавить
            </span>
          </button>
        </div>
        <!-- Секция «Информация» скрыта по макету
        <div class="bg-white p-25px pl-30px">
          <div class="mb-26px flex items-center">
            <p class="mr-2.5 text-lg font-bold leading-normal text-space">
              Информация
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
            :candidate-source="candidate?.source ?? null"
            :feed-active="activeTab === 'chat'"
            @delete-request="handleDeleteCommentRequest"
            @edit-comment="handleEditComment"
            @delete-task-request="handleDeleteTaskRequest"
            @edit-task="handleEditTask"
            @complete-task="handleCompleteTask"
            @open-email="emit('open-email-popup')"
            @open-email-card="handleOpenEmailCard"
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
          @email-format-selected="emit('open-email-popup')"
          @scroll-into-view="scrollEventFeedToInput"
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
    <CandidateAddCustomFieldPopup
      :is-open="isAddCustomFieldPopupOpen"
      @close="isAddCustomFieldPopupOpen = false"
      @submit="onLocalCustomFieldAdded"
    />
    <CandidateEditCustomFieldPopup
      :is-open="editingLocalCustomField != null"
      :field="editingLocalCustomField"
      @close="closeEditLocalCustomField"
      @submit="onLocalCustomFieldUpdated"
    />
    <CandidateEmailViewPopup
      :is-open="isEmailViewOpen"
      :email-event="selectedEmailEvent"
      :candidate-name="candidate ? [candidate.firstname, candidate.surname].filter(Boolean).join(' ') : undefined"
      :candidate-email="candidate?.email"
      @close="handleEmailViewClose"
      @reply="handleEmailViewReply"
    />
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
    <CommentDeleteConfirmPopup
      :is-open="localCustomFieldPendingDelete != null"
      :description="localCustomFieldDeleteDescription"
      @close="closeLocalCustomFieldDeleteConfirm"
      @confirm="confirmLocalCustomFieldDelete"
    />
  </div>
  <Teleport to="body">
    <Transition name="fields-tab-toast-fade">
      <div
        v-if="fieldsTabToast.show"
        class="fixed right-4 z-[10001] max-w-[min(90vw,420px)] rounded-fifteen px-6 py-3 text-center text-sm font-medium leading-150 text-space shadow-[0_0_15px_rgba(0,0,0,0.15)] sm:right-6"
        :style="fieldsTabToastFixedStyle"
        :class="
          fieldsTabToast.variant === 'success'
            ? 'fields-tab-success-toast'
            : 'fields-tab-error-toast'
        "
        :role="fieldsTabToast.variant === 'success' ? 'status' : 'alert'"
      >
        {{ fieldsTabToast.text }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Вторичный серый текст на вкладке «Резюме» — легче по весу (перебивает font-normal на той же строке) */
.candidate-resume-tab-text .text-slate-custom {
  font-weight: 300 !important;
}

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

/* Вкладка «Поля»: одна строка на поле, пунктир у нижней кромки текста (как на макете) */
.fields-tab-block :deep(.plain-fields-leader-shell) {
  /* В компоненте по умолчанию min-height: 1.75rem — строки выше, чем у полей с текстом и «…» */
  min-height: 0;
}
/* «Настроить» / «Сохранить»: высота иконки = кегль подписи; толщина штриха подбирается к font-normal */
.fields-tab-block :deep(.local-cf-header-stroke-icon) {
  display: block;
  width: 1em;
  height: 1em;
}
/* :deep — строки локальных полей в CandidateLocalCustomFieldRow */
.fields-tab-block :deep(.fields-tab-line) {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-end;
  width: 100%;
  column-gap: 8px;
}
.fields-tab-block :deep(.fields-tab-line__label) {
  flex: 0 0 auto;
  max-width: none;
  white-space: nowrap;
}
.fields-tab-block :deep(.fields-tab-line__dots) {
  flex: 1 1 0;
  min-width: 12px;
  width: auto;
  height: 0;
  box-sizing: border-box;
  align-self: flex-end;
  border-bottom: 1px dotted #c5cdd5;
  /* flex-end тянет линию к низу line-height; поднимаем к визуальной базовой линии */
  transform: translateY(-0.28em);
}
/* Значение по ширине контента, выравнивание как у PlainSingleSelectDropdown (вправо) */
.fields-tab-block :deep(.fields-tab-line__value) {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
  max-width: none;
  margin: 0;
  text-align: right;
}
.fields-tab-block :deep(.fields-tab-line__value--truncate) {
  max-width: min(360px, 42vw);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* vuedraggable / Sortable: остальные строки сдвигаются, место вставки — «призрак» */
.fields-tab-block :deep(.local-cf-sortable-ghost) {
  opacity: 0.42;
  background: rgba(30, 144, 255, 0.07);
  border-radius: 10px;
  box-sizing: border-box;
}
.fields-tab-block :deep(.local-cf-sortable-chosen) {
  cursor: grabbing;
}
.fields-tab-block :deep(.local-cf-sortable-drag) {
  opacity: 0.96;
}
/* Только строки API: запас под две иконки h-6 (как в CandidateLog) */
.fields-tab-block :deep(.fields-tab-line.fields-tab-line--cf-pencil-gap::after) {
  content: '';
  flex-shrink: 0;
  align-self: flex-end;
  width: 3.5rem;
  box-sizing: border-box;
  padding-left: 0.25rem;
  transform: translateY(-2px);
  pointer-events: none;
}
</style>

<style>
  /* Непрозрачный розовый фон: не полагаемся на Tailwind (JIT/перекрытия), только на явные значения */
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



