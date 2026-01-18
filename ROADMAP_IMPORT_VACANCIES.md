# Роадмап: Импорт публикаций с платформ и создание вакансий

## Цель
Реализовать импорт публикаций с платформ (hh.ru, avito.ru и других) в систему с созданием вакансий в таблице `jobly.vacancies` и установлением взаимосвязей между вакансиями.

---

## Этап 1: Базовая реализация импорта (Приоритет: Высокий)

### 1.1. Создание функции маппинга данных публикации в формат вакансии ✅ ВЫПОЛНЕНО

**Задача:** Создать утилиту для преобразования данных публикации из формата платформы в формат вакансии для БД.

**Файл:** `utils/mapPublicationToVacancy.ts` ✅ Создан

**Функциональность:**
- Маппинг данных из формата hh.ru (`publication` объект) в формат `Vacancy`
- Маппинг данных из формата avito.ru в формат `Vacancy`
- Обработка отсутствующих полей (значения по умолчанию)
- Преобразование форматов данных (employment, schedule, experience, education)

**Структура функции:**
```typescript
export function mapHhPublicationToVacancy(publication: any, currentVacancyId?: number): Partial<Vacancy>
export function mapAvitoPublicationToVacancy(publication: any, currentVacancyId?: number): Partial<Vacancy>
export function mapPublicationToVacancy(publication: any, platform: 'hh.ru' | 'avito.ru', currentVacancyId?: number): Partial<Vacancy>
```

**Маппинг полей:**
- `name` ← `publication.name`
- `description` ← `publication.description` или `publication.requirement` + `publication.responsibility`
- `salary_from` ← `publication.salary?.from` или `publication.salary_range?.from`
- `salary_to` ← `publication.salary?.to` или `publication.salary_range?.to`
- `currency` ← маппинг из формата платформы (RUR → RUB)
- `employment` ← обратный маппинг из формата hh.ru (id → siteName)
- `schedule` ← обратный маппинг графика работы
- `experience` ← обратный маппинг опыта
- `education` ← обратный маппинг образования
- `location` ← `publication.area?.name` или `publication.areas?.[0]?.name`
- `place` ← маппинг `workSpace` (1-офис, 2-гибрид, 3-удаленно)
- `phrases` ← `publication.key_skills` или `publication.phrases`
- `status` ← 'draft' (по умолчанию для импортированных)

**Зависимости:**
- Использовать существующие константы из `@/src/constants`
- Использовать данные из `~/src/data/experience.json`, `work-schedule.json`, `education.json`

---

### 1.2. Реализация создания вакансии в функции importPublication ✅ ВЫПОЛНЕНО

**Файл:** `pages/create-tabs/PublishTab.vue` ✅ Обновлен

**Изменения в функции `importPublication` (строка 1109):**

1. **Добавить импорт:**
```typescript
import { createVacancy } from '@/utils/createVacancy'
import { mapPublicationToVacancy } from '@/utils/mapPublicationToVacancy'
```

2. **Модифицировать логику функции:**
   - После получения данных публикации (countViews, responses)
   - Преобразовать данные публикации в формат вакансии через `mapPublicationToVacancy`
   - Добавить связь с текущей вакансией (если `currentVacancyId` существует)
   - Вызвать `createVacancy` с преобразованными данными
   - Обработать ошибки создания
   - При успешном создании добавить публикацию в `publicationsHh.value` с дополнительным полем `vacancyId` (ID созданной вакансии)

**Структура:**
```typescript
async function importPublication(publication) {
    isLoadingImport.value = true;
    
    try {
        // Получаем статистику публикации
        const { data: countViews, error: countViewsError } = await getVacancyCountViews(publication.id);
        if (!countViewsError && countViews) {
            publication.countViews = countViews;
        }
        
        const { data: responses, error: responsesError } = await getVacancyResponses(publication.id);
        if (!responsesError && responses) {
            if (responses.items.length > 0) {
                publication.responses = responses.items.length;
            }
        }
        
        // Определяем платформу
        const platform = selectedImportPlatform.value || 'hh.ru';
        
        // Преобразуем данные публикации в формат вакансии
        const vacancyData = mapPublicationToVacancy(
            publication, 
            platform, 
            currentVacancyId ? Number(currentVacancyId) : undefined
        );
        
        // Создаем вакансию в БД
        const { data: createdVacancy, error: createError } = await createVacancy(vacancyData);
        
        if (createError) {
            importError.value = `Ошибка при создании вакансии: ${createError.message || createError}`;
            console.error('Ошибка создания вакансии:', createError);
            return;
        }
        
        // Добавляем ID созданной вакансии к публикации
        publication.vacancyId = createdVacancy?.data?.id;
        publication.importedAt = new Date().toISOString();
        
        // Добавляем публикацию в список активных
        if (!publicationsHh.value.find(p => p.id === publication.id)) {
            publicationsHh.value.push(publication);
        }
        
    } catch (err) {
        console.error('Ошибка при импорте публикации:', err);
        importError.value = 'Ошибка при импорте публикации';
    } finally {
        isLoadingImport.value = false;
    }
}
```

