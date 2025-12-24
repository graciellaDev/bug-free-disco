import { getCandidates } from '@/src/api/candidates';
import type { Candidate } from '@/types/candidates';
import type { DataListConfig } from '@/types/data-list';

export function useCandidateList(
  filters?: Ref<Record<string, any>>,
  autoLoad?: boolean
) {
  const config: DataListConfig<Candidate> = {
    fetchFn: async (page, params) => {
      const allParams = { ...params, ...(filters?.value || {}) };

      const { candidates, pagination } = await getCandidates(page, allParams);
      return {
        items: candidates,
        pagination: {
          current_page: pagination.current_page,
          last_page: pagination.last_page,
          total: pagination.total,
          per_page: pagination.per_page,
        },
        autoLoad,
      };
    },
    fetchParams: filters,
    mode: 'pagination',
    autoLoad: true,
  };

  return useDataList<Candidate>(config);
}
