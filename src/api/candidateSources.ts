import { apiDelete, apiGet, apiPost, apiPut } from './client';

export type CandidateSourceRow = {
  id: number;
  name: string;
  code: string;
};

export type CandidateSourcesPayload = {
  sources: CandidateSourceRow[];
};

export async function getCandidateSources() {
  return apiGet<CandidateSourcesPayload>('/candidate-sources');
}

export async function createCandidateSource(body: {
  name: string;
  code?: string;
}) {
  return apiPost<{ data: CandidateSourceRow }>('/candidate-sources', body);
}

export async function updateCandidateSource(
  id: number,
  body: { name?: string; code?: string }
) {
  return apiPut<{ data: CandidateSourceRow }>(`/candidate-sources/${id}`, body);
}

export async function deleteCandidateSource(id: number) {
  return apiDelete<{ message: string }>(`/candidate-sources/${id}`);
}

