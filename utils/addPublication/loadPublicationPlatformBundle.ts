import {
  normalizePublicationPlatformBundle,
  preloadPublicationPlatformBundle,
  type PublicationPlatformBundle,
} from '@/utils/addPublication/preloadPlatformBundle'

export type { PublicationPlatformBundle }
export { normalizePublicationPlatformBundle, preloadPublicationPlatformBundle }

type BundleMap = {
  avito: typeof import('@/utils/addPublication/bundles/avito')
  rabota: typeof import('@/utils/addPublication/bundles/rabota')
  superjob: typeof import('@/utils/addPublication/bundles/superjob')
  hh: typeof import('@/utils/addPublication/bundles/hh')
}

const cache = new Map<PublicationPlatformBundle, Promise<BundleMap[PublicationPlatformBundle]>>()

export function loadPublicationPlatformBundle<K extends PublicationPlatformBundle>(
  platform: K,
): Promise<BundleMap[K]> {
  const existing = cache.get(platform)
  if (existing) return existing as Promise<BundleMap[K]>

  const promise = preloadPublicationPlatformBundle(platform).then((mod) => {
    if (!mod) throw new Error(`loadPublicationPlatformBundle: пустой модуль для ${platform}`)
    return mod as BundleMap[K]
  })
  cache.set(platform, promise)
  return promise
}
