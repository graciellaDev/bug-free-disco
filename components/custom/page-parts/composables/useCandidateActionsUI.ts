import { unref, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Candidate } from '@/types/candidates';

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
  }
) {
  const router = useRouter();

  // Получаем актуальное значение candidate
  const getCandidate = (): Candidate => {
    return unref(candidate);
  };

  const handleShareCandidate = () => {
    const currentCandidate = getCandidate();

    const candidateUrl = `${window.location.origin}/candidates/${currentCandidate.id}`;
    navigator.clipboard
      .writeText(candidateUrl)
      .then(() => {
        alert('Ссылка на кандидата скопирована в буфер обмена');
      })
      .catch(error => {
        console.error('Ошибка при копировании:', error);
        alert('Не удалось скопировать ссылку');
      });
  };

  /**
   * Открытие файла резюме
   */
  const handleResumeFile = () => {
    const currentCandidate = getCandidate();

    if (currentCandidate.resumePath) {
      window.open(currentCandidate.resumePath, '_blank');
    } else if (currentCandidate.attachments?.length) {
      window.open(currentCandidate.attachments[0].link, '_blank');
    } else {
      alert('Резюме не найдено');
    }
  };

  /**
   * Переместить в вакансию
   */
  const handleMoveToVacancy = () => {
    // TODO: Открыть диалог выбора вакансии
    console.log('Переместить в вакансию');
  };

  /**
   * Копировать в вакансию
   */
  const handleCopyToVacancy = () => {
    // TODO: Открыть диалог выбора вакансии
    console.log('Копировать в вакансию');
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
    const currentCandidate = getCandidate();

    switch (item) {
      case 'Поделиться кандидатом':
        handleShareCandidate();
        break;
      case 'Редактировать':
        callbacks?.onEdit?.();
        break;
      case 'Файл резюме':
        handleResumeFile();
        break;
      case 'Переместить в вакансию':
        handleMoveToVacancy();
        break;
      case 'Копировать в вакансию':
        handleCopyToVacancy();
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
        console.warn('Неизвестное действие:', item);
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
    console.log('click refuse');
    // TODO: Реализовать отказ кандидату
  };

  const handleClickAddTag = () => {
    console.log('click add tag');
    // TODO: Реализовать добавление тега
  };

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
    handleShareCandidate,
    handleResumeFile,
    handleMoveToVacancy,
    handleCopyToVacancy,
    handleSendMessage,
    handleSendForEvaluation,
    handleSelectItem,
    handleClickAddComment,
    handleClickEmail,
    handleClickNewTask,
    handleClickRefuse,
    handleClickAddTag,
    handleClickTelegram,
    handleClickMessengerMax,
  };
}
