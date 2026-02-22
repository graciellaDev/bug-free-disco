/**
 * Формирование ссылки на страницу публикации вакансии на платформе.
 * Используется для кнопки «Посмотреть публикацию» в активных публикациях.
 *
 * platforms_data[0]: { id: platformId (1=hh, 2=avito, 3=rabota, 4=superjob), platform_id: внешний id вакансии на платформе, url?: строка }
 */

export const PLATFORM_IDS = {
  HH: 1,
  AVITO: 2,
  RABOTA: 3,
  SUPERJOB: 4,
} as const;

export interface PlatformDataItem {
  id?: number;
  platform_id?: string | number;
  url?: string;
  [key: string]: unknown;
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

  const platformId = platformData.id;
  const externalId = platformData.platform_id != null ? String(platformData.platform_id) : null;
  const savedUrl = typeof platformData.url === 'string' && platformData.url ? platformData.url : null;

  if (savedUrl) return savedUrl;
  if (!externalId) return null;

  switch (platformId) {
    case PLATFORM_IDS.HH:
      return `https://hh.ru/vacancy/${externalId}`;
    case PLATFORM_IDS.AVITO:
      return `https://www.avito.ru/rossiya/rabota/${externalId}`;
    case PLATFORM_IDS.RABOTA:
      return `https://www.rabota.ru/vacancy/${externalId}/`;
    case PLATFORM_IDS.SUPERJOB:
      return `https://www.superjob.ru/vakansii/${externalId}.html`;
    default:
      return null;
  }
}
