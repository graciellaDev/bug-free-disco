/** Динамические чанки API по платформе (не тянем все *Account в один бандл). */

export type PublicationPlatformBundle = 'avito' | 'rabota' | 'superjob' | 'hh'

export function normalizePublicationPlatformBundle(
  platform: string | null | undefined,
): PublicationPlatformBundle | null {
  const p = String(platform ?? '')
    .trim()
    .toLowerCase()
  if (p === 'avito' || p === 'avito.ru') return 'avito'
  if (p === 'rabota' || p === 'rabota.ru') return 'rabota'
  if (p === 'superjob' || p === 'superjob.ru') return 'superjob'
  if (p === 'hh' || p === 'hh.ru') return 'hh'
  return null
}

const loaders: Record<PublicationPlatformBundle, () => Promise<unknown>> = {
  avito: () => import('@/utils/addPublication/bundles/avito'),
  rabota: () => import('@/utils/addPublication/bundles/rabota'),
  superjob: () => import('@/utils/addPublication/bundles/superjob'),
  hh: () => import('@/utils/addPublication/bundles/hh'),
}

/** Прелоад чанка платформы (PublishTab / открытие модалки). */
export function preloadPublicationPlatformBundle(platform: string | null | undefined) {
  const key = normalizePublicationPlatformBundle(platform)
  if (!key) return Promise.resolve(null)
  return loaders[key]()
}
