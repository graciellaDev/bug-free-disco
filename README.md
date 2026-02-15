# Jobly -- Фронтенд

## Обзор

Фронтенд-часть HR/рекрутинговой платформы Jobly. Приложение обеспечивает управление вакансиями, кандидатами, заявками, а также интеграцию с внешними площадками (HeadHunter, Avito, Rabota.ru).

### Стек технологий

| Технология | Версия | Назначение |
|---|---|---|
| Nuxt 3 | ^3.14 | SSR-фреймворк |
| Vue 3 | latest | UI-фреймворк (Composition API) |
| TypeScript | -- | Типизация |
| Pinia | ^2.3 | Управление состоянием |
| Tailwind CSS | ^3.4 | Утилитарный CSS-фреймворк |
| shadcn-nuxt | ^0.11 | UI-библиотека компонентов |
| Axios | ^1.7 | HTTP-клиент |
| Tiptap | ^2.10 | WYSIWYG-редактор |

---

## Структура директорий

```
front/
├── app.vue                     # Корневой компонент приложения
├── nuxt.config.ts              # Конфигурация Nuxt
├── package.json                # Зависимости и скрипты
├── tsconfig.json               # Конфигурация TypeScript
├── tailwind.config.js          # Конфигурация Tailwind CSS
├── components.json             # Конфигурация shadcn-nuxt
│
├── assets/                     # Статические ресурсы
│   ├── css/
│   │   └── main.scss           # Главный файл стилей
│   └── *.svg, *.png            # Иконки и изображения (~151 файл)
│
├── components/                 # Vue-компоненты
│   ├── chat/                   # Компоненты чата
│   ├── custom/                 # Кастомные компоненты (~102 файла)
│   │   ├── page-parts/         # Компоненты для конкретных страниц
│   │   │   ├── candidate/      # Компоненты кандидатов
│   │   │   ├── vacancy/        # Компоненты вакансий
│   │   │   ├── composables/    # Composables для компонентов
│   │   │   └── configs/        # Конфигурации форм
│   │   └── ...                 # Формы, UI-элементы, бизнес-компоненты
│   ├── platforms/              # Компоненты интеграций с площадками (5 файлов)
│   ├── settings/               # Компоненты настроек (5 файлов)
│   ├── timeline/               # Компоненты таймлайна событий
│   │   ├── index.vue
│   │   ├── TimelineItem.vue
│   │   └── items/              # Типы событий (8 компонентов)
│   ├── ui/                     # shadcn-nuxt UI-компоненты (~51 файл)
│   │   ├── avatar/
│   │   ├── button/
│   │   ├── calendar/
│   │   ├── dialog/
│   │   ├── label/
│   │   ├── radio-group/
│   │   ├── select/
│   │   └── tooltip/
│   ├── StatusVacancy.vue
│   ├── TiptapEditor.vue
│   ├── UiLoader.vue
│   └── VacancyHeader.vue
│
├── composables/                # Vue Composables
│   ├── useDataList.ts          # Пагинация и подгрузка данных
│   └── usePopup.ts             # Управление попапами
│
├── helpers/                    # Вспомогательные функции
│   ├── authToken.ts            # Работа с токенами авторизации
│   ├── date.ts                 # Форматирование дат
│   ├── handlers.ts             # Обработчики событий
│   └── messengers.ts           # Утилиты мессенджеров
│
├── layouts/                    # Макеты страниц (Nuxt Layouts)
│   ├── default.vue             # Основной макет
│   ├── blank.vue               # Пустой макет (страницы авторизации)
│   └── settings.vue            # Макет настроек
│
├── middleware/                  # Middleware маршрутов
│   └── auth.global.ts          # Глобальный middleware авторизации
│
├── pages/                      # Страницы (файловая маршрутизация Nuxt)
│   ├── index.vue               # Главная / Дашборд
│   ├── Activity.vue            # Лента активности
│   ├── Applications.vue        # Заявки
│   ├── Notifications.vue       # Уведомления
│   ├── Reports.vue             # Отчёты
│   ├── Tasks.vue               # Задачи
│   ├── auth/                   # Авторизация
│   ├── candidates/             # Кандидаты
│   ├── vacancies/              # Вакансии
│   ├── settings/               # Настройки
│   ├── create-tabs/            # Табы создания вакансии
│   └── public/                 # Публичные страницы
│
├── plugins/                    # Nuxt-плагины
│   └── loader.ts               # Глобальный лоадер
│
├── public/                     # Публичные статические файлы
│   ├── assets/
│   ├── files/
│   └── favicon.ico
│
├── server/                     # Серверные API-маршруты (Nuxt Server)
│   └── api/
│       └── candidates/
│           └── [id]/
│               └── photo.post.ts  # Загрузка фото кандидата
│
├── src/                        # Исходный код
│   ├── api/                    # API-клиент
│   │   ├── client.ts           # Базовый HTTP-клиент
│   │   ├── candidates.ts       # API кандидатов
│   │   ├── vacancies.ts        # API вакансий
│   │   ├── funnels.ts          # API воронок
│   │   └── tags.ts             # API тегов
│   ├── constants.ts            # Константы приложения
│   └── data/                   # Статические данные / mock-данные (26 JSON-файлов)
│
├── stores/                     # Pinia-хранилища
│   ├── user.ts                 # Данные пользователя (с персистенцией)
│   ├── vacancy.ts              # Состояние редактирования вакансии
│   ├── chat.ts                 # Сообщения чата
│   ├── forms.ts                # Вопросы и формы
│   ├── calendarStore.ts        # Состояние календаря
│   └── cart.js                 # Корзина
│
├── types/                      # TypeScript-типы
│   ├── application.ts          # Типы заявок
│   ├── candidates.ts           # Типы кандидатов
│   ├── clients.ts              # Типы клиентов
│   ├── data-list.ts            # Типы списков данных
│   ├── form.ts                 # Типы форм
│   ├── funnels.ts              # Типы воронок
│   ├── general.ts              # Общие типы
│   ├── platform.ts             # Типы площадок
│   ├── roles.ts                # Типы ролей
│   ├── timeline.ts             # Типы таймлайна
│   ├── ui-components.ts        # Типы UI-компонентов
│   └── vacancy.ts              # Типы вакансий
│
└── utils/                      # Утилитарные функции (26 файлов)
    ├── loginUser.ts            # Авторизация пользователя
    ├── getServerToken.ts       # Получение серверного токена
    ├── getVacancies.ts         # Загрузка вакансий
    ├── createVacancy.ts        # Создание вакансии
    ├── candidatesFull.ts       # Полные данные кандидатов
    ├── applicationCreate.ts    # Создание заявки
    ├── applicationItem.ts      # Элемент заявки
    ├── clientsList.ts          # Список клиентов
    ├── hhAccount.ts            # Работа с HH-аккаунтом
    ├── avitoAccount.ts         # Работа с Avito-аккаунтом
    ├── mapVacancyToHh.ts       # Маппинг вакансии в формат HH
    ├── mapVacancyToAvito.ts    # Маппинг вакансии в формат Avito
    └── ...                     # Другие утилиты
```

