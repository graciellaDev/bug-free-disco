import { apiDelete, apiGet, apiPost, apiPut } from './client';

export type AccountCustomFieldRow = {
  id: number;
  account_id: number;
  name: string;
  field_kind: string;
  options: string[] | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export async function fetchAccountCustomFields() {
  return (
    await apiGet<AccountCustomFieldRow[]>('/account/custom-fields', undefined, {
      skipLoader: true,
    })
  ).data;
}

export async function createAccountCustomField(body: {
  name: string;
  field_kind: string;
  options?: string[];
}) {
  return (await apiPost<AccountCustomFieldRow>('/account/custom-fields', body)).data;
}

export async function updateAccountCustomField(
  id: number,
  body: {
    name?: string;
    field_kind?: string;
    options?: string[];
    sort_order?: number;
  }
) {
  return (await apiPut<AccountCustomFieldRow>(`/account/custom-fields/${id}`, body))
    .data;
}

export async function reorderAccountCustomFields(orderedIds: number[]) {
  return (
    await apiPut<AccountCustomFieldRow[]>(
      '/account/custom-fields/reorder',
      { ordered_ids: orderedIds },
      { skipLoader: true }
    )
  ).data;
}

export async function deleteAccountCustomField(id: number) {
  await apiDelete(`/account/custom-fields/${id}`, { skipLoader: true });
}
