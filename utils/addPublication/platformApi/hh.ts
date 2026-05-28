import { loadPublicationPlatformBundle } from '@/utils/addPublication/loadPublicationPlatformBundle'

type HhMod = Awaited<ReturnType<typeof loadPublicationPlatformBundle<'hh'>>>

async function hh(): Promise<HhMod> {
  return loadPublicationPlatformBundle('hh')
}

export const profileHh = () => hh().then((m) => m.getHhProfile())
export const typesHh = (...args: Parameters<HhMod['getAvailableTypes']>) =>
  hh().then((m) => m.getAvailableTypes(...args))
export const addDraftHh = (...args: Parameters<HhMod['addHhDraft']>) =>
  hh().then((m) => m.addHhDraft(...args))
export const publishVacancyToHh = (...args: Parameters<HhMod['publishHhVacancy']>) =>
  hh().then((m) => m.publishHhVacancy(...args))
export const getRolesHh = () => hh().then((m) => m.getHhRoles())
export const getAreasHh = (...args: Parameters<HhMod['getAreas']>) =>
  hh().then((m) => m.getAreas(...args))
export const getAddressesHh = (...args: Parameters<HhMod['getAddresses']>) =>
  hh().then((m) => m.getAddresses(...args))
export const getAvailablePublicationsHh = (...args: Parameters<HhMod['getAvailablePublications']>) =>
  hh().then((m) => m.getAvailablePublications(...args))
export const getHhPublicationById = (...args: Parameters<HhMod['getHhPublicationById']>) =>
  hh().then((m) => m.getHhPublicationById(...args))