---

## Этап 2: Улучшения импорта для hh.ru (Приоритет: Средний)

### 2.1. Расширенный маппинг данных hh.ru

**Улучшения:**
- Маппинг `professional_roles` → `specializations`
- Маппинг `industry` → `industry`
- Обработка `driver_license_types` → `drivers`
- Обработка `additional_conditions` → `conditions` и `additions`
- Маппинг `areas` (массив регионов) → `location` (строка)
- Сохранение оригинального ID публикации для связи

**Новые поля в вакансии:**
- `platform_publication_id` - ID публикации на платформе (для связи)
- `platform_name` - название платформы ('hh.ru', 'avito.ru')
- `imported_from` - метаданные импорта (JSON)

---

### 2.2. Обработка специфичных полей hh.ru

**Дополнительные данные:**
- `billing_types` - тарифы публикации (сохранять в метаданных)
- `response_letter_required` - требование сопроводительного письма
- `accept_handicapped`, `accept_incomplete_resumes` - дополнительные условия
- `age_restriction` - возрастные ограничения

**Реализация:**
- Сохранять специфичные поля платформы в поле `imported_from` (JSON)
- Использовать для последующей синхронизации и обновления

---

## Этап 3: Улучшения импорта для avito.ru (Приоритет: Средний)

### 3.1. Маппинг данных avito.ru

**Особенности avito.ru:**
- Другая структура данных по сравнению с hh.ru
- Специфичные поля (категории, подкатегории, адреса)
- Другие форматы зарплаты и условий

**Задачи:**
- Изучить структуру данных avito.ru API
- Создать функцию `mapAvitoPublicationToVacancy`
- Адаптировать маппинг под специфику avito.ru

**Файл:** `utils/mapPublicationToVacancy.ts` (расширение)

---

### 3.2. Обработка адресов avito.ru

**Особенности:**
- avito.ru использует более детальную структуру адресов
- Необходимо маппинг адресов в формат `location`

---

## Этап 4: Взаимосвязи вакансий (Приоритет: Высокий)

### 4.1. Использование таблицы `vacancy_platform` на бэкенде

**Структура на бэкенде:**
- Таблица `vacancy_platform` существует на бэкенде (Laravel)
- Связывает вакансии с платформами через сводную таблицу
- Поддерживает связь с базовой вакансией через `base_vacancy_id`

**Структура таблицы (на бэкенде):**
```sql
CREATE TABLE vacancy_platform (
    vacancy_id BIGINT UNSIGNED,
    platform_id BIGINT UNSIGNED,
    base_vacancy_id BIGINT UNSIGNED NULL,
    FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (base_vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE
);
```

**Логика связей:**
- `vacancy_id` - импортированная вакансия (созданная из публикации платформы)
- `platform_id` - платформа, с которой импортирована публикация
- `base_vacancy_id` - основная (родительская) вакансия, к которой привязан импорт
  - Если `base_vacancy_id` заполнен → это импортированная вакансия
  - Если `base_vacancy_id` NULL → это обычная публикация на платформе

**Работа через API:**
- Все операции с таблицей `vacancy_platform` выполняются через бэкенд API
- Фронтенд отправляет запросы на создание/получение связей через API endpoints

---

### 4.2. Реализация связей в коде

**В функции `importPublication` (PublishTab.vue):**
- После создания вакансии через `createVacancy`
- Найти ID платформы в таблице `platforms` по названию (например, 'hh.ru' → platform_id)
- Создать запись в таблице `vacancy_platform` с полями:
  - `vacancy_id` - ID созданной вакансии
  - `platform_id` - ID платформы из таблицы `platforms`
  - `base_vacancy_id` - ID текущей вакансии (если `currentVacancyId` существует)
    - Если `base_vacancy_id` заполнен → это импортированная вакансия
    - Если `base_vacancy_id` NULL → это обычная публикация

**Пример создания связи через API:**
```typescript
// После создания вакансии
const { data: createdVacancy } = await createVacancy(vacancyData);

// Создать связь в vacancy_platform через API бэкенда
await createVacancyPlatformRelation({
    vacancy_id: createdVacancy.data.id,
    platform_name: selectedImportPlatform.value, // 'hh.ru'
    base_vacancy_id: currentVacancyId ? Number(currentVacancyId) : null
});
```

**В функции `createVacancy`:**
- Создать вакансию в таблице `vacancies` через API
- После успешного создания, создать связь в `vacancy_platform` через API endpoint
- Бэкенд сам определит `platform_id` по `platform_name` и создаст связь

---

