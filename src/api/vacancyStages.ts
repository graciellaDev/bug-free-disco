import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client';
import type { VacancyStage } from '@/types/vacancy';

export async function getVacancyStages(
  vacancyId: number | string
): Promise<VacancyStage[]> {
  const response = await apiGet<VacancyStage[]>(
    `/vacancies/${vacancyId}/stages`
  );
  return response.data ?? [];
}

export async function createVacancyStage(
  vacancyId: number | string,
  name: string
): Promise<VacancyStage[]> {
  const response = await apiPost<VacancyStage[], { name: string }>(
    `/vacancies/${vacancyId}/stages`,
    { name }
  );
  return response.data ?? [];
}

export async function reorderVacancyStages(
  vacancyId: number | string,
  stageIds: number[]
): Promise<VacancyStage[]> {
  const response = await apiPut<VacancyStage[], { stage_ids: number[] }>(
    `/vacancies/${vacancyId}/stages/reorder`,
    { stage_ids: stageIds }
  );
  return response.data ?? [];
}

export async function renameVacancyStage(
  vacancyId: number | string,
  stageId: number,
  name: string
): Promise<VacancyStage[]> {
  const response = await apiPatch<VacancyStage[], { name: string }>(
    `/vacancies/${vacancyId}/stages/${stageId}`,
    { name }
  );
  return response.data ?? [];
}

export async function updateVacancyStageMaxDays(
  vacancyId: number | string,
  stageId: number,
  maxDays: number | null
): Promise<VacancyStage[]> {
  const response = await apiPatch<VacancyStage[], { max_days: number | null }>(
    `/vacancies/${vacancyId}/stages/${stageId}`,
    { max_days: maxDays }
  );
  return response.data ?? [];
}

export async function deleteVacancyStage(
  vacancyId: number | string,
  stageId: number
): Promise<VacancyStage[]> {
  const response = await apiDelete<VacancyStage[]>(
    `/vacancies/${vacancyId}/stages/${stageId}`
  );
  return response.data ?? [];
}
