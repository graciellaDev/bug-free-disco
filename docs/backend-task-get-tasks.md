# Задача: Создать эндпоинт `GET /api/tasks` на Laravel-бэкенде

## Контекст

На фронтенде (Nuxt 3) реализована страница **Планировщик** (`/tasks`), которая отображает глобальный список задач по всем кандидатам. Фронтенд вызывает `GET /api/tasks` с параметрами фильтрации и пагинации. Бэкенд — Laravel, проксируется через Nuxt (`/api/**` → Laravel).

В системе уже существуют эндпоинты задач **в контексте конкретного кандидата**:
- `POST /api/candidates/{id}/tasks` — создание
- `PUT /api/candidates/{id}/tasks/{eventId}` — обновление
- `DELETE /api/candidates/{id}/tasks/{eventId}` — удаление
- `POST /api/candidates/{id}/tasks/{eventId}/complete` — завершение

Задачи хранятся как события (`events`) с `type = 'task'`. Нужен **новый глобальный эндпоинт**, который возвращает задачи **по всем кандидатам** для текущего аккаунта.

---

## Требования к эндпоинту

**URL:** `GET /api/tasks`  
**Авторизация:** Bearer token + X-Auth-User (как и остальные эндпоинты)  
**Middleware:** `auth` (стандартный для аккаунта)

## Query-параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `page` | int | нет (default: 1) | Номер страницы пагинации |
| `per_page` | int | нет (default: 20) | Элементов на страницу |
| `filter` | string | нет | Фильтр: `today`, `tomorrow`, `week`, `overdue`, `completed`. Если не передан — все задачи |
| `sort_by` | string | нет (default: `occurred_at`) | Поле сортировки: `occurred_at`, `scheduled_at`, `completed_at`, `author_name` |
| `sort_dir` | string | нет (default: `desc`) | Направление сортировки: `asc`, `desc` |

### Дополнительные фильтры (`filters[...]`)

Передаются вложенными query-параметрами. Учитываются **вместе** с табом `filter`; объект `counts` в ответе считается **с учётом** этих фильтров.

| Параметр | Тип | Описание |
|----------|-----|----------|
| `filters[candidate_id]` | int | Только задачи по указанному кандидату. Кандидат должен принадлежать текущему аккаунту (`customer_id`). |
| `filters[vacancy_id]` | int | Только задачи, относящиеся к вакансии: `events.vacancy_id` совпадает **или** у события `vacancy_id` пустой и у кандидата `vacancy_id` совпадает. Вакансия должна принадлежать текущему аккаунту. |
| `filters[assignee]` | string | Поиск по полю **ответственного** (`events_tasks.assignee_name`), подстрока `LIKE %...%` (спецсимволы `%` и `_` экранируются). |

Примеры:

```
GET /api/tasks?filters[candidate_id]=58
GET /api/tasks?filters[vacancy_id]=12&filter=today
GET /api/tasks?filters[assignee]=Иван
```

## Логика фильтрации (по полю `payload->scheduled_at` и `payload->completed_at`)

- **`today`** — `scheduled_at` в пределах сегодняшнего дня AND `completed_at IS NULL`
- **`tomorrow`** — `scheduled_at` в пределах завтрашнего дня AND `completed_at IS NULL`
- **`week`** — `scheduled_at` в пределах текущей недели (ближайшие 7 дней) AND `completed_at IS NULL`
- **`overdue`** — `scheduled_at < NOW()` AND `completed_at IS NULL`
- **`completed`** — `completed_at IS NOT NULL`
- **без фильтра** — все задачи (type = 'task')

## Формат ответа

```json
{
  "message": "Success",
  "data": {
    "data": [
      {
        "id": 142,
        "type": "task",
        "occurred_at": "2024-09-12T14:30:00.000000Z",
        "author_name": "Иван Петров",
        "candidate_id": 58,
        "candidate_name": "Дмитрий Дюжев",
        "vacancy_id": 239238747,
        "vacancy_name": "Frontend-разработчик",
        "payload": {
          "content": "Проверка службы безопасности",
          "assignee_name": "Артем Васильев",
          "scheduled_at": "2024-09-13T18:00:00.000000Z",
          "completed_at": null
        }
      }
    ],
    "current_page": 1,
    "per_page": 20,
    "total": 41,
    "last_page": 3,
    "counts": {
      "all": 41,
      "today": 4,
      "tomorrow": 4,
      "week": 12,
      "overdue": 8,
      "completed": 15
    }
  }
}
```

## Ключевые поля в каждом элементе `data`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | int | ID события (event) |
| `type` | string | Всегда `"task"` |
| `occurred_at` | ISO 8601 | Дата создания задачи |
| `author_name` | string\|null | Имя создателя задачи |
| `candidate_id` | int\|null | ID кандидата, к которому привязана задача |
| `candidate_name` | string\|null | Имя кандидата (`firstname + ' ' + surname`) |
| `vacancy_id` | int\|null | ID вакансии кандидата |
| `vacancy_name` | string\|null | Название вакансии |
| `payload.content` | string | Текст/описание задачи |
| `payload.assignee_name` | string\|null | Исполнитель задачи |
| `payload.scheduled_at` | ISO 8601\|null | Запланированная дата/время |
| `payload.completed_at` | ISO 8601\|null | Дата/время завершения (null если не завершена) |

