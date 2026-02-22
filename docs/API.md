# Документация API приложения Jobly

Документ описывает все HTTP-эндпоинты бэкенда.

**Базовый URL API:** `{APP_URL}/api` (например, `https://admin.job-ly.ru/api`)

**Авторизация:** для защищённых эндпоинтов используется JWT в заголовке:
```http
Authorization: Bearer <token>
```

Токен выдаётся при успешном вызове `POST /api/login` или `POST /api/login-jwt`.

**Проверка работоспособности:** `GET /up` (health check, без авторизации).

---

## Содержание

1. [Публичные эндпоинты (без авторизации)](#1-публичные-эндпоинты-без-авторизации)
2. [Аутентификация (api.php)](#2-аутентификация-api)
3. [Клиент и профиль (customer)](#3-клиент-и-профиль-customer)
4. [Клиенты с ролями (customer-with-roles)](#4-клиенты-с-ролями-customer-with-roles)
5. [Кандидаты (candidates)](#5-кандидаты-candidates)
6. [Теги (tags)](#6-теги-tags)
7. [Действия (action)](#7-действия-action)
8. [Роли (roles)](#8-роли-roles)
9. [Заявки (applications)](#9-заявки-applications)
10. [Задачи (tasks)](#10-задачи-tasks)
11. [Фразы (phrases)](#11-фразы-phrases)
12. [HeadHunter (hh)](#12-headhunter-hh)
13. [Avito](#13-avito)
14. [Rabota.ru](#14-rabotaru)
15. [SuperJob](#15-superjob)
16. [Web-маршруты (callback и утилиты)](#16-web-маршруты)
17. [Параметры запросов и структура ответов](#17-параметры-запросов-и-структура-ответов)

---

### Общие соглашения

- **Успешный ответ** чаще всего: `{ "message": "Success", "data": ... }` или объект с полем `data`.
- **Ошибки:** `422` — ошибка валидации, `404` — не найдено, `401` — не авторизован, `403` — нет доступа, `409` — конфликт (дубликат, нельзя удалить).
- **Пагинация:** в списках используется стандартная пагинация Laravel (`data`, `current_page`, `last_page`, `per_page`, `total` и т.д.).

---

## 1. Публичные эндпоинты (без авторизации)

Доступны без заголовка `Authorization`.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/specializations` | Список специализаций (справочник) |
| GET | `/api/hh/languages` | Справочник языков (HH, для формы вакансии) |
| GET | `/api/hh/language-levels` | Уровни владения языком (HH) |
| GET | `/api/superjob/catalogues` | Каталог отраслей SuperJob (для формы вакансии) |

---

## 2. Аутентификация (api)

Маршруты из `routes/api.php`. Часть эндпоинтов не требует токена, часть — требует `auth:api`.

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|----------|
| GET | `/api/user` | Sanctum | Текущий пользователь (auth:sanctum) |
| POST | `/api/login-jwt` | — | Вход по email/password, получение JWT. Body: `email`, `password` |
| GET | `/api/profile-jwt` | — | Профиль по JWT |
| POST | `/api/login` | auth:api | Вход (CustomerController) |
| POST | `/api/register` | auth:api | Регистрация |
| POST | `/api/restore-access` | auth:api | Восстановление доступа |
| POST | `/api/restore-success/{id}` | auth:api | Подтверждение восстановления по id |

---

## 3. Клиент и профиль (customer)

Префикс: **`/api`**. Middleware: `auth:api`, `customer-auth`.

### Вакансии

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/vacancy-fields` | Поля для формы вакансии |
| GET | `/api/vacancies` | Список вакансий (фильтры, сортировка) |
| POST | `/api/vacancies` | Создание вакансии |
| GET | `/api/vacancies/{id}` | Одна вакансия |
| PUT | `/api/vacancies/{id}` | Обновление вакансии |
| DELETE | `/api/vacancies/{id}` | Удаление вакансии |

### Воронки

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/funnels` | Список воронок |
| POST | `/api/funnels` | Создание воронки |
| DELETE | `/api/funnels/{id}` | Удаление воронки |
| GET | `/api/funnels/stages/{id}` | Этапы воронки (id — id воронки) |
| POST | `/api/funnels/stages/{id}` | Создание этапа воронки |
| DELETE | `/api/funnels/stages/{id}` | Удаление этапа (id — id этапа) |

### Произвольные поля

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/custom-fields` | Список кастомных полей |
| POST | `/api/custom-fields` | Создание кастомного поля |
| GET | `/api/custom-fields-types` | Типы кастомных полей |

### Клиенты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/clients` | Список клиентов |
| GET | `/api/clients/{id}` | Клиент по id |

### Команда и пользователи

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/managers` | Список менеджеров |
| GET | `/api/executors` | Список исполнителей |
| GET | `/api/responsibles` | Список ответственных |
| GET | `/api/team/{vacancy_id}` | Команда по вакансии |
| DELETE | `/api/team/{vacancy_id}` | Удаление участника из команды (тело запроса — данные участника) |

### Отделы

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/departments` | Список отделов |
| GET | `/api/departments/{id}` | Отдел по id |
| POST | `/api/departments` | Создание отдела |
| POST | `/api/departments/{id}/divisions` | Создание подразделения в отделе |

### Профиль

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/profile` | Профиль текущего клиента (CustomerController) |

---

## 4. Клиенты с ролями (customer-with-roles)

Префикс: **`/api`**. Middleware: `auth:api`, `customer-auth`.

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/customer-with-roles/register-client` | Регистрация клиента |
| POST | `/api/customer-with-roles/register-recruiter` | Регистрация рекрутера |
| GET | `/api/customer-with-roles/clients` | Список клиентов |
| GET | `/api/customer-with-roles/clients/{id}` | Клиент по id |
| GET | `/api/customer-with-roles/recruiters` | Список рекрутеров |
| GET | `/api/customer-with-roles/recruiters/{id}` | Рекрутер по id |
| GET | `/api/customer-with-roles/responsibles` | Список ответственных |
| GET | `/api/customer-with-roles/employees` | Список сотрудников |

---

## 5. Кандидаты (candidates)

Префикс: **`/api`**. Middleware: `auth:api`, `customer-auth`.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/candidates` | Список кандидатов |
| GET | `/api/candidates/{id}` | Кандидат по id |
| POST | `/api/candidates` | Создание кандидата |
| PUT | `/api/candidates/{id}` | Обновление кандидата |
| DELETE | `/api/candidates/{id}` | Удаление кандидата |
| POST | `/api/candidates/reply` | Ответ кандидату |
| DELETE | `/api/candidates/{id}/tags/{tag}` | Отвязать тег от кандидата |
| GET | `/api/candidates/{id}/events` | События по кандидату |
| GET | `/api/candidates/{id}/vacancies/{vacancyId}/events` | События по кандидату и вакансии |
| POST | `/api/candidates/{id}/chats` | Создать сообщение в чате кандидата |
| POST | `/api/candidates/{id}/vacancies/{vacancyId}/chats` | Создать сообщение в чате по кандидату и вакансии |

---

## 6. Теги (tags)

Префикс: **`/api`**. Middleware: `auth:api`, `customer-auth`.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/tags` | Список тегов |
| GET | `/api/tags/{id}` | Тег по id |
| POST | `/api/tags` | Создание тега |
| DELETE | `/api/tags/{id}` | Удаление тега |
| GET | `/api/tags/find/{name}` | Поиск тега по имени |

---

## 7. Действия (action)

Префикс: **`/api/action`**. Middleware: `auth:api`, `customer-auth`.

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/action/invite` | Приглашение (кандидата на вакансию и т.п.) |
| POST | `/api/action/move-stage` | Перемещение по этапу воронки |
| POST | `/api/action/refuse` | Отказ |
| POST | `/api/action/send-email` | Отправка email |
| POST | `/api/action/change-manager` | Смена менеджера |

---

## 8. Роли (roles)

Префикс: **`/api`**. Middleware: `auth:api`, `customer-auth`, `customer-admin-auth`.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/roles` | Список ролей |
| GET | `/api/roles/{id}` | Роль по id |
| POST | `/api/roles` | Создание роли |
| PUT | `/api/roles/{id}` | Обновление роли |
| DELETE | `/api/roles/{id}` | Удаление роли |

---

## 9. Заявки (applications)

Префикс: **`/api/applications`**. Middleware: `auth:api`, `customer-auth`.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/applications/statuses` | Список статусов заявок |
| GET | `/api/applications/statuses/{id}` | Статус по id |
| GET | `/api/applications` | Список заявок |
| GET | `/api/applications/{id}` | Заявка по id |
| POST | `/api/applications` | Создание заявки |
| PUT | `/api/applications/{id}` | Обновление заявки |
| DELETE | `/api/applications/{id}` | Удаление заявки |
| POST | `/api/applications/{id}/approve` | Одобрить заявку |
| POST | `/api/applications/{id}/reject` | Отклонить заявку |

---

## 10. Задачи (tasks)

Префикс: **`/api/tasks`**. Middleware: `auth:api`, `customer-auth`.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/tasks/types` | Типы задач |

---

## 11. Фразы (phrases)

Префикс: **`/api/phrases`**. Middleware: `auth:api`, `customer-auth`.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/phrases` | Список фраз |
| GET | `/api/phrases/{id}` | Фраза по id |
| POST | `/api/phrases/s` | Создание фразы (body: `name`) |
| DELETE | `/api/phrases/{id}` | Удаление фразы |

---

## 12. HeadHunter (hh)

Префикс: **`/api/hh`**. Middleware: `auth:api`; для части маршрутов дополнительно `head-hunter-auth`.

### Без привязки HH

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/hh/auth` | Начать OAuth HH (редирект) |
| GET | `/api/hh/code` | Callback после OAuth (используется из web: `/api/code-hh`) |

### С привязкой HH (head-hunter-auth)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/hh/profile` | Профиль HH |
| POST | `/api/hh/publication` | Публикация вакансии |
| GET | `/api/hh/publications` | Список публикаций |
| GET | `/api/hh/publications/{id}` | Публикация по id |
| POST | `/api/hh/publications/{id}/archive` | Перевод публикации в архив (снятие с публикации) |
| GET | `/api/hh/publications/{id}/count-visitors` | Количество просмотров |
| GET | `/api/hh/drafts` | Черновики |
| POST | `/api/hh/drafts` | Создание черновика |
| POST | `/api/hh/available-types` | Доступные типы |
| POST | `/api/hh/available-publications` | Доступные публикации |
| GET | `/api/hh/roles` | Профессии (getProfessionals) |
| GET | `/api/hh/vacancy-responses/{id}` | Отклики на вакансию |
| GET | `/api/hh/vacancy-response/{id}` | Один отклик |
| GET | `/api/hh/vacancies` | Вакансии HH |
| POST | `/api/hh/send-url` | Отправка ссылки |
| DELETE | `/api/hh/auth` | Отвязать HH |
| GET | `/api/hh/addresses` | Адреса |

---

## 13. Avito

Префикс: **`/api/avito`**. Middleware: `auth:api`; для части маршрутов — `avito-auth`.

### Без привязки Avito

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/avito/auth` | Начать OAuth Avito |
| GET | `/api/avito/code` | Callback OAuth (в web: `/api/code-avito`) |

### С привязкой Avito (avito-auth)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/avito/profile` | Профиль Avito |
| GET | `/api/avito/professions` | Справочник профессий |
| GET | `/api/avito/professions/{dictionary_id}/specializations` | Специализации по профессии |
| GET | `/api/avito/publications` | Список публикаций |
| GET | `/api/avito/publications/{id}` | Публикация по id |
| POST | `/api/avito/publications/{id}/archive` | Перевод публикации в архив (снятие с публикации) |
| POST | `/api/avito/publications` | Создание публикации |
| GET | `/api/avito/drafts` | Черновики |
| POST | `/api/avito/drafts` | Создание черновика |
| POST | `/api/avito/send-url` | Отправка ссылки |

---

## 14. Rabota.ru

Префикс: **`/api/rabota`**. Middleware: `auth:api`; для части — `rabota-auth`.

### Без привязки Rabota

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/rabota/auth` | Начать OAuth Rabota.ru |
| GET | `/api/rabota/code` | Callback OAuth (в web: `/api/code-rabota`) |

### С привязкой Rabota (rabota-auth)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/rabota/profile` | Профиль Rabota.ru |
| GET | `/api/rabota/publications` | Список публикаций |
| GET | `/api/rabota/publications/{id}` | Публикация по id |
| POST | `/api/rabota/publications/{id}/archive` | Перевод публикации в архив (снятие с публикации) |
| GET | `/api/rabota/publications/{id}/count-visitors` | Количество просмотров |
| GET | `/api/rabota/drafts` | Черновики |
| POST | `/api/rabota/drafts` | Создание черновика |
| POST | `/api/rabota/avalibale-types` | Доступные типы (опечатка в URL: avalibale) |
| GET | `/api/rabota/roles` | Профессии |
| GET | `/api/rabota/vacancy-responses/{id}` | Отклики на вакансию |
| GET | `/api/rabota/vacancy-response/{id}` | Один отклик |
| GET | `/api/rabota/vacancies` | Вакансии |
| POST | `/api/rabota/send-url` | Отправка ссылки |
| DELETE | `/api/rabota/auth` | Отвязать Rabota.ru |
| GET | `/api/rabota/addresses` | Адреса |
| GET | `/api/rabota/dictionaries/areas` | Регионы |
| GET | `/api/rabota/dictionaries/employment-forms` | Формы занятости |
| GET | `/api/rabota/dictionaries/education-levels` | Уровни образования |
| GET | `/api/rabota/dictionaries/experience` | Опыт |
| GET | `/api/rabota/dictionaries/driver-license-types` | Типы водительских прав |
| GET | `/api/rabota/dictionaries/billing-types` | Типы оплаты |
| GET | `/api/rabota/dictionaries/work-formats` | Форматы работы |
| GET | `/api/rabota/dictionaries/working-hours` | Рабочие часы |
| GET | `/api/rabota/dictionaries/schedules` | Графики работы |

---

## 15. SuperJob

Префикс: **`/api/superjob`**. Middleware: `auth:api`; для части — `superjob-auth`.

### Без привязки SuperJob

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/superjob/auth` | Начать OAuth SuperJob |
| GET | `/api/superjob/code` | Callback OAuth (в web: `/api/code-superjob`) |

### С привязкой SuperJob (superjob-auth)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/superjob/profile` | Профиль SuperJob |
| GET | `/api/superjob/vacancies` | Вакансии |
| GET | `/api/superjob/vacancies/{id}` | Вакансия по id |
| POST | `/api/superjob/vacancies/{id}/archive` | Перевод вакансии в архив (снятие с публикации) |
| GET | `/api/superjob/catalogues` | Каталоги (отрасли) |
| GET | `/api/superjob/references` | Справочники |
| GET | `/api/superjob/towns` | Города |
| GET | `/api/superjob/regions` | Регионы |
| GET | `/api/superjob/countries` | Страны |
| POST | `/api/superjob/send-url` | Отправка ссылки |
| DELETE | `/api/superjob/auth` | Отвязать SuperJob |

---

## 16. Web-маршруты

Файл `routes/web.php`. Без префикса `/api` для части маршрутов (корень приложения).

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Welcome-страница |
| GET | `/clear-cache` | Очистка кэша приложения |
| GET | `/reg-success/{id}` | Страница успешной регистрации (id пользователя) |
| GET | `/api/code-hh` | OAuth callback HeadHunter |
| GET | `/api/code-avito` | OAuth callback Avito |
| GET | `/api/code-rabota` | OAuth callback Rabota.ru |
| GET | `/api/code-superjob` | OAuth callback SuperJob |

---

## 17. Параметры запросов и структура ответов

### 17.1. Аутентификация

**POST /api/login-jwt** (JWT-вход)
- **Body (JSON):** `email` (string, обязательно), `password` (string, обязательно).
- **Ответ 200:** `{ "user": { ... }, "authorization": { "token": "...", "type": "bearer" } }`.
- **Ответ 401:** `{ "message": "Unauthorized" }`.

**POST /api/login** (вход Customer)
- **Body:** `email` (string), `password` (string, min 6). Опционально cookie `auth_user` для повторного входа.
- **Ответ 200:** `{ "message": "Авторизация прошла успешно", "user": { "login", "name", "email", "phone", "site", "auth_token", "role" } }`.
- **Ответ 401/404:** `{ "message": "Неверный логин или пароль" }`, 422 при ошибке валидации.

**POST /api/register** (регистрация, auth:api)
- **Body:** `name`, `email`, `login`, `password`, `password_confirmation`, опционально: `phone` (формат +7XXXXXXXXXX), `site`, `from`, `role_id`, `user_id`, `department`.
- **Ответ 200:** `{ "message": "Пользователь успешно зарегистрирован", "user": { "login", "name", "email", "phone", "site", "from" } }`.

**POST /api/restore-access**
- **Body:** `email` (обязательно; в коде проверяется unique:users — возможно, опечатка, по смыслу должен быть существующий email).
- **Ответ 404:** пользователь не найден. При успехе отправляется письмо, ответ уточнять по контроллеру.

**GET /api/profile-jwt**
- **Ответ 200:** `{ "status": true, "message": "Profile data", "user": { ... } }`.

---

### 17.2. Публичные эндпоинты

**GET /api/specializations**
- **Ответ 200:** `{ "message": "Success", "data": { "categories": [ { "id", "name", "roles": [ { "id", "name" } ] } ] } }`.

**GET /api/hh/languages**, **GET /api/hh/language-levels**
- Без параметров. Ответ — справочники от HH API (структура зависит от внешнего API).

**GET /api/superjob/catalogues**
- **Ответ:** каталог отраслей SuperJob (структура от внешнего API).

---

### 17.3. Вакансии (customer)

**GET /api/vacancy-fields**
- **Ответ 200:** `{ "message": "Success", "data": { "employments", "schedules", "experiences", "education", "condition", "currencies", "drivers", "places" } }` — справочники id => name (или массив для places).

**GET /api/vacancies**
- **Query:** `sort` — одно из: `asc`, `desc`, `new`, `old`, `urgent`, `non-urgent`. `filters` — объект: `status` (active|draft|archive), `city`, `executor`, `client`, `id`, `notCandidate`, `isApplication`, `notExecutor`, `responsible`, `create` (диапазон дат через `;` в формате d.m.Y), `department`, `platforms`, `baseVacancyId`.
- **Ответ 200:** `{ "message": "Success", "data": <paginator> }`. Элементы: `id`, `title`, `city`, `created_at`, `dateEnd`, `footerData`, `stages`, при необходимости `platforms_data`.

**POST /api/vacancies**
- **Body (JSON):** `name` (обязательно, 3–255), `description` (обязательно, min 3), `dateEnd` (d.m.Y), `code`, `specializations`, `industry`, `employment`, `schedule`, `work_hours_per_day`, `has_evening_night_shifts`, `experience`, `education`, `salary_type`, `salary_from`, `salary_to`, `currency`, `salary_frequency`, `salary_payment_frequency`, `place`, `location`, `work_address`, `oformlenie`, `languages`, `comment`, `department` и др. (см. VacancyController::create).
- **Ответ:** объект вакансии или ошибка 401/422.

**GET /api/vacancies/{id}**
- **Ответ 200:** `{ "message": "Success", "data": { ...vacancy, "conditions", "drivers", "additions", "phrases", "place" } }`. 404 при отсутствии доступа.

**PUT /api/vacancies/{id}**
- **Body:** те же поля, что при создании, но все опциональны (nullable). Дополнительно: `drivers`.
- **Ответ:** обновлённая вакансия или 404/500.

**DELETE /api/vacancies/{id}**
- **Ответ 200:** `{ "message": "Вакансия ... успешно удалена" }`. 404 — не найдена.

---

### 17.4. Воронки

**GET /api/funnels**
- **Ответ 200:** `{ "message": "Success", "data": [ { "id", "name", "fixed", ... } ] }`.

**POST /api/funnels**
- **Body:** `name` (обязательно, 3–255).
- **Ответ 200:** `{ "message": "Воронка ... успешно создана", "data": [ ... ] }`. 409 — воронка с таким именем уже есть.

**DELETE /api/funnels/{id}**
- **Ответ 200:** `{ "massage": "Воронка ... успешно удалена" }` (в коде — опечатка `massage`). 409 — воронку удалять нельзя (фиксированная или не найдена). 404 — не найдена.

**GET /api/funnels/stages/{id}** — id воронки.
- **Ответ:** список этапов воронки.

**POST /api/funnels/stages/{id}**
- **Body:** `name` (обязательно, 3–255). id — id воронки.
- **Ответ:** этапы или 422.

**DELETE /api/funnels/stages/{id}** — id этапа.
- **Ответ:** успех или 404.

---

### 17.5. Кастомные поля

**GET /api/custom-fields**
- **Ответ 200:** `{ "message": "Success", "data": [ { "id", "name", "require", "type": { ... } } ] }`.

**POST /api/custom-fields**
- **Body:** `name` (обязательно, 3–50), `require` (boolean, опционально), `type` (id типа, опционально).
- **Ответ 200:** `{ "message": "Пользовательское поле ... создано", "data": { ... } }`. 409 — поле с таким именем уже есть.

**GET /api/custom-fields-types**
- **Ответ:** список типов кастомных полей.

---

### 17.6. Клиенты, команда, отделы

**GET /api/profile** (CustomerController)
- **Ответ:** профиль текущего клиента.

**GET /api/departments**
- **Ответ 200:** `{ "data": [ { "id", "name", "divisions": [ ... ] } ] }`.

**POST /api/departments**
- **Body:** `name` (обязательно, max 255).
- **Ответ 200:** `{ "success": true, "message": "Департамент ... успешно создан", "department": { "id", "name" } }`. 422 — ошибка валидации.

**POST /api/departments/{id}/divisions**
- **Body:** параметры подразделения (уточнять по DepartmentController::createDivision).

**DELETE /api/team/{vacancy_id}**
- **Body:** данные участника команды для удаления (уточнять по контроллеру).

---

### 17.7. Клиенты с ролями (customer-with-roles)

**POST /api/customer-with-roles/register-client**
- **Body:** `email` (обязательно). Остальное подставляется внутри (role_id=клиент, пароль генерируется).
- **Ответ:** как у register — сообщение об успешной регистрации и письмо.

**POST /api/customer-with-roles/register-recruiter**
- **Body:** `email` (обязательно). Аналогично — роль рекрутера, пароль генерируется.

**GET /api/customer-with-roles/clients**, **/recruiters**, **/responsibles**, **/employees**
- **Ответ:** списки сущностей (структура в контроллерах ClientController, RecruiterController и т.д.).

---

### 17.8. Кандидаты

**GET /api/candidates**
- **Query:** параметры фильтрации и пагинации (уточнять по CandidateController::index).
- **Ответ:** пагинированный список кандидатов.

**GET /api/candidates/{id}**
- **Ответ 200:** `{ "message": "Success", "data": { ...candidate } }`. 404 — не найден.

**POST /api/candidates**
- **Body (JSON):** `firstname` (обязательно, 3–50), `surname`, `patronymic`, `email` (обязательно), `age`, `phone` (формат +7XXXXXXXXXX), `stage_id`, `location`, `quickInfo`, `education`, `link`, `vacancy_id`, `experience`, `telegram`, `messengerMax`, `skype`, `icon`, `imagePath`, `isPng`, `resume`, `resumePath`, `coverPath`, `source`, `isReserve`, `customFields` и др. (см. CandidateController::$validFields).
- **Ответ:** созданный кандидат или 422.

**PUT /api/candidates/{id}**
- **Body:** те же поля, что при создании (все опциональны для обновления). Дополнительно: `stage`.
- **Ответ:** обновлённый кандидат или ошибка.

**DELETE /api/candidates/{id}**
- **Ответ:** успех или 404.

**POST /api/candidates/reply**
- **Body:** параметры ответа кандидату (уточнять по контроллеру).

**DELETE /api/candidates/{id}/tags/{tag}**
- **Ответ:** успех или ошибка. `tag` — id или имя тега.

**GET /api/candidates/{id}/events**, **GET /api/candidates/{id}/vacancies/{vacancyId}/events**
- **Ответ:** список событий по кандидату (и вакансии).

**POST /api/candidates/{id}/chats**, **POST /api/candidates/{id}/vacancies/{vacancyId}/chats**
- **Body:** текст/данные сообщения чата.
- **Ответ:** созданное сообщение или ошибка.

---

### 17.9. Теги

**GET /api/tags**
- **Ответ 200:** `{ "message": "Success", "data": [ { "id", "name", ... } ] }`.

**GET /api/tags/{id}**
- **Ответ 200:** `{ "message": "Success", "data": { ... } }`. 404 — тег не найден.

**POST /api/tags**
- **Body:** `name` (обязательно, 3–50).
- **Ответ 200:** `{ "message": "Success", "data": { ... } }`. 409 — тег с таким именем уже есть.

**DELETE /api/tags/{id}**
- **Ответ 200:** `{ "message": "Тэг ... успешно удален" }`. 404 — не существует.

**GET /api/tags/find/{name}**
- **Ответ 200:** `{ "message": "Success", "data": { ... } }`. 404 — тег не существует.

---

### 17.10. Действия (action)

Все действия используют общие параметры инициализации (кандидат и условие срабатывания):

- **Общие body-поля:** `candidate_id` (обязательно), `field` (обязательно: `phone`|`age`|`location`|`link`|`attachments`), `fieldType` (string), `conditions` (обязательно: `true`|`false`|`=`|`!=`|`>`|`<`|`interval`), при необходимости `value`, `from`, `to`, `time` (1–1440, минуты задержки).

**POST /api/action/invite**
- При выполнении условия — ставится задача приглашения в очередь. **Ответ 200:** сообщение о триггере по перемещению в «Подходящие». Иначе 409/422.

**POST /api/action/move-stage**
- **Body:** общие поля + `stage_id` (обязательно).
- **Ответ 200:** сообщение о запуске триггера перемещения на этап. 409 — этап не существует. 422 — ошибка валидации этапа.

**POST /api/action/refuse**
- **Ответ:** сообщение о триггере перемещения в «Отклоненные» или ошибка.

**POST /api/action/send-email**
- **Body:** общие поля + `typeEmail` (обязательно: `invite`|`refuse`|`no-call`).
- **Ответ:** сообщение о триггере отправки письма или 422.

**POST /api/action/change-manager**
- **Body:** общие поля + `managerId` (обязательно). Ответственный должен быть с role_id 1 или 4.
- **Ответ 200:** сообщение о триггере смены ответственного. 409 — ответственный не найден. 422 — невалидный ответственный.

---

### 17.11. Роли

**GET /api/roles**
- **Ответ 200:** `{ "message": "Success", "data": [ { "id", "name", ... } ] }`.

**GET /api/roles/{id}**
- **Ответ 200:** `{ "message": "Success", "data": { ..., "permissions": [ ... ] } }`. Для роли id=1 возвращаются все права со value=1. 404 — роль не существует.

**POST /api/roles**
- **Body:** `name` (обязательно, 3–50), `isLook`, `isManage`, `isDeleteVacancy`, `isChangePerson`, `isInviteCustomer`, `isDeleteCandidate`, `isManageEmailTemplate`, `isManageTag`, `isReceiveVacancy` (все boolean, обязательны).
- **Ответ 200:** `{ "message": "Роль ... успешно создана" }`. 409 — роль с таким именем уже есть.

**PUT /api/roles/{id}**
- **Body:** те же поля, все опциональны.
- **Ответ 200:** `{ "message": "Роль обновлена", "data": { ... } }`. 404 — роль не существует. 409 — имя уже занято. 204 — пустое тело.

**DELETE /api/roles/{id}**
- **Ответ 200:** `{ "message": "Роль ... успешно удалена" }`. 404 — не существует. 409 — нельзя удалить (id=1 или есть пользователи с этой ролью).

---

### 17.12. Заявки (applications)

**GET /api/applications/statuses**
- **Ответ 200:** `{ "message": "Success", "data": [ { "id", "name", ... } ] }`.

**GET /api/applications/statuses/{id}**
- **Ответ 200:** `{ "message": "Success", "data": { ... } }`. 404 — статус не найден.

**GET /api/applications**
- **Query:** `sort` (dateStart|dateWork|status|client|executor), `asc` (0 = desc, иначе asc). Пагинация по 10.
- **Ответ 200:** `{ "message": "Success", "data": <paginator> }`. Элементы с связями: client, vacancy, status, executor, responsible.

**GET /api/applications/{id}**
- **Ответ 200:** `{ "message": "Success", "data": { ...application, "approvals": [ ... ] } }`. 403 — нет доступа. 404 — не найдена.

**POST /api/applications**
- **Body:** `position` (обязательно, 3–50), `division`, `count`, `salaryFrom`, `salaryTo`, `currency`, `require`, `duty`, `city`, `reason`, `dateStart` (d.m.Y), `dateWork` (d.m.Y), `vacancy`, `executor`, `client`, `responsible`.
- **Ответ:** созданная заявка (status_id=1 по умолчанию) или 422. При указании responsible может отправляться письмо.

**PUT /api/applications/{id}**
- **Body:** те же поля + `status` (все опциональны).
- **Ответ:** обновлённая заявка или ошибка.

**DELETE /api/applications/{id}**
- **Ответ:** успех или ошибка.

**POST /api/applications/{id}/approve**
- **Ответ:** успех или ошибка (логика в ApplicationController::approve).

**POST /api/applications/{id}/reject**
- **Ответ:** успех или ошибка (логика в ApplicationController::reject).

---

### 17.13. Задачи и фразы

**GET /api/tasks/types**
- **Ответ 200:** `{ "message": "Success", "data": [ ... ] }` — массив типов задач (TaskType).

**GET /api/phrases**
- **Ответ 200:** `{ "message": "Success", "data": [ { "id", "name", ... } ] }`.

**GET /api/phrases/{id}**
- **Ответ 200:** `{ "message": "Success", "data": { ... } }`. 404 — фраза не найдена.

**POST /api/phrases/s**
- **Body:** `name` (обязательно, 3–50).
- **Ответ 200:** `{ "message": "Success", "data": { ... } }`. 409 — фраза уже существует. 422 — ошибка валидации.

**DELETE /api/phrases/{id}**
- **Ответ 200:** успех. 404 — фраза не существует.

---

### 17.14. Интеграции (HH, Avito, Rabota, SuperJob)

Эндпоинты интеграций в основном проксируют запросы к внешним API и возвращают их ответы. Типичные случаи:

- **GET /api/hh/auth**, **/api/avito/auth**, **/api/rabota/auth**, **/api/superjob/auth** — редирект на OAuth площадки. Параметры не требуются.
- **GET /api/hh/code** и т.д. — callback с query-параметрами `code`, `state` от площадки.
- **GET profile, publications, drafts, vacancies** и т.д. — структура ответа совпадает с документацией соответствующего API (hh.ru, avito.ru, rabota.ru, superjob.ru). Для точного формата см. контроллеры: HeadHunterController, AvitoController, RabotaRuController, SuperJobController.

**POST /api/hh/send-url**, **/api/avito/send-url**, **/api/rabota/send-url**, **/api/superjob/send-url**
- **Body:** как правило, идентификатор вакансии/публикации и URL (уточнять по методу sendUrl в каждом контроллере).

---

## Сводная таблица по авторизации

| Группа маршрутов | Middleware | Примечание |
|------------------|------------|------------|
| Публичные (specializations, hh/languages, hh/language-levels, superjob/catalogues) | — | Без токена |
| api.php (login-jwt, profile-jwt) | — | Без токена |
| api.php (login, register, restore-*, user) | auth:api или sanctum | Токен обязателен где указано |
| customer, candidate, tag, action, applications, tasks, phrases | auth:api + customer-auth | Токен + привязка к клиенту |
| roles | auth:api + customer-auth + customer-admin-auth | Только для администратора клиента |
| hh, avito, rabota, superjob | auth:api; подгруппы — свой middleware (head-hunter-auth и т.д.) | Токен + при необходимости привязка к площадке |

---

*Документация сгенерирована по состоянию маршрутов приложения. Для уточнения формата тел запросов/ответов смотрите соответствующие контроллеры в `app/Http/Controllers/api/`.*