### 4.3. Отображение связанных вакансий

**Задачи:**
- Создать компонент для отображения связанных вакансий
- Показывать импортированные вакансии на странице основной вакансии
- Добавить навигацию между связанными вакансиями

**Файлы:**
- `components/vacancies/RelatedVacancies.vue` - компонент списка связанных вакансий
- Обновить `pages/vacancies/[id].vue` для отображения связанных вакансий

---

## Этап 5: Поддержка других платформ (Приоритет: Низкий)

### 5.1. Архитектура для расширяемости

**Создать интерфейс платформы:**
```typescript
interface PlatformMapper {
    mapToVacancy(publication: any, currentVacancyId?: number): Partial<Vacancy>;
    getPublicationId(publication: any): string | number;
    getPlatformName(): string;
}
```

**Реализации:**
- `HhPlatformMapper` - для hh.ru
- `AvitoPlatformMapper` - для avito.ru
- `RabotaPlatformMapper` - для rabota.ru (будущее)
- `SuperjobPlatformMapper` - для superjob (будущее)

**Файл:** `utils/platformMappers/index.ts`

---

### 5.2. Фабрика мапперов

```typescript
export function getPlatformMapper(platformName: string): PlatformMapper {
    switch (platformName) {
        case 'hh.ru':
            return new HhPlatformMapper();
        case 'avito.ru':
            return new AvitoPlatformMapper();
        // Добавлять новые платформы здесь
        default:
            throw new Error(`Платформа ${platformName} не поддерживается`);
    }
}
```

---

## Этап 6: Обработка ошибок и валидация (Приоритет: Средний)

### 6.1. Валидация данных перед созданием

**Задачи:**
- Проверка обязательных полей (`name`, `description`)
- Валидация форматов данных (email, phone, salary)
- Проверка на дубликаты (по `platform_publication_id`)

**Файл:** `utils/validateVacancyData.ts`

---

### 6.2. Обработка ошибок

**Улучшения:**
- Детальные сообщения об ошибках для пользователя
- Логирование ошибок для отладки
- Retry механизм для сетевых ошибок
- Обработка частичного успеха (создана вакансия, но не добавлена в список)

---

## Этап 7: UI/UX улучшения (Приоритет: Средний)

### 7.1. Улучшение попапа импорта

**Задачи:**
- Показывать статус импорта для каждой публикации
- Отображать информацию о созданной вакансии после импорта
- Добавить возможность массового импорта
- Показывать предпросмотр данных перед импортом

---

### 7.2. Индикация связанных вакансий

**Задачи:**
- Визуально показывать связь между вакансиями
- Добавить фильтры для просмотра связанных вакансий
- Показывать статистику по связанным вакансиям

---

## Этап 8: Синхронизация данных (Приоритет: Низкий)

### 8.1. Обновление импортированных вакансий

**Задачи:**
- Периодическая синхронизация данных с платформ
- Обновление статистики (просмотры, отклики)
- Обновление статуса публикации на платформе

---

### 8.2. Удаление связей

**Задачи:**
- Возможность отвязать импортированную вакансию от основной
- Удаление импортированной вакансии (с сохранением основной)

---

## Порядок выполнения

1. **Этап 1** - Базовая реализация (критично для работы)
2. **Этап 4** - Взаимосвязи вакансий (критично для функциональности)
3. **Этап 2** - Улучшения hh.ru (улучшает качество данных)
4. **Этап 3** - Улучшения avito.ru (расширяет функциональность)
5. **Этап 6** - Обработка ошибок (улучшает надежность)
6. **Этап 7** - UI/UX улучшения (улучшает пользовательский опыт)
7. **Этап 5** - Поддержка других платформ (расширяемость)
8. **Этап 8** - Синхронизация (дополнительная функциональность)

---

## Технические детали

### Зависимости
- Существующие утилиты: `createVacancy`, `getVacancies`
- Типы: `Vacancy` из `types/vacancy.ts`
- Константы: `HH_EMPLOYMENT_TYPES`, `HH_WORK_SCHEDULE_BY_DAYS`, и т.д.

### API изменения
- Возможно потребуется обновление API для поддержки полей связи (`parent_vacancy_id`, `platform_publication_id`, `platform_name`, `imported_from`)

### Миграции БД
- **Все миграции и модели находятся на бэкенде (Laravel)**
- Таблица `vacancy_platform` управляется через бэкенд API
- Фронтенд работает только через API endpoints для создания/получения связей

---

## Вопросы для уточнения

1. Нужна ли поддержка множественных родительских вакансий для одной импортированной?
2. Нужна ли возможность импорта одной публикации в несколько вакансий?
3. Какие поля вакансии обязательны при импорте?
4. Нужна ли автоматическая синхронизация или только ручной импорт?
5. Как обрабатывать конфликты при импорте (дубликаты)?
