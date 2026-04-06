/**
 * Сопоставление данных вакансии Jobly (вкладка «Описание», GET /api/vacancies/{id})
 * с полями формы публикации на hh.ru (те же ключи, что уходят в publishVacancy → Laravel → HH API).
 */

import experience from '~/src/data/experience.json';
import currencyList from '~/src/data/currency.json';
import {
  HH_EDUCATION_LAVEL,
  HH_EMPLOYMENT_TYPES,
  HH_SALARY_TYPE,
  HH_SALARY_FREQUENCY,
} from '@/src/constants';

type VacancyLike = Record<string, unknown>;
type FormDataLike = Record<string, any>;
type HhEmploymentRow = (typeof HH_EMPLOYMENT_TYPES)[number];

/**
 * Тип занятости из вакансии Jobly → элемент HH_EMPLOYMENT_TYPES.
 * Важно: у PART и SIDE_JOB в справочнике совпадает `name` («Подработка»), поэтому
 * сначала ищем по `siteName` (как в save через getEmploymentText → Полная/Частичная/Временная/Подработка/Вахта).
 */
export function resolveHhEmploymentFormFromJoblyVacancy(
  vacancy: VacancyLike | null | undefined
): HhEmploymentRow | null {
  if (!vacancy || typeof vacancy !== 'object') {
    return null;
  }
  let raw = vacancy.employment;
  if (raw == null || raw === '') {
    return null;
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    raw = String(Math.trunc(raw));
  }

  if (typeof raw === 'object') {
    const o = raw as { id?: unknown; siteName?: unknown; name?: unknown };
    const id = typeof o.id === 'string' ? o.id.trim() : '';
    if (id) {
      const byId = HH_EMPLOYMENT_TYPES.find(e => e.id === id);
      if (byId) return byId;
    }
    const sn = typeof o.siteName === 'string' ? o.siteName.trim() : '';
    if (sn) {
      const bySn = HH_EMPLOYMENT_TYPES.find(e => e.siteName === sn);
      if (bySn) return bySn;
    }
    const nm = typeof o.name === 'string' ? o.name.trim() : '';
    if (nm) {
      const hits = HH_EMPLOYMENT_TYPES.filter(e => e.name === nm);
      if (hits.length === 1) return hits[0];
    }
    return null;
  }

  let empStr = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  if (!empStr) return null;

  /** Значения из таблицы `employments` (см. сид/дамп): 1 Полная, 2 Частичная, 3 Временная, 4 Стажировка */
  const joblyEmploymentIdToSiteName: Record<string, string> = {
    '1': 'Полная',
    '2': 'Частичная',
    '3': 'Временная',
  };
  if (/^\d+$/.test(empStr) && joblyEmploymentIdToSiteName[empStr]) {
    empStr = joblyEmploymentIdToSiteName[empStr];
  }

  const bySite = HH_EMPLOYMENT_TYPES.find(e => e.siteName === empStr);
  if (bySite) return bySite;

  const byId = HH_EMPLOYMENT_TYPES.find(e => e.id === empStr);
  if (byId) return byId;

  /** Подпись с кнопки InfoTab, если в БД попало имя, а не siteName */
  if (empStr === 'Проект') {
    return HH_EMPLOYMENT_TYPES.find(e => e.id === 'PROJECT') ?? null;
  }

  const byNameHits = HH_EMPLOYMENT_TYPES.filter(e => e.name === empStr);
  if (byNameHits.length === 1) return byNameHits[0];

  return null;
}

function pick(v: VacancyLike, keys: string[]): unknown {
  for (const k of keys) {
    const x = v[k];
    if (x !== undefined && x !== null && x !== '') {
      return x;
    }
  }
  return undefined;
}

function normSalaryLabel(s: string): string {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .trim();
}

/**
 * Дополняет объект формы `data` значениями из вакансии для hh.ru.
 * Не очищает уже введённые пользователем поля: перезаписывает только при наличии источника во vacancy.
 */
