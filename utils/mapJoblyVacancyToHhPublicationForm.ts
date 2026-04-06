/**
 * Сопоставление данных вакансии Jobly (вкладка «Описание», GET /api/vacancies/{id})
 * с полями формы публикации на hh.ru (те же ключи, что уходят в publishVacancy → Laravel → HH API).
 */

import experience from '~/src/data/experience.json';
import {
  HH_EDUCATION_LAVEL,
  HH_EMPLOYMENT_TYPES,
} from '@/src/constants';

type VacancyLike = Record<string, unknown>;
type FormDataLike = Record<string, any>;

function pick(v: VacancyLike, keys: string[]): unknown {
  for (const k of keys) {
    const x = v[k];
    if (x !== undefined && x !== null && x !== '') {
      return x;
    }
  }
  return undefined;
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

  const code = pick(vacancy, ['code']);
  if (code != null && String(code).trim() !== '') {
    data.code = String(code);
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

  const empStr = vacancy.employment;
  if (typeof empStr === 'string' && empStr.trim() !== '') {
    const found =
      HH_EMPLOYMENT_TYPES.find(
        e => e.name === empStr || e.siteName === empStr
      ) ?? null;
    if (found) {
      data.employment_form = found;
    }
  }

  const expId = vacancy.experience;
  if (typeof expId === 'string' && expId.trim() !== '') {
    const expOption = (experience as Array<{ id: string; name: string; value: string }>).find(
      opt => opt.id === expId
    );
    if (expOption) {
      data.experience = {
        id: expOption.id,
        name: expOption.name,
        value: expOption.value,
      };
    }
  }

  const edu = vacancy.education;
  if (typeof edu === 'string' && edu.trim() !== '') {
    const level = HH_EDUCATION_LAVEL.find(item => item.name === edu);
    if (level) {
      data.education_level = level;
    }
  }

  const skillsRaw = vacancy.skills ?? vacancy.phrases;
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
