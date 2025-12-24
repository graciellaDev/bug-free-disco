import type { FormConfig } from '@/types/form';
import TiptapEditor from '@/components/TiptapEditor.vue';

export const emailToCandidateFormConfig: FormConfig = {
  fields: [
    {
      name: 'subject',
      label: 'Тема письма',
      type: 'text',
      placeholder: 'Например: Приглашаем на вакансию',
      required: true,
      validation: {
        required: true,
        message: 'Тема письма обязательна для заполнения',
      },
    },
    {
      name: 'body',
      label: 'Содержание письма',
      type: 'custom',
      component: TiptapEditor,
      required: true,
      row: 5,
      placeholder: 'Начните вводить...',
      validation: {
        required: true,
        minLength: 10,
        message: 'Напишите хоть что-нибудь... Не менее 10 символов',
      },
    },
  ],
};
