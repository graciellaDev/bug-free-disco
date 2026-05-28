import { loadPublicationPlatformBundle } from '@/utils/addPublication/loadPublicationPlatformBundle'

type AvitoMod = Awaited<ReturnType<typeof loadPublicationPlatformBundle<'avito'>>>

async function avito(): Promise<AvitoMod> {
  return loadPublicationPlatformBundle('avito')
}

export const addDraftAvito = (...args: Parameters<AvitoMod['addAvitoDraft']>) =>
  avito().then((m) => m.addAvitoDraft(...args))
export const profileAvito = () => avito().then((m) => m.getAvitoProfile())
export const publishVacancyToAvito = (...args: Parameters<AvitoMod['publishAvitoVacancy']>) =>
  avito().then((m) => m.publishAvitoVacancy(...args))
export const getAvitoCatalogs = (...args: Parameters<AvitoMod['getAvitoCatalogs']>) =>
  avito().then((m) => m.getAvitoCatalogs(...args))
export const getAvitoSpecializationMappings = (
  ...args: Parameters<AvitoMod['getAvitoSpecializationMappings']>
) => avito().then((m) => m.getAvitoSpecializationMappings(...args))
export const getAvitoExperienceMappings = (
  ...args: Parameters<AvitoMod['getAvitoExperienceMappings']>
) => avito().then((m) => m.getAvitoExperienceMappings(...args))
export const getAvitoEmploymentMappings = (
  ...args: Parameters<AvitoMod['getAvitoEmploymentMappings']>
) => avito().then((m) => m.getAvitoEmploymentMappings(...args))
export const getAvitoContractMappings = (...args: Parameters<AvitoMod['getAvitoContractMappings']>) =>
  avito().then((m) => m.getAvitoContractMappings(...args))
export const getAvitoSalaryPeriodMappings = (
  ...args: Parameters<AvitoMod['getAvitoSalaryPeriodMappings']>
) => avito().then((m) => m.getAvitoSalaryPeriodMappings(...args))
export const getAvitoSalaryTaxMappings = (
  ...args: Parameters<AvitoMod['getAvitoSalaryTaxMappings']>
) => avito().then((m) => m.getAvitoSalaryTaxMappings(...args))
export const getAvitoPayoutFrequencyMappings = (
  ...args: Parameters<AvitoMod['getAvitoPayoutFrequencyMappings']>
) => avito().then((m) => m.getAvitoPayoutFrequencyMappings(...args))
export const getAvitoContactEmployees = (...args: Parameters<AvitoMod['getAvitoContactEmployees']>) =>
  avito().then((m) => m.getAvitoContactEmployees(...args))
export const buildAvitoPublicationRequestBody = (
  ...args: Parameters<AvitoMod['buildAvitoPublicationRequestBody']>
) => avito().then((m) => m.buildAvitoPublicationRequestBody(...args))
