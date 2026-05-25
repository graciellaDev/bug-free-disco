/** Запасной список, если API недоступен (совпадает с VacancyOpeningReasonDefaults на бэкенде). */
export const VACANCY_OPENING_REASON_FALLBACK = [
  'Замена позиции',
  'Расширение штата',
  'Новая позиция',
  'Замена в декрете',
  'Временная замена',
  'Сезонный набор',
  'Новый проект',
  'Рост объёма работ',
] as const;

export type VacancyOpeningReasonOption = {
  name: string;
  value: number;
};

interface ApiVacancyOpeningReason {
  id: number;
  name: string;
  sort_order?: number;
}

interface ApiResponse {
  data?: {
    reasons?: ApiVacancyOpeningReason[];
  };
}

export async function fetchVacancyOpeningReasons(): Promise<VacancyOpeningReasonOption[]> {
  const config = useRuntimeConfig();
  const authToken = useCookie('auth_token').value;
  const authUser = useCookie('auth_user').value;

  try {
    const response = await $fetch<ApiResponse>(
      `${config.public.apiBase}/vacancy-opening-reasons`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Auth-User': `${authUser}`,
        },
      }
    );

    const reasons = response?.data?.reasons;
    if (Array.isArray(reasons) && reasons.length > 0) {
      return reasons.map(r => ({
        name: r.name,
        value: r.id,
      }));
    }
  } catch (e) {
    console.warn('[vacancyOpeningReasonsList] API недоступен, используем запасной список', e);
  }

  return VACANCY_OPENING_REASON_FALLBACK.map((name, index) => ({
    name,
    value: index,
  }));
}
