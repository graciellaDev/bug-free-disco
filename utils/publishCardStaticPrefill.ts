/**
 * Поля вакансии Jobly, которые можно подставить в форму размещения сразу
 * (без справочников платформы и без API-маппинга).
 */

type VacancyLike = Record<string, unknown>

export function pickJoblyVacancyName(vacancy: VacancyLike | null | undefined): string {
  if (!vacancy || typeof vacancy !== 'object') return ''
  const raw =
    vacancy.name ??
    vacancy.title ??
    vacancy.vacancy_name ??
    vacancy.vacancyTitle ??
    vacancy.position ??
    vacancy.position_name
  return String(raw ?? '').trim()
}

function pickNonEmptyString(v: VacancyLike, keys: string[]): string {
  for (const k of keys) {
    const x = v[k]
    if (x != null && String(x).trim() !== '') {
      return String(x).trim()
    }
  }
  return ''
}

/** Черновик hh.ru: только текст и числа до загрузки export-map и каталогов. */
export function buildJoblyPublishStaticHhDraft(
  vacancy: VacancyLike | null | undefined,
): Record<string, unknown> {
  if (!vacancy || typeof vacancy !== 'object') {
    return {}
  }

  const draft: Record<string, unknown> = {}

  const name = pickJoblyVacancyName(vacancy)
  if (name) draft.name = name

  const description = pickNonEmptyString(vacancy, ['description', 'html_description'])
  if (description) draft.description = description

  const code = pickNonEmptyString(vacancy, ['code'])
  if (code) draft.code = code

  const fromRaw = vacancy.salary_from
  const toRaw = vacancy.salary_to
  const from = fromRaw != null && fromRaw !== '' ? Number(fromRaw) : NaN
  const to = toRaw != null && toRaw !== '' ? Number(toRaw) : NaN
  if (!Number.isNaN(from) || !Number.isNaN(to)) {
    const sr: Record<string, unknown> = {}
    if (!Number.isNaN(from)) sr.from = from
    if (!Number.isNaN(to)) sr.to = to
    draft.salary_range = sr
  }

  const loc = pickNonEmptyString(vacancy, ['location', 'city'])
  if (loc) draft.area = { name: loc }

  const workAddr = pickNonEmptyString(vacancy, ['work_address', 'workAddress'])
  if (workAddr) {
    draft.address = { raw: workAddr }
  }

  const execName = pickNonEmptyString(vacancy, ['executor_name', 'executorName'])
  const execPhone = pickNonEmptyString(vacancy, ['executor_phone', 'executorPhone'])
  const execEmail = pickNonEmptyString(vacancy, ['executor_email', 'executorEmail'])
  if (execName || execPhone || execEmail) {
    const contacts: Record<string, unknown> = {}
    if (execName) contacts.name = execName
    if (execEmail) contacts.email = execEmail
    if (execPhone) contacts.phones = [{ formatted: execPhone }]
    draft.contacts = contacts
  }

  return draft
}
