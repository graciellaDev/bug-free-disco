/**
 * Формирование ссылки на страницу публикации вакансии на платформе.
 * Используется для кнопки «Посмотреть публикацию» в активных публикациях.
 *
 * platforms_data[0]: { id: platformId (1=hh, 2=avito, 3=rabota, 4=superjob), platform_id: внешний id вакансии на платформе, url?: строка }
 */

import { getAvitoPublicationOriginalLocalOnly, getAvitoPublicationOriginalSync } from '@/utils/getVacancies'

export const PLATFORM_IDS = {
  HH: 1,
  AVITO: 2,
  RABOTA: 3,
  SUPERJOB: 4,
} as const;

export interface PlatformDataItem {
  id?: number | string;
  platform_id?: string | number;
  url?: string;
  [key: string]: unknown;
}

const AVITO_SITE_ORIGIN = 'https://www.avito.ru';

/**
 * Полный URL публикации на avito.ru: относительный путь из API или уже абсолютная ссылка.
 */
export function normalizeAvitoPublicationUrl(savedUrl: string): string {
  const u = savedUrl.trim();
  if (!u) return AVITO_SITE_ORIGIN;
  if (/^https?:\/\//i.test(u)) return u;
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${AVITO_SITE_ORIGIN}${path}`;
}

function extractAvitoUrlFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const params = p.params && typeof p.params === 'object' ? (p.params as Record<string, unknown>) : null
  const nestedData = p.data && typeof p.data === 'object' ? (p.data as Record<string, unknown>) : null
  const candidates = [
    p.url,
    p.link,
    params?.url,
    params?.link,
    nestedData?.url,
    nestedData?.link,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return null
}

/**
 * Возвращает URL страницы публикации на платформе или null, если ссылку построить нельзя.
 * @param item - строка таблицы активных публикаций (вакансия с platforms_data)
 */
export function getPublicationViewUrl(item: {
  platforms_data?: PlatformDataItem[] | null;
  [key: string]: unknown;
}): string | null {
  const platformData = item?.platforms_data?.[0];
  if (!platformData) return null;

  const platformId = platformData.id != null ? Number(platformData.id) : NaN;
  const externalId = platformData.platform_id != null ? String(platformData.platform_id) : null;
  const savedUrl = typeof platformData.url === 'string' && platformData.url ? platformData.url : null;

  if (savedUrl) {
    if (platformId === PLATFORM_IDS.AVITO) {
      return normalizeAvitoPublicationUrl(savedUrl);
    }
    return savedUrl;
  }
  if (!externalId) return null;

  switch (Number.isFinite(platformId) ? platformId : -1) {
    case PLATFORM_IDS.HH:
      return `https://hh.ru/vacancy/${externalId}`;
    case PLATFORM_IDS.AVITO:
      // Корректный URL задаёт только поле `url` из снимка Job API (slug + регион); по одному id собрать нельзя.
      return null;
    case PLATFORM_IDS.RABOTA:
      return `https://www.rabota.ru/vacancy/${externalId}/`;
    case PLATFORM_IDS.SUPERJOB:
      return `https://www.superjob.ru/vakansii/${externalId}.html`;
    default:
      return null;
  }
}

/**
 * URL для «Посмотреть публикацию»: сначала данные строки (в т.ч. `url` из API списка),
 * для Avito без `url` — `GET …/avito-publication-original` (синк как в админке), затем `local_only=1` из БД.
 */
export async function resolvePublicationViewUrl(item: {
  platforms_data?: PlatformDataItem[] | null;
  id?: string | number;
  [key: string]: unknown;
}): Promise<string | null> {
  const sync = getPublicationViewUrl(item)
  if (sync) return sync

  const pd = item?.platforms_data?.[0]
  const platformId = pd?.id != null ? Number(pd.id) : NaN
  if (!pd || platformId !== PLATFORM_IDS.AVITO) {
    if (import.meta.dev) {
      console.info('[publicationViewUrl] skip async resolve: not avito platform', {
        vacancyId: item?.id ?? null,
        platformIdRaw: pd?.id ?? null,
        platformIdNormalized: Number.isFinite(platformId) ? platformId : null,
      })
    }
    return null
  }

  const joblyVacancyId = item.id != null ? Number(item.id) : NaN
  if (!Number.isFinite(joblyVacancyId) || joblyVacancyId <= 0) {
    if (import.meta.dev) {
      console.info('[publicationViewUrl] invalid vacancy id for async resolve', {
        vacancyIdRaw: item?.id ?? null,
      })
    }
    return null
  }

  try {
    const res = await getAvitoPublicationOriginalSync(joblyVacancyId)
    if (!res?.error) {
      const po = res?.data?.payload_original
      if (po && typeof po === 'object') {
        const raw = extractAvitoUrlFromPayload(po)
        if (raw) {
          return normalizeAvitoPublicationUrl(raw)
        }
      }
    }
    if (import.meta.dev) {
      console.info('[publicationViewUrl] sync snapshot has no url, fallback to local_only', {
        vacancyId: joblyVacancyId,
        syncError: res?.error ?? null,
      })
    }
    const resLocal = await getAvitoPublicationOriginalLocalOnly(joblyVacancyId)
    if (resLocal?.error) {
      if (import.meta.dev) {
        console.info('[publicationViewUrl] local_only snapshot error', {
          vacancyId: joblyVacancyId,
          error: resLocal.error,
        })
      }
      return null
    }
    const po = resLocal?.data?.payload_original
    if (!po || typeof po !== 'object') {
      if (import.meta.dev) {
        console.info('[publicationViewUrl] local_only snapshot missing payload', {
          vacancyId: joblyVacancyId,
        })
      }
      return null
    }
    const raw = extractAvitoUrlFromPayload(po)
    if (raw) {
      return normalizeAvitoPublicationUrl(raw)
    }
    if (import.meta.dev) {
      console.info('[publicationViewUrl] snapshot has no avito url', {
        vacancyId: joblyVacancyId,
      })
    }
  } catch {
    if (import.meta.dev) {
      console.info('[publicationViewUrl] async resolve failed', {
        vacancyId: joblyVacancyId,
      })
    }
    return null
  }
  return null
}
