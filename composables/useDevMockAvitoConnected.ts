/**
 * Локальная настройка UI: вести себя как при подключённом Avito без токена на бэке.
 * Включается только в dev (nuxt dev) и при NUXT_PUBLIC_MOCK_AVITO_CONNECTED=true.
 */
export function useDevMockAvitoConnected(): boolean {
  const config = useRuntimeConfig()
  const raw = config.public.mockAvitoConnected
  const enabled = raw === true || raw === 'true' || raw === '1'
  if (!enabled) {
    return false
  }
  if (!import.meta.dev) {
    return false
  }
  return true
}