## Объект `counts`

Возвращается **всегда** вместе с пагинацией — содержит количество задач по каждому фильтру **для текущего аккаунта** (независимо от выбранного фильтра). Это нужно для отображения счётчиков на табах фильтров.

## Примерная реализация (Laravel)

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/tasks', [TaskController::class, 'index']);
});
```

```php
// app/Http/Controllers/TaskController.php

public function index(Request $request)
{
    $accountId = $request->user()->account_id;

    $baseQuery = Event::where('type', 'task')
        ->whereHas('candidate', fn ($q) => $q->where('account_id', $accountId));

    // counts — всегда считаем по всем фильтрам
    $counts = [
        'all'       => (clone $baseQuery)->count(),
        'today'     => (clone $baseQuery)->whereNull('payload->completed_at')
                        ->whereDate('payload->scheduled_at', today())->count(),
        'tomorrow'  => (clone $baseQuery)->whereNull('payload->completed_at')
                        ->whereDate('payload->scheduled_at', today()->addDay())->count(),
        'week'      => (clone $baseQuery)->whereNull('payload->completed_at')
                        ->whereBetween('payload->scheduled_at', [now(), now()->addDays(7)])->count(),
        'overdue'   => (clone $baseQuery)->whereNull('payload->completed_at')
                        ->where('payload->scheduled_at', '<', now())->count(),
        'completed' => (clone $baseQuery)->whereNotNull('payload->completed_at')->count(),
    ];

    // Применяем фильтр
    $query = clone $baseQuery;
    switch ($request->input('filter')) {
        case 'today':
            $query->whereNull('payload->completed_at')
                  ->whereDate('payload->scheduled_at', today());
            break;
        case 'tomorrow':
            $query->whereNull('payload->completed_at')
                  ->whereDate('payload->scheduled_at', today()->addDay());
            break;
        case 'week':
            $query->whereNull('payload->completed_at')
                  ->whereBetween('payload->scheduled_at', [now(), now()->addDays(7)]);
            break;
        case 'overdue':
            $query->whereNull('payload->completed_at')
                  ->where('payload->scheduled_at', '<', now());
            break;
        case 'completed':
            $query->whereNotNull('payload->completed_at');
            break;
    }

    $perPage = $request->input('per_page', 20);
    $paginated = $query
        ->with('candidate:id,firstname,surname,vacancy_id', 'candidate.vacancy:id,name')
        ->orderByDesc('occurred_at')
        ->paginate($perPage);

    // Маппинг: добавляем candidate_name, vacancy_id, vacancy_name
    $paginated->getCollection()->transform(function ($event) {
        $event->candidate_id = $event->candidate?->id;
        $event->candidate_name = trim(
            ($event->candidate?->firstname ?? '') . ' ' . ($event->candidate?->surname ?? '')
        ) ?: null;
        $event->vacancy_id = $event->candidate?->vacancy_id;
        $event->vacancy_name = $event->candidate?->vacancy?->name;
        unset($event->candidate);
        return $event;
    });

    $result = $paginated->toArray();
    $result['counts'] = $counts;

    return response()->json([
        'message' => 'Success',
        'data' => $result,
    ]);
}
```

> **Примечание:** Примерный код выше основан на предположении о структуре моделей `Event` и `Candidate`. Адаптируй под реальные модели, связи и имена таблиц в проекте. Если `payload` хранится как JSON-колонка — используй `->` для обращения к вложенным полям. Если `payload` хранится в отдельных столбцах — замени на соответствующие имена полей.

## Сортировка

По умолчанию: `occurred_at DESC` (новые задачи сверху).

Поддерживаемые поля для сортировки (`sort_by`):

| Значение | Описание |
|----------|----------|
| `occurred_at` | Дата создания задачи (по умолчанию) |
| `scheduled_at` | Запланированная дата выполнения (из `events_tasks`) |
| `completed_at` | Дата завершения (из `events_tasks`) |
| `author_name` | Имя автора задачи |

При сортировке по полям из `events_tasks` (`scheduled_at`, `completed_at`) выполняется `LEFT JOIN`, чтобы не терять события без записей в `events_tasks`.

Направление (`sort_dir`): `asc` — по возрастанию, `desc` — по убыванию. При неизвестном `sort_by` — fallback на `occurred_at DESC`.

**Примеры:**
```
GET /api/tasks?sort_by=scheduled_at&sort_dir=asc    — ближайшие по дате первыми
GET /api/tasks?sort_by=completed_at&sort_dir=desc   — последние завершённые первыми
GET /api/tasks?sort_by=author_name&sort_dir=asc     — по автору, алфавит
```

## Важно

- Ответ обёрнут в `{ "message": "Success", "data": { ... } }` — как все остальные эндпоинты проекта (используется `ApiSuccessResponse<T>` на фронтенде)
- `candidate_name` формируется из `firstname + surname` кандидата
- `vacancy_name` подтягивается из связанной вакансии
- Фильтровать задачи только по текущему аккаунту авторизованного пользователя

## Фронтенд-файлы (для справки)

- Типы: `types/tasks.ts`
- API-модуль: `src/api/tasks.ts`
- Страница: `pages/Tasks.vue`
