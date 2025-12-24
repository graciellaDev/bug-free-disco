import { ref, type Ref } from 'vue';
import { createCandidate } from '@/src/api/candidates';
import type { CandidateCreateRequest } from '@/types/candidates';

/**
 * Composable для управления формой добавления кандидата
 *
 * @param options - Опции для настройки поведения
 * @returns Объект с состоянием формы и функциями обработки
 */
export function useCandidateAddForm(options?: {
  /** Callback для обновления списка кандидатов после успешного создания */
  onSuccess?: () => Promise<void> | void;
  /** Callback для закрытия попапа */
  onClose?: () => void;
  /** Callback при открытии попапа */
  onOpen?: () => void;
}) {
  // Состояние формы
  const candidateFormData = ref<Record<string, any>>({});
  const serverErrors = ref<Record<string, string>>({});
  const isSubmitting = ref(false);
  const isSuccess = ref(false);
  const successMessage = ref('');

  /**
   * Парсинг ошибок сервера
   */
  const parseServerErrors = (error: any): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Ошибка 409 - дубликат (email/телефон уже существует)
    if (error.response?.status === 409) {
      const message = error.response._data?.message || error.message || '';

      // Определяем, какое поле дублируется
      if (message.toLowerCase().includes('email')) {
        errors.email = 'Кандидат с таким email уже существует';
      }

      if (
        message.toLowerCase().includes('телефон') ||
        message.toLowerCase().includes('phone')
      ) {
        errors.phone = 'Кандидат с таким номером телефона уже существует';
      }

      // Если не удалось определить, показываем общее сообщение
      if (Object.keys(errors).length === 0) {
        errors._general = message || 'Кандидат с такими данными уже существует';
      }
    }

    // Ошибка 422 - валидация (Laravel обычно возвращает errors объект)
    if (error.response?.status === 422) {
      const responseErrors = error.response._data?.errors || {};
      Object.keys(responseErrors).forEach(field => {
        errors[field] = Array.isArray(responseErrors[field])
          ? responseErrors[field][0]
          : responseErrors[field];
      });
    }

    // Другие ошибки
    if (!errors._general && error.message) {
      errors._general = error.message;
    }

    return errors;
  };

  /**
   * Обработка отправки формы
   */
  const handleFormSubmit = async (
    formData: Record<string, any>,
    isPopupOpen: Ref<boolean>
  ) => {
    if (!isPopupOpen.value) {
      console.warn('[handleFormSubmit] Попап закрыт, прерываем обработку');
      return;
    }

    isSubmitting.value = true;
    serverErrors.value = {}; // Очищаем предыдущие ошибки

    try {
      const candidateData: CandidateCreateRequest = {
        firstname: formData.firstname,
        surname: formData.surname || null,
        patronymic: formData.patronymic || null,
        email: formData.email,
        phone:
          formData.phone && formData.phone !== '+7' ? formData.phone : null,
        resume: formData.resume || null,
      };

      const response = await createCandidate(candidateData);

      if (response && typeof response === 'object' && response.data) {
        // Вызываем callback для обновления списка, если передан
        if (options?.onSuccess) {
          await options.onSuccess();
        }

        // Закрываем попап через callback, если передан
        if (options?.onClose) {
          options.onClose();
        }
      } else {
        // Если ответ не является объектом с data, это ошибка
        console.warn('[handleFormSubmit] Неожиданный формат ответа:', response);
        const errorMessage =
          typeof response === 'string'
            ? response
            : response?.message || 'Неизвестная ошибка сервера';

        const parsedErrors = parseServerErrors({
          message: errorMessage,
          response: {
            status: 500,
            _data: { message: errorMessage },
          },
        });
        serverErrors.value = parsedErrors;
      }
    } catch (error: any) {
      console.error('[handleFormSubmit] Ошибка при создании кандидата:', error);
      // Обработка ошибок сервера
      const parsedErrors = parseServerErrors(error);
      console.log('[handleFormSubmit] Распарсенные ошибки:', parsedErrors);
      serverErrors.value = parsedErrors;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Обработка отмены формы
   */
  const handleFormCancel = () => {
    if (options?.onClose) {
      options.onClose();
    }
  };

  /**
   * Очистка ошибки вручную
   */
  const handleClearError = () => {
    serverErrors.value._general = '';
  };

  /**
   * Сброс состояния формы
   */
  const resetForm = () => {
    candidateFormData.value = {};
    serverErrors.value = {};
    isSuccess.value = false;
    successMessage.value = '';
    isSubmitting.value = false;
  };

  return {
    // Состояние
    candidateFormData,
    serverErrors,
    isSubmitting,
    isSuccess,
    successMessage,

    // Функции
    handleFormSubmit,
    handleFormCancel,
    handleClearError,
    resetForm,
    parseServerErrors,
  };
}
