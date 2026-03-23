import { unref, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Candidate } from '@/types/candidates';
import { downloadCandidateResume } from '@/src/api/candidates';
import {
  getCandidateProfileExternalUrl,
  getCandidateResumePdfUrl,
} from '@/utils/candidateSourceLinks';

/**
 * Composable для UI-действий с кандидатом
 *
 * @param candidate - Объект кандидата
 * @param router - Vue Router instance (опционально, можно получить внутри)
 * @param callbacks - Callbacks для действий, требующих доступа к родителю
 *
 * @returns Объект с обработчиками UI-действий
 */
export function useCandidateActionsUI(
  candidate: Ref<Candidate> | Candidate,
  callbacks?: {
    onEdit?: () => void;
    onDelete?: () => void;
    onEmail?: () => void;
    onCopyToVacancy?: () => void;
    onMoveToVacancy?: () => void;
    onRemoveFromVacancy?: () => void;
    onRefuse?: () => void;
  }
) {
  const router = useRouter();

  // Получаем актуальное значение candidate
  const getCandidate = (): Candidate => {
    return unref(candidate);
  };

  /**
   * Открыть резюме на сайте источника (alternate_url → link)
   */
  const handleViewOnSourceSite = () => {
    const currentCandidate = getCandidate();
    const href = getCandidateProfileExternalUrl(currentCandidate);
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * Скачать PDF резюме через бэкенд (HH download.pdf.url)
   */
  const handleDownloadResume = async () => {
    const currentCandidate = getCandidate();
    if (!getCandidateResumePdfUrl(currentCandidate)) {
      alert('Ссылка на PDF резюме не найдена');
      return;
    }
    try {
      await downloadCandidateResume(currentCandidate.id);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Не удалось скачать резюме';
      alert(msg);
    }
  };

  /**
   * Переместить в вакансию
   */
  const handleMoveToVacancy = () => {
    callbacks?.onMoveToVacancy?.();
  };

  /**
   * Копировать в вакансию
   */
  const handleCopyToVacancy = () => {
    callbacks?.onCopyToVacancy?.();
  };

  /**
   * Открепить от вакансии
   */
  const handleRemoveFromVacancy = () => {
    callbacks?.onRemoveFromVacancy?.();
  };

  /**
   * Отправить сообщение
   */
  const handleSendMessage = () => {
    const currentCandidate = getCandidate();

    router.push(`/candidates/${currentCandidate.id}?tab=chat`);
  };

  /**
   * Отправить на оценку
   */
  const handleSendForEvaluation = () => {
    // TODO: Открыть диалог выбора получателя оценки
    console.log('Отправить на оценку');
  };

  /**
   * Обработчик выбора пункта из dropdown меню
   */
  const handleSelectItem = (item: string) => {
    switch (item) {
      case 'Скачать резюме':
        void handleDownloadResume();
        break;
      case 'Переместить в вакансию':
        handleMoveToVacancy();
        break;
      case 'Копировать в вакансию':
        handleCopyToVacancy();
        break;
      case 'Открепить от вакансии':
        handleRemoveFromVacancy();
        break;
      case 'Отправить сообщение':
        handleSendMessage();
        break;
      case 'Отправить на оценку {-}':
        handleSendForEvaluation();
        break;
      case 'Удалить':
        callbacks?.onDelete?.();
        break;
      default:
        if (item.startsWith('Смотреть на ')) {
          handleViewOnSourceSite();
        } else {
          console.warn('Неизвестное действие:', item);
        }
    }
  };

  const handleClickAddComment = () => {
    console.log('click add comment');
    // TODO: Реализовать добавление комментария
  };

  const handleClickNewTask = () => {
    console.log('click new task');
    // TODO: Реализовать создание задачи
  };

  const handleClickEmail = () => {
    callbacks?.onEmail?.();
  };

  const handleClickRefuse = () => {
    callbacks?.onRefuse?.();
  };

  // const handleClickAddTag = () => {
  //   console.log('click add tag');
  //   // TODO: Реализовать добавление тега
  // };

  const handleClickMessengerMax = () => {
    const currentCandidate = getCandidate();
    if (currentCandidate?.messengerMax) {
      window.open(
        `https://max.ru/u/${currentCandidate.messengerMax}`,
        '_blank'
      );
    }
  };

  const handleClickTelegram = () => {
    const currentCandidate = getCandidate();
    if (currentCandidate?.telegram) {
      window.open(`https://t.me/${currentCandidate.telegram}`, '_blank');
    }
  };

  return {
    handleMoveToVacancy,
    handleCopyToVacancy,
    handleRemoveFromVacancy,
    handleSendMessage,
    handleSendForEvaluation,
    handleSelectItem,
    handleClickAddComment,
    handleClickEmail,
    handleClickNewTask,
    handleClickRefuse,
    // handleClickAddTag,
    handleClickTelegram,
    handleClickMessengerMax,
  };
}