---

## Скрипты

```bash
npm run dev          # Запуск dev-сервера
npm run build        # Production-сборка
npm run generate     # Статическая генерация сайта
npm run preview      # Предпросмотр production-сборки
npm run postinstall  # Подготовка Nuxt (автозапуск после npm install)
```

---

## Маршрутизация

Маршрутизация построена на файловой системе Nuxt 3 (директория `pages/`).

### Основные страницы

| Маршрут | Файл | Описание |
|---|---|---|
| `/` | `index.vue` | Дашборд |
| `/vacancies` | `vacancies/index.vue` | Список вакансий |
| `/vacancies/:id` | `vacancies/[id].vue` | Карточка вакансии |
| `/vacancies/newvacancy` | `vacancies/NewVacancy.vue` | Создание вакансии |
| `/candidates` | `candidates/index.vue` | Список кандидатов |
| `/candidates/:id` | `candidates/[id].vue` | Карточка кандидата |
| `/applications` | `Applications.vue` | Заявки |
| `/tasks` | `Tasks.vue` | Задачи |
| `/activity` | `Activity.vue` | Лента активности |
| `/notifications` | `Notifications.vue` | Уведомления |
| `/reports` | `Reports.vue` | Отчёты |

### Авторизация

| Маршрут | Файл | Описание |
|---|---|---|
| `/auth` | `auth/index.vue` | Роутер авторизации (вход / регистрация / сброс) |
| `/auth/recovery` | `auth/recovery/index.vue` | Восстановление пароля |

