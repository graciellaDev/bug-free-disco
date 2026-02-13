import XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const data = [
  ['Название поля', 'Переменная', 'Тип поля', 'Обязательно или нет', 'Ограничения и особенности поля'],
  ['Название должности', 'name', 'string', 'Да', '5–220 символов, без спецсимволов'],
  ['Описание вакансии', 'description', 'string (HTML)', 'Да', 'До 700 символов, HTML-разметка'],
  ['Код вакансии', 'code', 'string', 'Нет', 'Внутренний идентификатор (например, из 1С)'],
  ['Регион', 'areas', 'array of objects', 'Да', 'Массив [{ "id": "1" }], id из справочника /areas'],
  ['Профессиональные роли', 'professional_roles', 'array of objects', 'Да', 'Массив [{ "id": "..." }] из справочника /professional_roles'],
  ['Тип занятости', 'employment_form / employment', 'object', 'Зависит от условий', '{ "id": "full", "name": "Полная занятость" }. Варианты: FULL, PART, PROJECT, VOLUNTEER, PROBATION, FLY_IN_FLY_OUT, SIDE_JOB'],
  ['График работы', 'work_schedule_by_days / schedule', 'object', 'Зависит от условий', '{ "id": "fullDay", "name": "Полный день" }. Справочник work_schedule'],
  ['Формат работы', 'workSpace', 'string', 'Зависит от условий', '"1" — офис, "2" — гибрид, "3" — удалённо'],
  ['Опыт работы', 'experience', 'object', 'Зависит от условий', '{ "id": "noExperience", "name": "Нет опыта" }. Варианты: noExperience, between1And3, between3And6, moreThan6'],
  ['Уровень образования', 'education_level / education', 'object', 'Нет', '{ "id": "higher", "name": "Высшее" }. Справочник education'],
  ['Зарплата (от)', 'salary_range.from / salary.from', 'number', 'Нет', 'Целое число'],
  ['Зарплата (до)', 'salary_range.to / salary.to', 'number', 'Нет', 'Целое число'],
  ['Валюта зарплаты', 'salary_range.currency / salary.currency', 'string', 'При указании зарплаты', 'RUR, USD, EUR и др.'],
  ['Зарплата до вычета налогов', 'salary_range.gross / salary.gross', 'boolean', 'При указании зарплаты', 'true — до налогов, false — на руки'],
  ['Отрасль', 'industry', 'object', 'Зависит от условий', '{ "id": "...", "name": "..." } из справочника /industries'],
  ['Ключевые навыки (фразы)', 'phrases', 'array of numbers', 'Нет', 'Массив id из справочника /suggest/professional_roles'],
  ['Срок публикации (дней)', 'days', 'string', 'Нет', '"15", "20", "30", "40", "45", "60", "90", "120", "180" или "other"'],
  ['Департамент', 'department', 'object', 'Нет', '{ "id": "...", "name": "..." } из справочника департаментов работодателя'],
  ['Адрес', 'address', 'object', 'Нет', '{ "city", "street", "building", "description", "lat", "lng", "metro_stations" }'],
  ['Дополнительные условия', 'driver_license_types, billing_types и др.', 'varies', 'Нет', 'accept_handicapped, accept_kids, accept_temporary и т.п.'],
  ['Принимать от 14 лет', 'accept_kids', 'boolean', 'Нет', 'true — вакансия для соискателей 14+, только для подтверждённых работодателей РФ'],
  ['Тип вакансии', 'type', 'object', 'Нет', '{ "id": "open", "name": "Открытая" } или closed'],
  ['Требовать сопроводительное письмо', 'response_letter_required', 'boolean', 'Нет', 'Обязательно ли сопроводительное письмо'],
  ['Показывать логотип в поиске', 'show_logo_in_search', 'boolean', 'Нет', 'Показывать ли логотип работодателя'],
  ['Рабочие дни', 'working_days', 'array', 'Нет', 'Массив объектов с id из справочника'],
  ['Интервалы рабочего времени', 'working_time_intervals', 'array', 'Нет', 'Массив объектов с id'],
  ['Режимы рабочего времени', 'working_time_modes', 'array', 'Нет', 'Массив объектов с id'],
  ['Временное трудоустройство', 'accept_temporary', 'boolean', 'Нет', 'Допустимо ли временное трудоустройство'],
  ['Тип биллинга', 'billing_type', 'object', 'Нет', 'free, standard, standard_plus, premium'],
  ['Типы водительских прав', 'driver_license_types', 'array', 'Нет', 'A, B, C, D, E, BE, CE, DE, TM, TB'],
  ['Платформа размещения', 'platform', 'object', 'Нет', 'Доп. параметры размещения'],
];

const ws = XLSX.utils.aoa_to_sheet(data);
ws['!cols'] = [
  { wch: 28 },
  { wch: 35 },
  { wch: 22 },
  { wch: 22 },
  { wch: 70 },
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Поля вакансии HH');

const outputPath = join(__dirname, '..', 'docs', 'HH_VACANCY_FIELDS.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('Файл сохранён:', outputPath);
