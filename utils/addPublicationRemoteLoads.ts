/**
 * Что может уходить в сеть при инициализации AddPublication (до первого рендера или фоном).
 * «Новая публикация с карточки» = selectedPlatform задан, editingVacancy нет.
 *
 * Порядок и наличие запросов зависят от режима и платформы; после оптимизаций часть
 * вызовов пропускается или выполняется один раз / в фоне.
 */
export const ADD_PUBLICATION_REMOTE_LOADS = [
  {
    id: 'vacancy_get',
    description:
      'GET /api/vacancies/{id} — только если нет локальной вакансии в provide(vacancyCurrect) с тем же id или id вакансии не совпал.',
    when: 'Чаще при редактировании из таблицы; с карточки «Опубликовать» обычно не вызывается.',
  },
  {
    id: 'hh_publication_roles',
    description:
      'GET публикации HH по platform_id (professional_roles с API HH) — только режим editingVacancy + HH.',
    when: 'Редактирование активной публикации.',
  },
  {
    id: 'phrases',
    description:
      'Словарь/подсказки для навыков (getPhrases → API Jobly) — для новой публикации с карточки подгружается в фоне после показа формы.',
    when: 'По умолчанию; не блокирует первый рендер для карточки «Опубликовать».',
  },
  {
    id: 'hh_profile_types_tariffs',
    description:
      'Профиль HH, типы публикаций, доступные тарифы (через utils/hhAccount).',
    when:
      'Карточка «Опубликовать» hh.ru: после показа формы (onMounted), не блокирует первый рендер. Иначе — в setup как раньше.',
  },
  {
    id: 'hh_roles_areas_addresses',
    description:
      'Справочники HH: роли, города, адреса (getRoles / getAreas / getAddresses и т.д.) — loadDictionaries(\'hh\').',
    when:
      'Карточка «Опубликовать» hh.ru: отложенно после показа формы. Редактирование / прочие сценарии — в setup при старте.',
  },
  {
    id: 'avito_profile_dicts',
    description: 'Профиль Avito + loadDictionaries(\'avito\').',
    when: 'Платформа Avito.',
  },
  {
    id: 'rabota_profile_dicts',
    description: 'Профиль Rabota + loadDictionaries(\'rabota\').',
    when: 'Платформа Rabota.',
  },
  {
    id: 'superjob_catalogues_towns',
    description: 'Каталоги/города SuperJob + при редактировании getSuperjobVacancy.',
    when: 'Платформа SuperJob или редактирование SJ-публикации.',
  },
  {
    id: 'vacancy_fields_drivers',
    description:
      'GET справочника полей вакансии (водительские категории) — при маппинге drivers из БД в буквы A–E в fillFormFromCurrentVacancy.',
    when: 'Если в данных вакансии есть drivers с числовыми id.',
  },
] as const
