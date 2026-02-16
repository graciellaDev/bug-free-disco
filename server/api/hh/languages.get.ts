/**
 * Справочник языков для формы вакансии (без запроса к Laravel).
 */
export default defineEventHandler(() => {
  return [
    { id: 'rus', name: 'Русский' },
    { id: 'eng', name: 'Английский' },
    { id: 'deu', name: 'Немецкий' },
    { id: 'fra', name: 'Французский' },
    { id: 'ita', name: 'Итальянский' },
    { id: 'spa', name: 'Испанский' },
    { id: 'chi', name: 'Китайский' },
  ]
})
