const STORAGE_KEY = 'jobly:candidate-list-navigation';

export type CandidateListNavigationContext = {
  version: 1;
  queryParams: Record<string, string | number>;
  /** Кэш id после первой загрузки на карточке */
  ids?: number[];
  total?: number;
};

function canUseSessionStorage(): boolean {
  return typeof sessionStorage !== 'undefined';
}

export function saveCandidateListNavigationContext(
  queryParams: Record<string, string | number>
): void {
  if (!canUseSessionStorage()) return;
  const payload: CandidateListNavigationContext = {
    version: 1,
    queryParams: { ...queryParams },
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function readCandidateListNavigationContext(): CandidateListNavigationContext | null {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CandidateListNavigationContext;
    if (parsed?.version !== 1 || !parsed.queryParams) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function updateCandidateListNavigationIds(
  ids: number[],
  total?: number
): void {
  const ctx = readCandidateListNavigationContext();
  if (!ctx || !canUseSessionStorage()) return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...ctx,
        ids,
        total: total ?? ids.length,
      } satisfies CandidateListNavigationContext)
    );
  } catch {
    // ignore
  }
}
