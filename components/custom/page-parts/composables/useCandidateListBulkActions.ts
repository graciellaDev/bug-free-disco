import { ref, computed, type ComputedRef, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import type { BulkBarActionItem } from '@/components/custom/BulkActionBar.vue';
import type { Candidate } from '@/types/candidates';
import type { TransferMode } from '@/types/vacancy';
import {
  getCandidateById,
  deleteCandidate,
  createCandidateComment,
  createCandidate,
  sendCandidateEmail,
} from '@/src/api/candidates';
import { buildCandidateCopyPayload } from '@/utils/buildCandidateCopyPayload';
import { displayCandidateEmailOrEmpty } from '@/utils/candidateDisplayEmail';

export const CANDIDATE_LIST_BULK_ACTIONS: BulkBarActionItem[] = [
  {
    id: 'comment',
    label: 'Добавить комментарий',
    icon: 'message20',
    iconClass: 'text-white/80',
  },
  {
    id: 'email',
    label: 'Написать письмо',
    icon: 'email20',
    iconClass: 'text-white/80',
  },
  {
    id: 'copy',
    label: 'Копировать в вакансию',
    icon: 'basket-plus',
    iconClass: 'text-white/80',
  },
  {
    id: 'delete',
    label: 'Удалить',
    icon: 'basket-basket',
    iconClass: 'text-red-custom',
  },
  {
    id: 'message',
    label: 'Отправить сообщение',
    icon: 'pulse',
    iconClass: 'text-white/80',
  },
];

export function useCandidateListBulkActions(options: {
  selectedCandidateIds: ComputedRef<number[]>;
  candidatesList: Ref<Candidate[] | undefined>;
  selected: Ref<Record<number, boolean>>;
  allSelected: Ref<boolean>;
  onAfterMutation: () => Promise<void>;
}) {
  const router = useRouter();

  const bulkDeleteConfirmOpen = ref(false);
  const bulkTransferPopupOpen = ref(false);
  const bulkTransferMode = ref<TransferMode>('copy');
  const bulkCommentPopupOpen = ref(false);
  const bulkCommentText = ref('');
  const bulkEmailPopupOpen = ref(false);
  const bulkActionLoading = ref(false);

  const selectedCount = computed(() => options.selectedCandidateIds.value.length);

  const bulkAnchorCandidate = computed((): Candidate | null => {
    const ids = options.selectedCandidateIds.value;
    if (!ids.length) return null;
    for (const id of ids) {
      const c = options.candidatesList.value?.find(x => x.id === id);
      if (c) return c;
    }
    return null;
  });

  function clearSelection() {
    options.selected.value = {};
    options.allSelected.value = false;
  }

  async function resolveCandidateForBulk(id: number): Promise<Candidate | null> {
    const fromList = options.candidatesList.value?.find(x => x.id === id);
    if (fromList) return fromList;
    try {
      const r = await getCandidateById(id);
      return r.candidateData;
    } catch {
      return null;
    }
  }

  async function afterBulkMutation() {
    clearSelection();
    await options.onAfterMutation();
  }

  async function afterBulkSoftMutation() {
    await options.onAfterMutation();
  }

  function openBulkTransfer(mode: TransferMode) {
    if (!selectedCount.value || bulkActionLoading.value) return;
    if (!bulkAnchorCandidate.value) {
      alert('Не удалось определить кандидата для выбора вакансии. Дождитесь загрузки списка.');
      return;
    }
    bulkTransferMode.value = mode;
    bulkTransferPopupOpen.value = true;
  }

  async function onBulkTransferConfirm(vacancyId: number) {
    bulkTransferPopupOpen.value = false;
    const ids = [...options.selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      for (const id of ids) {
        const c = await resolveCandidateForBulk(id);
        if (!c) continue;
        try {
          await createCandidate(buildCandidateCopyPayload(c, vacancyId));
        } catch (err) {
          console.error('[onBulkTransferConfirm]', id, err);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await afterBulkMutation();
  }

  function handleBulkCommentClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    bulkCommentText.value = '';
    bulkCommentPopupOpen.value = true;
  }

  async function submitBulkComment() {
    const text = bulkCommentText.value.trim();
    if (!text) return;
    bulkCommentPopupOpen.value = false;
    bulkCommentText.value = '';
    const ids = [...options.selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      for (const id of ids) {
        try {
          await createCandidateComment(id, text);
        } catch (e) {
          console.error('[submitBulkComment]', id, e);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await afterBulkSoftMutation();
  }

  function handleBulkEmailClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    if (!bulkAnchorCandidate.value) {
      alert('Не удалось открыть письмо: нет данных выбранного кандидата.');
      return;
    }
    bulkEmailPopupOpen.value = true;
  }

  async function onBulkEmailSubmit(data: Record<string, unknown>) {
    bulkEmailPopupOpen.value = false;
    const subject = String(data?.subject ?? '').trim();
    const from_email = data?.from != null ? String(data.from).trim() : undefined;
    const bodyVal = data?.body;
    const bodyStr =
      typeof bodyVal === 'string'
        ? bodyVal
        : String((bodyVal as { value?: string })?.value ?? '<p></p>');
    const ids = [...options.selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      for (const id of ids) {
        const c = await resolveCandidateForBulk(id);
        if (!c) continue;
        const to = displayCandidateEmailOrEmpty(c.email).trim();
        if (!to) continue;
        try {
          await sendCandidateEmail(id, {
            subject,
            body: bodyStr,
            to,
            from_email: from_email || undefined,
          });
        } catch (e) {
          console.error('[onBulkEmailSubmit]', id, e);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await afterBulkSoftMutation();
  }

  function handleBulkSendMessageClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    const first = options.selectedCandidateIds.value[0];
    if (first == null) return;
    void router.push(`/candidates/${first}?tab=chat`);
  }

  function handleBulkDeleteClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    bulkDeleteConfirmOpen.value = true;
  }

  async function confirmBulkDelete() {
    bulkDeleteConfirmOpen.value = false;
    const ids = [...options.selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      for (const id of ids) {
        try {
          await deleteCandidate(id);
        } catch (e) {
          console.error('[confirmBulkDelete]', id, e);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await afterBulkMutation();
  }

  function runBulkBarAction(id: string) {
    switch (id) {
      case 'comment':
        handleBulkCommentClick();
        break;
      case 'email':
        handleBulkEmailClick();
        break;
      case 'copy':
        openBulkTransfer('copy');
        break;
      case 'message':
        handleBulkSendMessageClick();
        break;
      case 'delete':
        handleBulkDeleteClick();
        break;
      default:
        break;
    }
  }

  return {
    bulkDeleteConfirmOpen,
    bulkTransferPopupOpen,
    bulkTransferMode,
    bulkCommentPopupOpen,
    bulkCommentText,
    bulkEmailPopupOpen,
    bulkActionLoading,
    selectedCount,
    bulkAnchorCandidate,
    runBulkBarAction,
    onBulkTransferConfirm,
    onBulkEmailSubmit,
    submitBulkComment,
    confirmBulkDelete,
  };
}
