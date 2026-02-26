import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client';
import type { VacancyStage } from '@/types/vacancy';

export interface FunnelTemplateItem {
  id: number;
  name: string;
  created_at?: string;
  stages_count?: number;
}

export async function getFunnelTemplates(): Promise<FunnelTemplateItem[]> {
  const response = await apiGet<FunnelTemplateItem[]>('/funnel-templates');
  return response.data ?? [];
}

export interface FunnelTemplateStageItem {
  id: number;
  name: string;
  position: number;
  fixed: boolean;
  max_days?: number | null;
}

export async function getFunnelTemplateStages(
  templateId: number
): Promise<FunnelTemplateStageItem[]> {
  const response = await apiGet<FunnelTemplateStageItem[]>(
    `/funnel-templates/${templateId}/stages`
  );
  return response.data ?? [];
}

export async function createTemplateStage(
  templateId: number,
  name: string
): Promise<FunnelTemplateStageItem[]> {
  const response = await apiPost<
    FunnelTemplateStageItem[],
    { name: string }
  >(`/funnel-templates/${templateId}/stages`, { name });
  return response.data ?? [];
}

export async function reorderTemplateStages(
  templateId: number,
  stageIds: number[]
): Promise<FunnelTemplateStageItem[]> {
  const response = await apiPut<
    FunnelTemplateStageItem[],
    { stage_ids: number[] }
  >(`/funnel-templates/${templateId}/stages/reorder`, { stage_ids: stageIds });
  return response.data ?? [];
}

export async function updateTemplateStage(
  templateId: number,
  stageId: number,
  payload: { name?: string; max_days?: number | null }
): Promise<FunnelTemplateStageItem[]> {
  const response = await apiPatch<
    FunnelTemplateStageItem[],
    { name?: string; max_days?: number | null }
  >(`/funnel-templates/${templateId}/stages/${stageId}`, payload);
  return response.data ?? [];
}

export async function deleteTemplateStage(
  templateId: number,
  stageId: number
): Promise<FunnelTemplateStageItem[]> {
  const response = await apiDelete<FunnelTemplateStageItem[]>(
    `/funnel-templates/${templateId}/stages/${stageId}`
  );
  return response.data ?? [];
}

export async function createFunnelTemplate(
  name: string,
  vacancyId: number | string
): Promise<FunnelTemplateItem> {
  const response = await apiPost<
    FunnelTemplateItem,
    { name: string; vacancy_id: number }
  >('/funnel-templates', {
    name,
    vacancy_id: Number(vacancyId),
  });
  return response.data!;
}

/** Создать новый шаблон с этапами по умолчанию (без вакансии). */
export async function createFunnelTemplateWithDefaults(
  name: string = 'Новая воронка'
): Promise<FunnelTemplateItem> {
  const response = await apiPost<FunnelTemplateItem, { name: string }>(
    '/funnel-templates',
    { name }
  );
  return response.data!;
}

/** Создать копию шаблона с названием "Копия: {название}". */
export async function duplicateFunnelTemplate(
  templateId: number
): Promise<FunnelTemplateItem> {
  const response = await apiPost<FunnelTemplateItem, void>(
    `/funnel-templates/${templateId}/duplicate`,
    undefined
  );
  return response.data!;
}

export async function applyFunnelTemplate(
  vacancyId: number | string,
  templateId: number
): Promise<VacancyStage[]> {
  const response = await apiPost<VacancyStage[], { template_id: number }>(
    `/vacancies/${vacancyId}/stages/apply-template`,
    { template_id: templateId }
  );
  return (response?.data ?? []) as VacancyStage[];
}

export async function updateFunnelTemplate(
  templateId: number,
  payload: { name: string }
): Promise<FunnelTemplateItem> {
  const response = await apiPatch<FunnelTemplateItem, { name: string }>(
    `/funnel-templates/${templateId}`,
    payload
  );
  return response.data!;
}

export async function deleteFunnelTemplate(
  templateId: number
): Promise<void> {
  await apiDelete(`/funnel-templates/${templateId}`);
}
