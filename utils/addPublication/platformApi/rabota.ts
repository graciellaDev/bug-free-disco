import { loadPublicationPlatformBundle } from '@/utils/addPublication/loadPublicationPlatformBundle'

/** Синхронный разбор ответа GET /rabota/profile — не тянет bundle API. */
export { extractRabotaProfileContactDefaults } from '@/utils/rabotaAccount'

type RabotaMod = Awaited<ReturnType<typeof loadPublicationPlatformBundle<'rabota'>>>

async function rabota(): Promise<RabotaMod> {
  return loadPublicationPlatformBundle('rabota')
}

export const profileRabota = () => rabota().then((m) => m.getRabotaProfile())
export const addDraftRabota = (...args: Parameters<RabotaMod['addRabotaDraft']>) =>
  rabota().then((m) => m.addRabotaDraft(...args))
export const publishVacancyToRabota = (...args: Parameters<RabotaMod['publishRabotaVacancy']>) =>
  rabota().then((m) => m.publishRabotaVacancy(...args))
export const updateVacancyToRabota = (...args: Parameters<RabotaMod['updateRabotaVacancy']>) =>
  rabota().then((m) => m.updateRabotaVacancy(...args))
export const getRabotaVacancyById = (...args: Parameters<RabotaMod['getRabotaVacancy']>) =>
  rabota().then((m) => m.getRabotaVacancy(...args))
export const getRabotaPublication = (...args: Parameters<RabotaMod['getRabotaPublication']>) =>
  rabota().then((m) => m.getRabotaPublication(...args))
export const publishRabotaVacancies = (...args: Parameters<RabotaMod['publishRabotaVacancies']>) =>
  rabota().then((m) => m.publishRabotaVacancies(...args))
export const createAndPublishRabotaVacancy = (
  ...args: Parameters<RabotaMod['createAndPublishRabotaVacancy']>
) => rabota().then((m) => m.createAndPublishRabotaVacancy(...args))
export {
  extractRabotaCreatedVacancyId,
  extractRabotaVacancyIdFromFormData,
  unwrapRabotaPublicationPayload,
} from '@/utils/rabotaAccount'
export const getRabotaProfessionsHierarchy = (
  ...args: Parameters<RabotaMod['getRabotaProfessionsHierarchy']>
) => rabota().then((m) => m.getRabotaProfessionsHierarchy(...args))
export const getRabotaProfessionsByProfessionalRole = (
  ...args: Parameters<RabotaMod['getRabotaProfessionsByProfessionalRole']>
) => rabota().then((m) => m.getRabotaProfessionsByProfessionalRole(...args))
export const searchRabotaRegions = (...args: Parameters<RabotaMod['searchRabotaRegions']>) =>
  rabota().then((m) => m.searchRabotaRegions(...args))
export const getEmploymentTypesRabota = (...args: Parameters<RabotaMod['getEmploymentTypes']>) =>
  rabota().then((m) => m.getEmploymentTypes(...args))
export const getRabotaEmploymentByEmploymentId = (
  ...args: Parameters<RabotaMod['getRabotaEmploymentByEmploymentId']>
) => rabota().then((m) => m.getRabotaEmploymentByEmploymentId(...args))
export const getRabotaExperienceByExperienceId = (
  ...args: Parameters<RabotaMod['getRabotaExperienceByExperienceId']>
) => rabota().then((m) => m.getRabotaExperienceByExperienceId(...args))
export const getExperienceLevelsRabota = (...args: Parameters<RabotaMod['getExperienceLevels']>) =>
  rabota().then((m) => m.getExperienceLevels(...args))
export const getEducationsRabota = (...args: Parameters<RabotaMod['getEducations']>) =>
  rabota().then((m) => m.getEducations(...args))
export const getWorkCategoriesRabota = (...args: Parameters<RabotaMod['getWorkCategories']>) =>
  rabota().then((m) => m.getWorkCategories(...args))
export const getWorkSchedulesRabota = (...args: Parameters<RabotaMod['getWorkSchedules']>) =>
  rabota().then((m) => m.getWorkSchedules(...args))
export const getWorkingHoursRabota = (...args: Parameters<RabotaMod['getWorkingHours']>) =>
  rabota().then((m) => m.getWorkingHours(...args))
