import type { FormConfig } from '@/types/form';

export const addCandidateFormConfig: FormConfig = {
  fields: [
    {
      name: 'firstname',
      label: 'Имя',
      type: 'text',
      placeholder: 'Введите имя',
      required: true,
      row: 1, // Первая строка
      colSpan: 6, // Половина ширины (6 из 12)
      validation: {
        required: true,
        message: 'Имя обязательно для заполнения',
        minLength: 3,
      },
    },
    {
      name: 'surname',
      label: 'Фамилия',
      type: 'text',
      placeholder: 'Введите фамилию',
      required: false,
      row: 1, // Первая строка (рядом с Имя)
      colSpan: 6, // Половина ширины (6 из 12)
      validation: {
        required: false,
      },
    },
    {
      name: 'resume',
      label: 'Название резюме',
      type: 'text',
      placeholder: 'Например, Менеджер по продажам',
      row: 2, // Вторая строка
    },
    {
      name: 'email',
      label: 'Электронная почта',
      type: 'email',
      placeholder: 'Введите email',
      required: true,
      row: 3, // Третья строка
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
      row: 4, // Четвертая строка
      validation: {
        pattern: /^\+7\d{10}$/,
        message: 'Введите корректный номер телефона (+7XXXXXXXXXX)',
      },
    },
  ],
  submitButtonText: 'Добавить кандидата',
  cancelButtonText: 'Отмена',
  showCancelButton: true,
};
