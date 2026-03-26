import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';

export type RejectionReasonRow = {
  id: number;
  name: string;
  sort_order: number;
};

export type RejectionReasonsPayload = {
  use_rejection_reasons: boolean;
  reasons: RejectionReasonRow[];
};

export async function getRejectionReasons() {
  return apiGet<RejectionReasonsPayload>('/rejection-reasons');
}

export async function patchRejectionReasonsSettings(body: {
  use_rejection_reasons: boolean;
}) {
  return apiPatch<{ use_rejection_reasons: boolean }>(
    '/rejection-reasons/settings',
    body
  );
}

export async function createRejectionReason(body: {
  name: string;
  sort_order?: number;
}) {
  return apiPost<{ data: RejectionReasonRow }>('/rejection-reasons', body);
}

export async function updateRejectionReason(
  id: number,
  body: { name?: string; sort_order?: number }
) {
  return apiPut<{ data: RejectionReasonRow }>(
    `/rejection-reasons/${id}`,
    body
  );
}

export async function deleteRejectionReason(id: number) {
  return apiDelete<{ message: string }>(`/rejection-reasons/${id}`);
}
