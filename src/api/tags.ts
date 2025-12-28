import { apiPost } from './client';
import type { ApiSuccessResponse } from '@/types/clients';
import type { TagCandidate } from '@/types/candidates';

type TagCreateResponse = ApiSuccessResponse<TagCandidate>;

type TagCreateRequest = {
  name: string;
};

export async function createTag(name: string): Promise<TagCreateResponse> {
  return await apiPost<TagCreateResponse['data']>('/tags', {
    name,
  } as TagCreateRequest);
}
