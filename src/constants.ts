// src/constants.ts

export const API_YANDEX_KEY = '6e076d59-ad48-44d7-88c6-5af6477f36f4';
export const API_YANDEX_SUGGEST = '90ca3da5-d0a2-4831-82eb-c097f9f70a2f';

export const PLATFORMS_DEFAULT = [
  {
    platform: 'hh',
    domain: 'hh.ru',
    svg: 'hh-50',
    isAuthenticated: false,
    data: null,
  },
  {
    platform: 'rabota',
    domain: 'rabota.ru',
    svg: 'rabota-50',
    isAuthenticated: false,
    data: null,
  },
  {
    platform: 'zarplata',
    domain: 'zarplata.ru',
    svg: 'zarplata-50',
    isAuthenticated: false,
    data: null,
  },
  {
    platform: 'superjob',
    domain: 'superjob.ru',
    svg: 'superjob-50',
    isAuthenticated: false,
    data: null,
  },
  {
    platform: 'careerist',
    domain: 'careerist.ru',
    svg: 'careerist-50',
    isAuthenticated: false,
    data: null,
  },
  {
    platform: 'youla',
    domain: 'youla.ru',
    svg: 'popup-youla',
    isAuthenticated: false,
    data: null,
  },
  {
    platform: 'avito',
    domain: 'avito.ru',
    svg: 'avito-50',
    isAuthenticated: false,
    data: null,
  },
];

export const PLATFORM_PROPERTIES = {
  hh: {
    name: {
      name: 'name',
    },
    description: {
      name: 'description',
    },
    code: {
      name: 'code',
    },
  },
};

export const HH_EMPLOYMENT_TYPES = [
  {
    id: 'FULL',
    name: 'Полная занятость',
    siteName: 'Полная',
  },
  {
    id: 'PART',
    name: 'Подработка',
    siteName: 'Частичная',
  },
  {
    id: 'PROJECT',
    name: 'Проект или разовое задание',
    siteName: 'Временная',
  },
  {
    id: 'FLY_IN_FLY_OUT',
    name: 'Вахта',
    siteName: 'Вахта',
  },
  {
    id: 'SIDE_JOB',
    name: 'Подработка',
    siteName: 'Подработка',
  },
];

export const HH_WORKING_HOURS = [
  {
    id: 'HOURS_2',
    name: '2 часа',
  },
  {
    id: 'HOURS_3',
    name: '3 часа',
  },
  {
    id: 'HOURS_4',
    name: '4 часа',
  },
  {
    id: 'HOURS_5',
    name: '5 часов',
  },
  {
    id: 'HOURS_6',
    name: '6 часов',
  },
  {
    id: 'HOURS_7',
    name: '7 часов',
  },
  {
    id: 'HOURS_8',
    name: '8 часов',
  },
  {
    id: 'HOURS_9',
    name: '9 часов',
  },
  {
    id: 'HOURS_10',
    name: '10 часов',
  },
  {
    id: 'HOURS_11',
    name: '11 часов',
  },
  {
    id: 'HOURS_12',
    name: '12 часов',
  },
  {
    id: 'HOURS_24',
    name: '24 часа',
  },
  {
    id: 'FLEXIBLE',
    name: 'По договорённости',
  },
  {
    id: 'OTHER',
    name: 'Другое',
  },
];

export const HH_SALARY_TYPE = [
    {
        "id": "MONTH",
        "name": "За месяц"
    },
    {
        "id": "SHIFT",
        "name": "За смену"
    },
    {
        "id": "HOUR",
        "name": "За час"
    },
    {
        "id": "FLY_IN_FLY_OUT",
        "name": "За вахту"
    },
    {
        "id": "SERVICE",
        "name": "За услугу"
    }
]

export const HH_SALARY_FREQUENCY = [
    {
        "id": "DAILY",
        "name": "Ежедневно"
    },
    {
        "id": "WEEKLY",
        "name": "Раз в неделю"
    },
    {
        "id": "TWICE_PER_MONTH",
        "name": "Два раза в месяц"
    },
    {
        "id": "MONTHLY",
        "name": "Раз в месяц"
    },
    {
        "id": "PER_PROJECT",
        "name": "За проект"
    }
];

export const HH_DRIVER_LICENSE_TYPES = [
        {
            "id": "A",
            "name": "A"
        },
        {
            "id": "B",
            "name": "B"
        },
        {
            "id": "C",
            "name": "C"
        },
        {
            "id": "D",
            "name": "D"
        },
        {
            "id": "E",
            "name": "E"
        },
        {
            "id": "BE",
            "name": "BE"
        },
        {
            "id": "CE",
            "name": "CE"
        },
        {
            "id": "DE",
            "name": "DE"
        },
        {
            "id": "TM",
            "name": "TM"
        },
        {
            "id": "TB",
            "name": "TB"
        }
];

