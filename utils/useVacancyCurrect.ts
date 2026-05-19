/**
 * Живой снимок вакансии с вкладки InfoTab для префилла публикаций (Avito и др.).
 * inject('vacancyCurrect') у родителя часто статичен; useState обновляется при каждом изменении формы.
 */
export function useVacancyCurrectLive() {
  return useState<Record<string, unknown> | null>('vacancyCurrectLive', () => null)
}

export function setVacancyCurrectLive(snapshot: Record<string, unknown> | null) {
  const state = useVacancyCurrectLive()
  state.value = snapshot && typeof snapshot === 'object' ? { ...snapshot } : null
}
