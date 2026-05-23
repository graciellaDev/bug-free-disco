/** URL фото с hh.ru и др. — в <img> напрямую не открывается (токен, Referer). */
export function isExternalCandidatePhotoUrl(path: string | null | undefined): boolean {
  const p = path?.trim()
  if (!p) return false
  return /^https?:\/\//i.test(p)
}
