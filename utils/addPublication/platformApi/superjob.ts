import { loadPublicationPlatformBundle } from '@/utils/addPublication/loadPublicationPlatformBundle'

type SjMod = Awaited<ReturnType<typeof loadPublicationPlatformBundle<'superjob'>>>

async function sj(): Promise<SjMod> {
  return loadPublicationPlatformBundle('superjob')
}

export const updatePublicationSuperjob = (
  ...args: Parameters<SjMod['updateSuperjobPublication']>
) => sj().then((m) => m.updateSuperjobPublication(...args))
export const getSuperjobVacancy = (...args: Parameters<SjMod['getSuperjobVacancy']>) =>
  sj().then((m) => m.getSuperjobVacancy(...args))
export const getSuperjobCatalogues = (...args: Parameters<SjMod['getSuperjobCatalogues']>) =>
  sj().then((m) => m.getSuperjobCatalogues(...args))
export const getSuperjobTowns = (...args: Parameters<SjMod['getSuperjobTowns']>) =>
  sj().then((m) => m.getSuperjobTowns(...args))
export const publishVacancyToSuperjob = (...args: Parameters<SjMod['publishSuperjobVacancy']>) =>
  sj().then((m) => m.publishSuperjobVacancy(...args))
export const mapVacancyToSuperjobPayload = (
  ...args: Parameters<SjMod['mapVacancyToSuperjobPayload']>
) => sj().then((m) => m.mapVacancyToSuperjobPayload(...args))
