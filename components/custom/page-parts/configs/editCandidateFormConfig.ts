import InputUpload from '~/components/custom/InputUpload.vue';
import { normalizeUsername } from '@/helpers/messengers';

import type { FormConfig } from '@/types/form';

export const editCandidateFormConfig: FormConfig = {
  fields: [
    {
      name: 'surname',
      label: 'Фамилия',
      type: 'text',
      placeholder: 'Введите фамилию',
      required: false,
      row: 1,
      colSpan: 4,
      validation: {
        required: false,
      },
    },
    {
      name: 'firstname',
      label: 'Имя',
      type: 'text',
      placeholder: 'Введите имя',
      required: true,
      row: 1,
      colSpan: 4,
      validation: {
        required: true,
        message: 'Имя обязательно для заполнения',
        minLength: 3,
      },
    },
    {
      name: 'patronymic',
      label: 'Отчество',
      type: 'text',
      placeholder: 'Введите отчество',
      required: false,
      row: 1,
      colSpan: 4,
      validation: {
        required: false,
      },
    },
    {
      name: 'resume',
      label: 'Название резюме',
      type: 'text',
      placeholder: 'Например, Менеджер по продажам',
      row: 2,
    },
    {
      name: 'email',
      label: 'Электронная почта',
      type: 'email',
      placeholder: 'Введите email',
      required: true,
      row: 3,
      validation: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Введите корректный email',
      },
    },
    {
      name: 'phone',
      label: 'Телефон',
      type: 'tel',
      placeholder: '+7',
      defaultValue: '+7',
      row: 4,
      validation: {
        pattern: /^\+7\d{10}$/,
        message: 'Введите корректный номер телефона (+7XXXXXXXXXX)',
      },
    },
    {
      name: 'telegram',
      label: 'Телеграм',
      type: 'text',
      placeholder: '@имя_пользователя',
      row: 5,
      colSpan: 6,
      validation: {
        custom: (value: string) => {
          if (!value) return null;

          const cleanValue = normalizeUsername(value);

          if (!cleanValue) return null; // Пустое значение допустимо

          // Проверяем формат username (без @)
          if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(cleanValue)) {
            return 'Имя пользователя должно быть от 5 до 32 символов, начинаться с буквы и содержать только латинские буквы, цифры и подчеркивания';
          }

          // Дополнительные проверки
          if (cleanValue.includes('__')) {
            return 'Имя пользователя не может содержать двойные подчеркивания';
          }

          if (cleanValue.endsWith('_')) {
            return 'Имя пользователя не может заканчиваться подчеркиванием';
          }

          return null;
        },
      },
    },
    {
      name: 'messengerMax',
      label: 'Max',
      type: 'text',
      placeholder: 'токен из ссылки-приглашения',
      row: 5,
      colSpan: 6,
      validation: {
        custom: (value: string) => {
          if (!value) return null;

          const cleanValue = normalizeUsername(value);

          if (!cleanValue) return null;

          // Проверяем только токен/идентификатор
          // Формат: буквы (a-z, A-Z), цифры (0-9), дефисы (-), длина 40-80 символов
          const tokenPattern = /^[a-zA-Z0-9-]{40,80}$/;

          if (!tokenPattern.test(cleanValue)) {
            return 'Токен должен быть длиной от 40 до 80 символов и содержать только буквы, цифры и дефисы';
          }

          // Дополнительная проверка: должен содержать хотя бы одну букву и одну цифру
          if (!/[a-zA-Z]/.test(cleanValue)) {
            return 'Токен должен содержать хотя бы одну букву';
          }

          if (!/[0-9]/.test(cleanValue)) {
            return 'Токен должен содержать хотя бы одну цифру';
          }

          // Не должен состоять только из дефисов
          if (cleanValue.replace(/-/g, '').length === 0) {
            return 'Некорректный токен';
          }

          return null; // Валидный токен
        },
      },
    },
    {
      name: 'photo',
      label: 'Фотография кандидата',
      type: 'custom',
      component: InputUpload,
      props: {
        fileType: 'img',
        minStyle: false,
      },
      row: 6,
      validation: {
        custom: (value: File | string | null): string | null => {
          if (value instanceof File) {
            if (value.size > 5 * 1024 * 1024) {
              return 'Размер файла не должен превышать 5MB';
            }
            if (!value.type.startsWith('image/')) {
              return 'Выберите изображение';
            }
          }
          return null;
        },
      },
    },
  ],
  submitButtonText: 'Сохранить изменения',
  cancelButtonText: 'Отмена',
  showCancelButton: true,
};
