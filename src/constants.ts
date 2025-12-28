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
    siteName: 'Стажировка',
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

export const BASE_FUNNEL_ID = 1;
