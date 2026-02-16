/**
 * Публичный справочник профессиональных ролей с hh.ru.
 * Не требует авторизации и привязки HeadHunter — для подгрузки отраслей/специализаций на форме вакансии.
 */
export default defineEventHandler(async () => {
  const data = await $fetch<{ categories: Array<{ id: string; name: string; roles: unknown[] }> }>(
    'https://api.hh.ru/professional_roles',
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'JobLy/1.0',
      },
    }
  )
  return { data: data || { categories: [] } }
})
