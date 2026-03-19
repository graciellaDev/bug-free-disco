import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface EmailTemplateItem {
  id: number;
  name: string;
  subject: string;
  body: string;
}

export async function getEmailTemplates(): Promise<EmailTemplateItem[]> {
  const response = await apiGet<EmailTemplateItem[]>('/email-templates');
  return response?.data ?? [];
}

export async function createEmailTemplate(payload: { name: string; subject: string; body: string }): Promise<EmailTemplateItem> {
  const response = await apiPost<EmailTemplateItem>('/email-templates', payload);
  return response?.data;
}

export async function updateEmailTemplate(id: number, payload: { name?: string; subject?: string; body?: string }): Promise<EmailTemplateItem> {
  const response = await apiPut<EmailTemplateItem>(`/email-templates/${id}`, payload);
  return response?.data;
}

export async function deleteEmailTemplate(id: number): Promise<void> {
  await apiDelete(`/email-templates/${id}`);
}
