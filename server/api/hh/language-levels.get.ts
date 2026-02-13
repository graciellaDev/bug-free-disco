export default defineEventHandler(async () => {
  const data = await $fetch<{ language_level?: Array<{ id: string; name: string }> }>(
    'https://api.hh.ru/dictionaries',
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'JobLy/1.0',
      },
    }
  )
  return data?.language_level || []
})