export const HH_ADDITIONAL_CONDITIONS = [
  {
    id: "accept_handicapped",
    name: "Cоискатели с инвалидностью"
  },
  {
    id: "accept_incomplete_resumes",
    name: "С неполным резюме"
  },
  {
    id: "accept_temporary",
    name: "Соискатели с временным трудоустройством"
  },
  {
    id: "age_restriction_14",
    name: "От 14 лет"
  },
  {
    id: "age_restriction_16",
    name: "От 16 лет"
  },
  {
    id: "auto_response",
    name: "Кандидаты с автооткликами"
  },
];

export const HH_BILLING_TYPES = [
        {
            "id": "free",
            "name": "Бесплатная"
        },
        {
            "id": "standard",
            "name": "Стандарт"
        },
        {
            "id": "standard_plus",
            "name": "Стандарт 2"
        },
        {
            "id": "premium",
            "name": "Премиум"
        }
];

export const HH_EDUCATION_LAVEL = [
  {
    id: 'secondary',
    name: 'Среднее',
  },
  {
    id: 'special_secondary',
    name: 'Среднее специальное',
  },
  {
    id: 'unfinished_higher',
    name: 'Неоконченное высшее',
  },
  {
    id: 'higher',
    name: 'Высшее',
  },
  {
    id: 'bachelor',
    name: 'Бакалавр',
  },
  {
    id: 'master',
    name: 'Магистр',
  },
  {
    id: 'candidate',
    name: 'Кандидат наук',
  },
  {
    id: 'doctor',
    name: 'Доктор наук',
  },
];

export const HH_WORK_SCHEDULE_BY_DAYS = [
  {
    id: 'SIX_ON_ONE_OFF',
    name: '6/1',
  },
  {
    id: 'FIVE_ON_TWO_OFF',
    name: '5/2',
  },
  {
    id: 'FOUR_ON_FOUR_OFF',
    name: '4/4',
  },
  {
    id: 'FOUR_ON_THREE_OFF',
    name: '4/3',
  },
  {
    id: 'FOUR_ON_TWO_OFF',
    name: '4/2',
  },
  {
    id: 'THREE_ON_THREE_OFF',
    name: '3/3',
  },
  {
    id: 'THREE_ON_TWO_OFF',
    name: '3/2',
  },
  {
    id: 'TWO_ON_TWO_OFF',
    name: '2/2',
  },
  {
    id: 'TWO_ON_ONE_OFF',
    name: '2/1',
  },
  {
    id: 'ONE_ON_THREE_OFF',
    name: '1/3',
  },
  {
    id: 'ONE_ON_TWO_OFF',
    name: '1/2',
  },
  {
    id: 'WEEKEND',
    name: 'По выходным',
  },
  {
    id: 'FLEXIBLE',
    name: 'Свободный',
  },
  {
    id: 'OTHER',
    name: 'Другое',
  },
];

export const HH_EXPERIENCE_DAYS = [
        {
            "id": "DAYS_15",
            "name": "15"
        },
        {
            "id": "DAYS_20",
            "name": "20"
        },
        {
            "id": "DAYS_30",
            "name": "30"
        },
        {
            "id": "DAYS_40",
            "name": "40"
        },
        {
            "id": "DAYS_45",
            "name": "45"
        },
        {
            "id": "DAYS_60",
            "name": "60"
        },
        {
            "id": "DAYS_90",
            "name": "90"
        },
        {
            "id": "DAYS_120",
            "name": "120"
        },
        {
            "id": "DAYS_180",
            "name": "180"
        },
        {
            "id": "OTHER",
            "name": "Другое"
        }
];

export const HH_WORK_FORMAT = [
  {
            "id": "ON_SITE",
            "name": "На месте работодателя",
            "description": 'Сотрудники работают в офисе',
        },
        {
            "id": "REMOTE",
            "name": "Удалённо",
            "description": 'Сотрудники работают как офисе, так и дома',
        },
        {
            "id": "HYBRID",
            "name": "Гибрид",
            "description": 'Сотрудники работают из дома',
        },
        {
            "id": "FIELD_WORK",
            "name": "Разъездной",
            "description": 'Сотрудники часто ездят в разные места для выполнения задач',
        }
];
export const BASE_FUNNEL_ID = 1;
