export default defineEventHandler(async () => {
  const data = await $fetch<any[]>('https://api.hh.ru/languages', {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'JobLy/1.0',
    },
  })
  return data || []
})