export function applyJoblyVacancyToHhPublicationFormData(
  data: FormDataLike,
  vacancy: VacancyLike | null | undefined
): void {
  if (!vacancy || typeof vacancy !== 'object') {
    return;
  }

  const name = pick(vacancy, ['name']);
  if (typeof name === 'string' && name.trim() !== '') {
    data.name = name;
  }

  const description = pick(vacancy, ['description']);
  if (typeof description === 'string') {
    data.description = description;
  }

  if (!data.salary_range || typeof data.salary_range !== 'object') {
    data.salary_range = { from: null, to: null, currency: null };
  }
  const sf = pick(vacancy, ['salary_from']);
  const st = pick(vacancy, ['salary_to']);
  if (sf != null && sf !== '') {
    const n = Number(sf);
    if (!Number.isNaN(n)) {
      data.salary_range.from = n;
    }
  }
  if (st != null && st !== '') {
    const n = Number(st);
    if (!Number.isNaN(n)) {
      data.salary_range.to = n;
    }
  }

  const cur = pick(vacancy, ['currency']);
  if (typeof cur === 'string' && cur.trim() !== '') {
    const hit = (currencyList as { id: string; name: string }[]).find(
      c => c.name === cur.trim()
    );
    if (hit) {
      data.salary_range.currency = hit.id;
    }
  }
  const salFreq = pick(vacancy, ['salary_frequency']);
  if (typeof salFreq === 'string' && salFreq.trim() !== '') {
    const n = normSalaryLabel(salFreq);
    const mode = HH_SALARY_TYPE.find(
      t => normSalaryLabel(t.name) === n || t.name === salFreq.trim()
    );
    if (mode) {
      data.salary_range.mode = { id: mode.id };
    }
  }
  const payFreq = pick(vacancy, ['salary_payment_frequency']);
  if (typeof payFreq === 'string' && payFreq.trim() !== '') {
    const n = normSalaryLabel(payFreq);
    const freq = HH_SALARY_FREQUENCY.find(
      t => normSalaryLabel(t.name) === n || t.name === payFreq.trim()
    );
    if (freq) {
      data.salary_range.frequency = { id: freq.id };
    }
  }

  const empFound = resolveHhEmploymentFormFromJoblyVacancy(vacancy);
  if (empFound) {
    data.employment_form = { ...empFound };
  }

  const expRaw = vacancy.experience;
  if (typeof expRaw === 'string' && expRaw.trim() !== '') {
    const expList = experience as Array<{ id: string; name: string; value: string }>;
    let expOption = expList.find(opt => opt.id === expRaw);
    if (!expOption) {
      expOption = expList.find(opt => opt.name === expRaw.trim());
    }
    if (expOption) {
      data.experience = {
        id: expOption.id,
        name: expOption.name,
        value: expOption.value,
      };
    }
  } else if (typeof expRaw === 'object' && expRaw != null && 'id' in expRaw) {
    const id = String((expRaw as { id?: unknown }).id ?? '').trim();
    if (id) {
      const expList = experience as Array<{ id: string; name: string; value: string }>;
      const expOption = expList.find(opt => opt.id === id);
      if (expOption) {
        data.experience = {
          id: expOption.id,
          name: expOption.name,
          value: expOption.value,
        };
      }
    }
  }

  const edu = vacancy.education;
  if (typeof edu === 'string' && edu.trim() !== '') {
    const level = HH_EDUCATION_LAVEL.find(item => item.name === edu);
    if (level) {
      data.education_level = level;
    }
  }

  // Сначала phrases (ключевые навыки из InfoTab); пустой skills[] не должен перекрывать phrases
  const phrases = vacancy.phrases;
  const skills = vacancy.skills;
  const skillsRaw =
    Array.isArray(phrases) && phrases.length > 0
      ? phrases
      : Array.isArray(skills) && skills.length > 0
        ? skills
        : phrases ?? skills;
  if (skillsRaw != null) {
    data.phrases = Array.isArray(skillsRaw) ? skillsRaw : skillsRaw;
    const arr = Array.isArray(skillsRaw)
      ? skillsRaw
          .map(s =>
            typeof s === 'object' && s != null && 'name' in s
              ? { name: String((s as { name?: unknown }).name ?? '').trim() }
              : { name: String(s ?? '').trim() }
          )
          .filter(o => o.name)
      : typeof skillsRaw === 'string' && skillsRaw.trim()
        ? skillsRaw.split(',').map(s => ({ name: s.trim() })).filter(o => o.name)
        : [];
    data.key_skills = arr;
  }
}
