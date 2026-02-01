# Анализ метода /me/vacancy/create.json для rabota.ru API

## Эндпоинт

**URL:** `/me/vacancy/create.json`  
**Метод:** `POST`  
**Базовый URL:** `https://api.rabota.ru/v4` (prod) или `https://api.rabota.wtf/v4` (sandbox)

## Назначение

Метод используется для:
1. **Создания черновика вакансии** - с параметром `draft: true`
2. **Публикации вакансии** - без параметра `draft` или с `draft: false`

## Структура запроса

### Headers
```
Accept: application/json
Content-Type: application/json
Authorization: Bearer {token}
X-Auth-User: {userToken}
```

### Body (JSON)

#### Обязательные поля:
- `title` (string) - Название вакансии
- `description` (string) - Описание вакансии
- `profession_id` (integer) - ID профессии из справочника
- `region_id` (integer) - ID региона из справочника

#### Опциональные поля:
- `employment_type_id` (integer) - Тип занятости
- `work_schedule_id` (integer) - График работы
- `experience_id` (integer) - Опыт работы
- `education_id` (integer) - Образование
- `salary` (object) - Зарплата:
  - `from` (integer) - От
  - `to` (integer) - До
  - `currency` (string) - Валюта (например, "RUR")
  - `gross` (boolean) - До вычета налогов
- `skills` (array of strings) - Навыки
- `address_id` (integer) - ID адреса работы
- `work_format_ids` (array of integers) - Форматы работы
- `driver_license_ids` (array of integers) - Водительские права
- `draft` (boolean) - Флаг черновика:
  - `true` - создать черновик
  - `false` или отсутствует - опубликовать сразу

## Пример запроса для создания черновика

```json
{
  "title": "Менеджер по продажам",
  "description": "Описание вакансии...",
  "profession_id": 123,
  "region_id": 1,
  "employment_type_id": 1,
  "work_schedule_id": 1,
  "experience_id": 2,
  "education_id": 1,
  "salary": {
    "from": 50000,
    "to": 80000,
    "currency": "RUR",
    "gross": true
  },
  "skills": ["Коммуникабельность", "Работа в команде"],
  "draft": true
}
```

## Пример запроса для публикации

```json
{
  "title": "Менеджер по продажам",
  "description": "Описание вакансии...",
  "profession_id": 123,
  "region_id": 1,
  "employment_type_id": 1,
  "work_schedule_id": 1,
  "experience_id": 2,
  "education_id": 1,
  "salary": {
    "from": 50000,
    "to": 80000,
    "currency": "RUR",
    "gross": true
  },
  "skills": ["Коммуникабельность", "Работа в команде"],
  "draft": false
}
```

## Ответ API

### Успешный ответ (200 OK)
```json
{
  "data": {
    "id": 12345,
    "title": "Менеджер по продажам",
    "status": "published", // или "draft"
    // ... другие поля вакансии
  }
}
```

### Ошибка валидации (400 Bad Request)
```json
{
  "message": "Ошибка валидации",
  "errors": {
    "profession_id": ["Поле обязательно для заполнения"],
    "region_id": ["Неверный регион"]
  }
}
```

### Ошибка авторизации (401 Unauthorized)
```json
{
  "message": "Требуется авторизация"
}
```

## Текущая реализация

### Функция `addDraft()`
- Использует эндпоинт: `/rabota/me/vacancy/create.json`
- Отправляет данные с `draft: true`
- Создает черновик вакансии

### Функция `publishVacancy()`
- Использует эндпоинт: `/rabota/me/vacancy/create.json`
- Отправляет данные с `draft: false`
- Публикует вакансию сразу

## Маппинг данных

Функция `mapDataToRabotaFormat()` преобразует данные из формата формы в формат API rabota.ru:

| Поле формы | Поле API | Тип |
|------------|----------|-----|
| `name` | `title` | string |
| `description` | `description` | string |
| `professional_roles[0].id` | `profession_id` | integer |
| `areas[0].id` | `region_id` | integer |
| `employment_form.id` | `employment_type_id` | integer |
| `work_schedule_by_days.id` | `work_schedule_id` | integer |
| `experience.id` | `experience_id` | integer |
| `education_level.id` | `education_id` | integer |
| `salary_range` | `salary` | object |
| `key_skills` / `phrases` | `skills` | array |
| `address.id` | `address_id` | integer |
| `work_format` | `work_format_ids` | array |
| `driver_license_types` | `driver_license_ids` | array |

## Важные замечания

1. **Обязательные поля** должны быть заполнены для успешной публикации
2. **ID справочников** должны соответствовать значениям из API rabota.ru
3. **Формат данных** должен быть JSON
4. **Авторизация** требуется через OAuth токен

## Дополнительные ресурсы

- [OpenAPI спецификация rabota.ru](https://api.rabota.ru/v4/openapi.json)
- [Документация разработчика](https://dev.rabota.ru/)
- [Поддержка API](mailto:support@rabota.ru)
