import TiptapEditor from '@/components/TiptapEditor.vue';
import type { FormConfig } from '@/types/form';

export function getRefuseFormConfig(sendEmail: boolean): FormConfig {
  return {
    fields: [
      {
        name: 'sendEmail',
        label: 'Отправить письмо кандидату',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        name: 'subject',
        label: 'Тема письма',
        type: 'text',
        required: sendEmail,
        hidden: !sendEmail,
        validation: sendEmail
          ? {
              required: true,
              message: 'Тема письма обязательна для заполнения',
            }
          : undefined,
        // disabled: !sendEmail,
      },
      {
        name: 'body',
        label: 'Содержание письма',
        type: 'custom',
        component: TiptapEditor,
        hidden: !sendEmail,
        required: sendEmail,
        row: 5,
        validation: sendEmail
          ? {
              required: true,
              minLength: 10,
              message: 'Напишите хоть что-нибудь... Не менее 10 символов',
            }
          : undefined,
        // disabled: !sendEmail,
      },
    ],
  };
}
