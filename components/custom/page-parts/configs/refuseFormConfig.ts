import TiptapEditor from '@/components/TiptapEditor.vue';
import type { FormConfig, FormFieldConfig } from '@/types/form';

export type RefuseReasonOption = { id: number; name: string };

export function getRefuseFormConfig(
  sendEmail: boolean,
  opts?: {
    showReasonField: boolean;
    reasonRequired: boolean;
    reasonOptions: RefuseReasonOption[];
  }
): FormConfig {
  const reasonFields: FormFieldConfig[] = [];
  if (
    opts?.showReasonField &&
    opts.reasonOptions.length > 0
  ) {
    reasonFields.push({
      name: 'rejection_reason_id',
      label: 'Причина отказа',
      type: 'select',
      placeholder: 'Выберите причину',
      options: opts.reasonOptions.map(r => ({ value: r.id, name: r.name })),
      required: opts.reasonRequired,
      validation: opts.reasonRequired
        ? { required: true, message: 'Выберите причину отказа' }
        : undefined,
    });
  }

  return {
    fields: [
      ...reasonFields,
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
      },
    ],
  };
}