### Настройки

| Маршрут | Файл | Описание |
|---|---|---|
| `/settings` | `settings/index.vue` | Главная настроек |
| `/settings/company` | `settings/company/` | Настройки компании |
| `/settings/personal` | `settings/personal/` | Личные настройки |
| `/settings/recruiting` | `settings/recruiting/` | Настройки рекрутинга |
| `/settings/users` | `settings/users/` | Управление пользователями |
| `/settings/integrations` | `settings/integrations/` | Интеграции |

### Публичные страницы

| Маршрут | Файл | Описание |
|---|---|---|
| `/public/company/:companyId` | `public/company/[companyId].vue` | Публичная страница компании |
| `/public/vacancies` | `public/vacancies/index.vue` | Публичный список вакансий |
| `/public/vacancies/:id` | `public/vacancies/[id].vue` | Публичная страница вакансии |

### Макеты (Layouts)

- **default** -- основной макет с навигацией (для авторизованных пользователей)
- **blank** -- пустой макет (страницы авторизации)
- **settings** -- макет с боковой навигацией по разделам настроек

---

## Управление состоянием (Pinia)

Приложение использует **Pinia** для управления глобальным состоянием. Хранилище `user` использует плагин `pinia-plugin-persistedstate` для сохранения данных между сессиями.

| Хранилище | Файл | Назначение |
|---|---|---|
| `user` | `stores/user.ts` | Данные текущего пользователя, токены (с персистенцией) |
| `vacancy` | `stores/vacancy.ts` | Состояние редактирования вакансии |
| `chat` | `stores/chat.ts` | Сообщения и состояние чата |
| `forms` | `stores/forms.ts` | Вопросы и формы |
| `calendar` | `stores/calendarStore.ts` | Состояние календаря |
| `cart` | `stores/cart.js` | Корзина |

---

## API-интеграция

### Аутентификация

Приложение использует **двойную токенную авторизацию**:

1. **Серверный токен** (`auth_token` cookie) -- получается через `/login-jwt` с учётными данными API
2. **Пользовательский токен** (`auth_user` cookie) -- получается через `/login` с учётными данными пользователя

Оба токена передаются в каждом запросе:
- `Authorization: Bearer {serverToken}`
- `X-Auth-User: {userToken}`

### API-клиент

Базовый API-клиент находится в `src/api/client.ts` и предоставляет унифицированные методы:

- `apiGet(url, params?)` -- GET-запрос
- `apiPost(url, data?)` -- POST-запрос
- `apiPut(url, data?)` -- PUT-запрос
- `apiDelete(url)` -- DELETE-запрос

Специализированные модули:

| Модуль | Файл | Описание |
|---|---|---|
| Кандидаты | `src/api/candidates.ts` | CRUD кандидатов, загрузка фото |
| Вакансии | `src/api/vacancies.ts` | CRUD вакансий |
| Воронки | `src/api/funnels.ts` | Работа с воронками и этапами |
| Теги | `src/api/tags.ts` | CRUD тегов |

### Обработка ошибок

- **401 Unauthorized** -- автоматический редирект на `/auth`
- Попытка обновления серверного токена при получении 401
- Обработка сетевых ошибок с таймаутами

### Middleware авторизации

Глобальный middleware (`middleware/auth.global.ts`):
- Проверяет наличие токенов в cookies
- Валидирует профиль пользователя
- Обрабатывает обновление токенов
- Пропускает проверки при SSR-пререндеринге

---

## Компоненты

### Кастомные компоненты (`components/custom/`)

