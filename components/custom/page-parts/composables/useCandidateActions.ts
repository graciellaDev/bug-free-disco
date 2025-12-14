import { ref, unref, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  deleteCandidate,
  updateCandidate,
  uploadCandidatePhoto,
} from '@/src/api/candidates';
import type { Candidate, CandidateUpdateRequest } from '@/types/candidates';
import { prepareUsernameForApi } from '@/helpers/messengers';

const isFile = (value: unknown): value is File => {
  return value instanceof File;
};

const parseServerErrors = (error: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (error.response?.status === 409) {
    const message = error.response._data?.message || error.message || '';
    if (message.toLowerCase().includes('mail')) {
      errors.email = 'Кандидат с таким email уже существует';
    }
    if (
      message.toLowerCase().includes('телефон') ||
      message.toLowerCase().includes('phone')
    ) {
      errors.email =
        'Кандидат с таким адресом электронной почты уже существует';
    }
    if (Object.keys(errors).length === 0) {
      errors._general = message || 'Кандидат с такими данными уже существует';
    }
  }

  if (error.response?.status === 422) {
    const responseErrors = error.response._data?.errors || {};
    Object.keys(responseErrors).forEach(field => {
      errors[field] = Array.isArray(responseErrors[field])
        ? responseErrors[field][0]
        : responseErrors[field];
    });
  }

  if (!errors._general && error.message) {
    errors._general = error.message;
  }

  return errors;
};

/**
 * Composable для работы с действиями кандидата
 *
 * @param candidate - Объект кандидата
 * @param onUpdated - Callback при успешном обновлении
 * @param onDeleted - Callback при успешном удалении
 *
 * @example
 * ```ts
 * const {
 *   isSubmitting,
 *   serverErrors,
 *   isSuccess,
 *   successMessage,
 *   handleDelete,
 *   handleUpdate,
 *   resetFormState,
 * } = useCandidateActions(
 *   candidate,
 *   (updated) => emit('candidate-updated', updated),
 *   (id) => emit('candidate-deleted', id)
 * );
 * ```
 */
export function useCandidateActions(
  candidate: Ref<Candidate> | Candidate,
  onUpdated?: (candidate: Candidate) => void,
  onDeleted?: (id: number) => void,
  onClosePopup?: () => void
) {
  const router = useRouter();

  // Состояние формы
  const isSubmitting = ref(false);
  const serverErrors = ref<Record<string, string>>({});
  const isSuccess = ref(false);
  const successMessage = ref('');

  const getCandidate = (): Candidate => {
    return unref(candidate);
  };

  /**
   * Сброс состояния формы
   */
  const resetFormState = () => {
    serverErrors.value = {};
    isSubmitting.value = false;
    isSuccess.value = false;
    successMessage.value = '';
  };

  /**
   * Удаление кандидата
   */
  const handleDelete = async (): Promise<void> => {
    try {
      const currentCandidate = getCandidate();
      await deleteCandidate(currentCandidate.id);

      onDeleted?.(currentCandidate.id);
      onClosePopup?.();
      router.push('/candidates');
    } catch (error) {
      console.error('Ошибка при удалении кандидата:', error);
      //TODO: Проработать оповещение об ошибке
      // alert('Не удалось удалить кандидата');
      throw error;
    }
  };

  /**
   * Обновление кандидата
   *
   * @param formData - Данные формы
   * @param isPopupOpen - Функция проверки, открыт ли попап (опционально)
   * @returns Обновленный кандидат или null при ошибке
   */
  const handleUpdate = async (
    formData: Record<string, any>,
    isPopupOpen?: () => boolean
  ): Promise<Candidate | null> => {
    // Проверка, открыт ли попап (если передана функция проверки)
    if (isPopupOpen && !isPopupOpen()) {
      console.warn('[handleUpdate] Попап закрыт, прерываем обработку');
      return null;
    }

    isSubmitting.value = true;
    serverErrors.value = {};

    try {
      const currentCandidate = getCandidate();
      let imagePath = currentCandidate.imagePath;

      // Загрузка фото, если оно выбрано
      if (isFile(formData.photo)) {
        try {
          const uploadResponse = await uploadCandidatePhoto(
            currentCandidate.id,
            formData.photo
          );
          imagePath = uploadResponse.imagePath;
        } catch (error: any) {
          console.error('[handleUpdate] Ошибка при загрузке фото:', error);
          serverErrors.value.photo =
            error.statusMessage || error.message || 'Ошибка при загрузке фото';
          isSubmitting.value = false;
          return null;
        }
      }

      // Подготовка данных для обновления
      const updateData: CandidateUpdateRequest = {
        firstname: formData.firstname,
        surname: formData.surname || '',
        patronymic: formData.patronymic || null,
        email: formData.email,
        phone:
          formData.phone && formData.phone !== '+7' ? formData.phone : null,
        resume: formData.resume || null,
        messengerMax: prepareUsernameForApi(formData.messengerMax),
        telegram: prepareUsernameForApi(formData.telegram),
        imagePath: imagePath,
      };

      // Отправка запроса на обновление
      const response = await updateCandidate(currentCandidate.id, updateData);

      if (response && typeof response === 'object' && response.data) {
        isSuccess.value = true;
        successMessage.value = 'Данные кандидата успешно обновлены';

        const updatedCandidate = response.data.data as Candidate;

        // Вызываем callback при успешном обновлении
        onUpdated?.(updatedCandidate);

        // Автоматически скрываем сообщение об успехе через 2 секунды
        setTimeout(() => {
          isSuccess.value = false;
          onClosePopup?.();
        }, 2000);

        return updatedCandidate;
      } else {
        // Обработка неожиданного формата ответа
        console.warn('[handleUpdate] Неожиданный формат ответа:', response);
        const errorMessage =
          typeof response === 'string'
            ? response
            : (response as any)?.message || 'Неизвестная ошибка сервера';

        const errors = parseServerErrors({
          message: errorMessage,
          response: {
            status: 500,
            _data: { message: errorMessage },
          },
        });
        serverErrors.value = errors;
        return null;
      }
    } catch (error: any) {
      console.error('[handleUpdate] Ошибка при обновлении кандидата:', error);
      const errors = parseServerErrors(error);
      serverErrors.value = errors;
      return null;
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    // Состояние
    isSubmitting,
    serverErrors,
    isSuccess,
    successMessage,

    // Методы
    handleDelete,
    handleUpdate,
    resetFormState,

    // Вспомогательные функции (если нужны снаружи)
    parseServerErrors,
    isFile,
  };
}
