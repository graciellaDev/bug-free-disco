import type { TPagination } from './general';
export type DataListMode = 'pagination' | 'infinite';

// export interface DataListPagination {
//   currentPage: number;
//   lastPage: number;
//   total: number;
//   perPage: number;
// }

export interface DataListConfig<T> {
  fetchFn: (
    page: number,
    params?: Record<string, any>
  ) => Promise<{
    items: T[];
    pagination: TPagination;
  }>;

  fetchParams?: Ref<Record<string, any>> | Record<string, any>;
  mode?: DataListMode;
  autoLoad?: boolean;
  initialPage?: number;
}