**Формы:**
- `MyInput`, `MyDropdown`, `MyTextarea`, `MyCheckbox` -- базовые поля ввода
- `PasswordInput`, `PhoneInput` -- специализированные поля
- `FileUpload` -- загрузка файлов

**UI-элементы:**
- `Popup` -- модальные окна
- `Pagination` -- пагинация
- `DataList` -- списки данных с бесконечной прокруткой
- `Autocomplete` -- автодополнение

**Бизнес-компоненты:**
- `VacancyCard` -- карточка вакансии
- `CandidateTable` -- таблица кандидатов
- `EventList` -- список событий
- `ResponseForm` -- форма отклика

**Календарь:**
- `CustomCalendar`, `DropdownCalendar`, `InputCalendar`

### UI-компоненты (`components/ui/`)

Компоненты shadcn-nuxt, построенные на Radix Vue:
- `Avatar`, `Button`, `Calendar`, `Dialog`, `Label`, `RadioGroup`, `Select`, `Tooltip`

### Компоненты таймлайна (`components/timeline/`)

Типы событий: Call, Chat, Comment, Email, Note, Task, Telegram, WhatsApp

### Компоненты площадок (`components/platforms/`)

- `AddPublication.vue` -- добавление публикации
- `HhFormPublication.vue` -- форма публикации на HH
- `DropDownList.vue` -- выпадающий список площадок

---

## Стилизация

- **Tailwind CSS** -- основной CSS-фреймворк с кастомной цветовой палитрой и расширенной системой отступов
- **SCSS** -- дополнительные стили (`assets/css/main.scss`)
- **shadcn-nuxt** -- готовые UI-компоненты на базе Radix Vue
- **Анимации** -- кастомные анимации (dot-up, dot-down), переходы страниц (fade с blur)

### Tailwind-конфигурация

- Кастомная цветовая палитра (space, dodger, zumthor и др.)
- Расширенная система отступов
- Кастомные border-radius
- Плагин Typography для стилизации контента

---

## Ключевые зависимости

### Ядро
- `nuxt` ^3.14 -- SSR-фреймворк
- `pinia` ^2.3 -- управление состоянием
- `pinia-plugin-persistedstate` ^4.2 -- персистенция состояния
- `axios` ^1.7 -- HTTP-клиент

### UI
- `@nuxtjs/tailwindcss` ^6.12 -- интеграция Tailwind
- `shadcn-nuxt` ^0.11 -- UI-компоненты
- `radix-vue` ^1.9 -- headless UI-примитивы
- `@radix-icons/vue` ^1.0 -- иконки
- `nuxt-lucide-icons` ^1.0 -- иконки Lucide

### Редактор
- `@tiptap/vue-3` ^2.10 -- WYSIWYG-редактор
- `@tiptap/starter-kit` ^2.10 -- базовый набор расширений
- `@tiptap/extension-link` ^2.10 -- расширение ссылок
- `@tiptap/extension-placeholder` ^2.26 -- плейсхолдер

### Утилиты
- `lodash` ^4.17 -- утилитарные функции
- `vuedraggable` ^4.1 -- drag-and-drop
- `vue-tippy` ^6.5 -- тултипы
- `@internationalized/date` ^3.7 -- работа с датами

### Медиа
- `video.js` ^7.21 -- видео-плеер
- `@videojs-player/vue` ^1.0 -- Vue-обёртка для video.js

### Шрифты и стили
- `@nuxtjs/google-fonts` ^3.2 -- Google Fonts
- `@nuxtjs/color-mode` ^3.5 -- тёмная/светлая тема
- `sass` ^1.81 -- препроцессор SCSS

---

## Конфигурация Nuxt

Основные настройки (`nuxt.config.ts`):

- **SSR** -- включён
- **Модули** -- Tailwind, Pinia, shadcn-nuxt, SVG Sprite, Google Fonts
- **Runtime Config** -- `apiBase`, `apiEmail`, `apiPassword`
- **Переходы страниц** -- fade с blur-эффектом
- **SCSS** -- modern compiler API
