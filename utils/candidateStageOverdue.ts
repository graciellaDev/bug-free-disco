import type { Candidate } from '@/types/candidates'

export type CandidateStageOverdueInfo = {
  overdue: boolean
  daysOn: number | null
  maxDays: number | null
  /** Текст для бейджа / подсказки */
  hint: string | null
}

function readApiOverdue(candidate: Candidate): CandidateStageOverdueInfo | null {
  const hasApiFields =
    candidate.stage_overdue === true ||
    candidate.stage_days_on != null ||
    candidate.stage_max_days != null
  if (!hasApiFields) {
    return null
  }

  const overdue = candidate.stage_overdue === true
  const daysOn =
    candidate.stage_days_on != null && Number.isFinite(Number(candidate.stage_days_on))
      ? Number(candidate.stage_days_on)
      : null
  const maxDays =
    candidate.stage_max_days != null && Number.isFinite(Number(candidate.stage_max_days))
      ? Number(candidate.stage_max_days)
      : null

  return {
    overdue,
    daysOn,
    maxDays,
    hint: buildHint(overdue, daysOn, maxDays),
  }
}

function buildHint(
  overdue: boolean,
  daysOn: number | null,
  maxDays: number | null
): string | null {
  if (daysOn == null) return null
  if (maxDays == null) {
    return `На этапе ${daysOn} дн.`
  }
  if (overdue) {
    return `На этапе ${daysOn} дн. (лимит ${maxDays} дн.)`
  }
  return `На этапе ${daysOn} из ${maxDays} дн.`
}

/** Просрочка по полям API или (запасной вариант) по этапам вакансии + created_at. */
export function getCandidateStageOverdueInfo(
  candidate: Candidate | null | undefined,
  vacancyStages?: Array<{ id: number; max_days?: number | null }>
): CandidateStageOverdueInfo {
  if (!candidate) {
    return { overdue: false, daysOn: null, maxDays: null, hint: null }
  }

  const fromApi = readApiOverdue(candidate)
  if (fromApi) {
    return fromApi
  }

  const stageId = candidate.stage
  if (stageId == null || !vacancyStages?.length) {
    return { overdue: false, daysOn: null, maxDays: null, hint: null }
  }

  const stage = vacancyStages.find((s) => s.id === stageId)
  const maxDays = stage?.max_days ?? null
  if (maxDays == null) {
    return { overdue: false, daysOn: null, maxDays: null, hint: null }
  }

  const entered = candidate.created_at ? new Date(candidate.created_at) : null
  if (!entered || Number.isNaN(entered.getTime())) {
    return { overdue: false, daysOn: null, maxDays, hint: null }
  }

  const now = new Date()
  const daysOn = Math.max(
    0,
    Math.floor((now.setHours(0, 0, 0, 0) - new Date(entered.setHours(0, 0, 0, 0)).getTime()) / 86400000)
  )
  const overdue = daysOn > maxDays

  return {
    overdue,
    daysOn,
    maxDays,
    hint: buildHint(overdue, daysOn, maxDays),
  }
}
