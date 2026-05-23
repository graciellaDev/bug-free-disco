import type { VacancyOpeningReasonOption } from '~/utils/vacancyOpeningReasonsList';

/** Поля заявки из API → форма «Новая заявка». */
export function mapApplicationDetailToNewForm(
  app: Record<string, unknown> | null | undefined,
  reasonOptions: VacancyOpeningReasonOption[] = []
): Record<string, unknown> {
  if (!app || typeof app !== 'object') return {};

  const divisionRaw = app.division;
  let division: { id: number | null; name: string } | null = null;
  if (
    typeof divisionRaw === 'object' &&
    divisionRaw !== null &&
    'name' in divisionRaw
  ) {
    const d = divisionRaw as { id?: number; name?: string };
    division = {
      id: d.id ?? null,
      name: String(d.name ?? '').trim(),
    };
  } else if (typeof divisionRaw === 'string' && divisionRaw.trim()) {
    division = { id: null, name: divisionRaw.trim() };
  }

  const reasonRaw = app.reason;
  let reason: string | number | null = null;
  if (typeof reasonRaw === 'object' && reasonRaw !== null && 'name' in reasonRaw) {
    const name = String((reasonRaw as { name?: string }).name ?? '').trim();
    const found = reasonOptions.find(o => o.name === name);
    reason = found?.value ?? name;
  } else if (reasonRaw != null && reasonRaw !== '') {
    const reasonStr = String(reasonRaw).trim();
    const found = reasonOptions.find(
      o => o.name === reasonStr || String(o.value) === reasonStr
    );
    reason = found?.value ?? reasonStr;
  }

  const responsibleRaw = app.responsible;
  let responsible: { id: number; name: string } | null = null;
  if (
    typeof responsibleRaw === 'object' &&
    responsibleRaw !== null &&
    'id' in responsibleRaw
  ) {
    const r = responsibleRaw as { id?: number; name?: string };
    if (r.id != null) {
      responsible = {
        id: Number(r.id),
        name: String(r.name ?? '').trim(),
      };
    }
  }

  return {
    position: app.position ?? '',
    division,
    city: app.city ?? '',
    count: app.count ?? null,
    salaryFrom: app.salaryFrom ?? null,
    salaryTo: app.salaryTo ?? null,
    currency: app.currency ?? null,
    reason,
    dateStart: app.dateStart ?? null,
    dateWork: app.dateWork ?? null,
    require: app.require ?? '',
    duty: app.duty ?? '',
    conditions: app.conditions ?? '',
    comments: app.comments ?? '',
    responsible,
  };
}
