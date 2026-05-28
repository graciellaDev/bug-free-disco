/**
 * In-memory кэш справочников формы размещения (переживает закрытие модалки).
 * Не кэширует: export-map, контакты Avito, данные конкретной публикации.
 */
export const PUBLICATION_DICT_CACHE_TTL_MS = 30 * 60 * 1000

export const PUBLICATION_DICT_CACHE_KEYS = {
  hh: 'pub-dict:hh',
  rabota: 'pub-dict:rabota',
  superjob: 'pub-dict:superjob',
  avitoCore: 'pub-dict:avito:core',
  avitoSecondary: 'pub-dict:avito:secondary',
  avitoAddressHints: 'pub-dict:avito:address-hints',
} as const

type CacheEntry = {
  storedAt: number
  payload: unknown
}

const store = new Map<string, CacheEntry>()

function cloneForCache<T>(value: T): T {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(value)
    }
  } catch {
    /* fall through */
  }
  return JSON.parse(JSON.stringify(value)) as T
}

export function readPublicationDictCache<T>(
  key: string,
  ttlMs = PUBLICATION_DICT_CACHE_TTL_MS,
): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.storedAt > ttlMs) {
    store.delete(key)
    return null
  }
  return entry.payload as T
}

export function writePublicationDictCache<T>(key: string, payload: T): void {
  store.set(key, {
    storedAt: Date.now(),
    payload: cloneForCache(payload),
  })
}

export function invalidatePublicationDictCache(platform?: 'hh' | 'avito' | 'rabota' | 'superjob'): void {
  if (!platform) {
    store.clear()
    return
  }
  const prefix = `pub-dict:${platform}`
  for (const key of [...store.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      store.delete(key)
    }
  }
}
