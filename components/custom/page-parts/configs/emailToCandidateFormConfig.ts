import type { FormConfig } from '@/types/form';

export const emailToCandidateFormConfig: FormConfig = {
  fields: [
    {
      name: 'subject',
      label: 'Тема письма',
      type: 'text',
      placeholder: 'Например: Приглашаем на вакансию',
      validation: {
        required: true,
        message: 'Тема письма обязательна для заполнения',
      },
    },
    {
      name: 'body',
      label: 'Содержание письма',
      type: 'textarea',
      placeholder: 'Начните вводить...',
      validation: {
        required: true,
        minLength: 10,
        message: 'Напишите хоть что-нибудь... Не менее 10 символов',
      },
    },
  ],
};
