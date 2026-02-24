/**
 * Публичный справочник городов России из API hh.ru.
 * Используется для поля «Город» в формах (сотрудники, публикации и т.д.).
 */
export default defineEventHandler(async () => {
  const response = await $fetch<any[]>('https://api.hh.ru/areas', {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'JobLy/1.0',
    },
  })

  const russia = response?.find((area) => area.id === 113 || area.id === '113')
  if (!russia?.areas || !Array.isArray(russia.areas)) {
    return []
  }

  const cities: Array<{ id: string; name: string }> = []
  const extractCities = (areas: any[]) => {
    if (!areas?.length) return
    areas.forEach((area) => {
      if (!area.areas || area.areas.length === 0) {
        cities.push({ id: String(area.id), name: area.name })
      } else {
        extractCities(area.areas)
      }
    })
  }
  extractCities(russia.areas)
  cities.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  return cities
})
