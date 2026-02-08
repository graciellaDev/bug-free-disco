/**
 * Валидация данных вакансии перед отправкой на сервер
 * Соответствует правилам валидации Laravel на бэкенде
 */

interface ValidationError {
    field: string;
    message: string;
}

/**
 * Валидация данных вакансии
 */
export function validateVacancyData(vacancyData: any): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // name - required|string|min:3|max:255
    if (!vacancyData.name || typeof vacancyData.name !== 'string') {
        errors.push({ field: 'name', message: 'Название вакансии обязательно' });
    } else if (vacancyData.name.length < 3) {
        errors.push({ field: 'name', message: 'Название вакансии должно содержать минимум 3 символа' });
    } else if (vacancyData.name.length > 255) {
        errors.push({ field: 'name', message: 'Название вакансии не должно превышать 255 символов' });
    }

    // description - required|string|min:3
    if (!vacancyData.description || typeof vacancyData.description !== 'string') {
        errors.push({ field: 'description', message: 'Описание вакансии обязательно' });
    } else if (vacancyData.description.length < 3) {
        errors.push({ field: 'description', message: 'Описание вакансии должно содержать минимум 3 символа' });
    }

    // dateEnd - nullable|date_format:d.m.Y
    if (vacancyData.dateEnd && typeof vacancyData.dateEnd === 'string') {
        const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
        if (!dateRegex.test(vacancyData.dateEnd)) {
            errors.push({ field: 'dateEnd', message: 'Дата окончания должна быть в формате дд.мм.гггг' });
        }
    }

    // code - nullable|string|max:255
    if (vacancyData.code && typeof vacancyData.code !== 'string' && vacancyData.code.length > 255) {
        errors.push({ field: 'code', message: 'Код не должен превышать 255 символов' });
    }

    // specializations - nullable|string|max:255
    if (vacancyData.specializations && typeof vacancyData.specializations === 'string' && vacancyData.specializations.length > 255) {
        errors.push({ field: 'specializations', message: 'Специализации не должны превышать 255 символов' });
    }

    // industry - nullable|string|max:255
    if (vacancyData.industry && typeof vacancyData.industry === 'string' && vacancyData.industry.length > 255) {
        errors.push({ field: 'industry', message: 'Отрасль не должна превышать 255 символов' });
    }

    // employment - nullable|string|max:255
    if (vacancyData.employment && typeof vacancyData.employment === 'string' && vacancyData.employment.length > 255) {
        errors.push({ field: 'employment', message: 'Тип занятости не должен превышать 255 символов' });
    }

    // schedule - nullable|string|max:255
    if (vacancyData.schedule && typeof vacancyData.schedule === 'string' && vacancyData.schedule.length > 255) {
        errors.push({ field: 'schedule', message: 'График работы не должен превышать 255 символов' });
    }

    // experience - nullable|string|max:255
    if (vacancyData.experience && typeof vacancyData.experience === 'string' && vacancyData.experience.length > 255) {
        errors.push({ field: 'experience', message: 'Опыт работы не должен превышать 255 символов' });
    }

    // education - nullable|string|max:255
    if (vacancyData.education && typeof vacancyData.education === 'string' && vacancyData.education.length > 255) {
        errors.push({ field: 'education', message: 'Образование не должно превышать 255 символов' });
    }

    // salary_type - nullable|string|max:100
    if (vacancyData.salary_type && typeof vacancyData.salary_type === 'string' && vacancyData.salary_type.length > 100) {
        errors.push({ field: 'salary_type', message: 'Тип зарплаты не должен превышать 100 символов' });
    }

    // salary_from - nullable|string|max:255
    if (vacancyData.salary_from !== undefined && vacancyData.salary_from !== null) {
        if (typeof vacancyData.salary_from === 'string' && vacancyData.salary_from.length > 255) {
            errors.push({ field: 'salary_from', message: 'Зарплата от не должна превышать 255 символов' });
        }
    }

    // salary_to - nullable|string|max:255
    if (vacancyData.salary_to !== undefined && vacancyData.salary_to !== null) {
        if (typeof vacancyData.salary_to === 'string' && vacancyData.salary_to.length > 255) {
            errors.push({ field: 'salary_to', message: 'Зарплата до не должна превышать 255 символов' });
        }
    }

    // currency - nullable|string|max:255
    if (vacancyData.currency && typeof vacancyData.currency === 'string' && vacancyData.currency.length > 255) {
        errors.push({ field: 'currency', message: 'Валюта не должна превышать 255 символов' });
    }

    // place - nullable|numeric|max:255
    if (vacancyData.place !== undefined && vacancyData.place !== null) {
        const placeNum = typeof vacancyData.place === 'string' ? parseFloat(vacancyData.place) : vacancyData.place;
        if (isNaN(placeNum)) {
            errors.push({ field: 'place', message: 'Место работы должно быть числом' });
        } else if (placeNum > 255) {
            errors.push({ field: 'place', message: 'Место работы не должно превышать 255' });
        }
    }

    // location - nullable|string|max:255
    if (vacancyData.location && typeof vacancyData.location === 'string' && vacancyData.location.length > 255) {
        errors.push({ field: 'location', message: 'Локация не должна превышать 255 символов' });
    }

    // executor_id - nullable|numeric
    if (vacancyData.executor_id !== undefined && vacancyData.executor_id !== null) {
        const executorIdNum = typeof vacancyData.executor_id === 'string' ? parseFloat(vacancyData.executor_id) : vacancyData.executor_id;
        if (isNaN(executorIdNum)) {
            errors.push({ field: 'executor_id', message: 'ID исполнителя должно быть числом' });
        }
    }

    // executor_name - nullable|string
    // Нет ограничений по длине в валидации

    // executor_phone - nullable|regex:/^\+7\d{10}$/
    if (vacancyData.executor_phone && typeof vacancyData.executor_phone === 'string') {
        const phoneRegex = /^\+7\d{10}$/;
        if (!phoneRegex.test(vacancyData.executor_phone)) {
            errors.push({ field: 'executor_phone', message: 'Телефон должен быть в формате +7XXXXXXXXXX' });
        }
    }

    // executor_email - nullable|string
    // Нет ограничений по длине в валидации, но можно добавить проверку email
    if (vacancyData.executor_email && typeof vacancyData.executor_email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(vacancyData.executor_email)) {
            errors.push({ field: 'executor_email', message: 'Некорректный формат email' });
        }
    }

    // show_executor - nullable|boolean
    if (vacancyData.show_executor !== undefined && vacancyData.show_executor !== null) {
        if (typeof vacancyData.show_executor !== 'boolean') {
            errors.push({ field: 'show_executor', message: 'Поле show_executor должно быть булевым значением' });
        }
    }

    // platform_id - nullable|numeric
    if (vacancyData.platform_id !== undefined && vacancyData.platform_id !== null) {
        const platformIdNum = typeof vacancyData.platform_id === 'string' ? parseFloat(vacancyData.platform_id) : vacancyData.platform_id;
        if (isNaN(platformIdNum)) {
            errors.push({ field: 'platform_id', message: 'ID платформы должно быть числом' });
        }
    }

    // base_id - nullable|numeric
    if (vacancyData.base_id !== undefined && vacancyData.base_id !== null) {
        const baseIdNum = typeof vacancyData.base_id === 'string' ? parseFloat(vacancyData.base_id) : vacancyData.base_id;
        if (isNaN(baseIdNum)) {
            errors.push({ field: 'base_id', message: 'ID базовой вакансии должно быть числом' });
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Нормализация данных вакансии для отправки на сервер
 * Преобразует типы данных в соответствии с требованиями валидации
 */
export function normalizeVacancyData(vacancyData: any): any {
    const normalized: any = { ...vacancyData };

    // Преобразуем salary_from и salary_to в строки (если они числа)
    if (normalized.salary_from !== undefined && normalized.salary_from !== null) {
        normalized.salary_from = String(normalized.salary_from);
    }
    if (normalized.salary_to !== undefined && normalized.salary_to !== null) {
        normalized.salary_to = String(normalized.salary_to);
    }

    // Преобразуем place в число (если это строка)
    if (normalized.place !== undefined && normalized.place !== null) {
        const placeNum = typeof normalized.place === 'string' ? parseFloat(normalized.place) : normalized.place;
        normalized.place = isNaN(placeNum) ? undefined : placeNum;
    }

    // Обрезаем строковые поля до максимальной длины
    if (normalized.name && typeof normalized.name === 'string' && normalized.name.length > 255) {
        normalized.name = normalized.name.substring(0, 255);
    }
    if (normalized.code && typeof normalized.code === 'string' && normalized.code.length > 255) {
        normalized.code = normalized.code.substring(0, 255);
    }
    if (normalized.specializations && typeof normalized.specializations === 'string' && normalized.specializations.length > 255) {
        normalized.specializations = normalized.specializations.substring(0, 255);
    }
    if (normalized.industry && typeof normalized.industry === 'string' && normalized.industry.length > 255) {
        normalized.industry = normalized.industry.substring(0, 255);
    }
    if (normalized.employment && typeof normalized.employment === 'string' && normalized.employment.length > 255) {
        normalized.employment = normalized.employment.substring(0, 255);
    }
    if (normalized.schedule && typeof normalized.schedule === 'string' && normalized.schedule.length > 255) {
        normalized.schedule = normalized.schedule.substring(0, 255);
    }
    if (normalized.experience && typeof normalized.experience === 'string' && normalized.experience.length > 255) {
        normalized.experience = normalized.experience.substring(0, 255);
    }
    if (normalized.education && typeof normalized.education === 'string' && normalized.education.length > 255) {
        normalized.education = normalized.education.substring(0, 255);
    }
    if (normalized.currency && typeof normalized.currency === 'string' && normalized.currency.length > 255) {
        normalized.currency = normalized.currency.substring(0, 255);
    }
    if (normalized.location && typeof normalized.location === 'string' && normalized.location.length > 255) {
        normalized.location = normalized.location.substring(0, 255);
    }
    if (normalized.salary_type && typeof normalized.salary_type === 'string' && normalized.salary_type.length > 100) {
        normalized.salary_type = normalized.salary_type.substring(0, 100);
    }

    // Преобразуем platform_id и base_id в числа (если они есть)
    if (normalized.id !== undefined && normalized.id !== null) {
        normalized.vacancy_platform_id = normalized.id;
    }
    
    if (normalized.base_id !== undefined && normalized.base_id !== null) {
        const baseIdNum = typeof normalized.base_id === 'string' ? parseFloat(normalized.base_id) : normalized.base_id;
        normalized.base_id = isNaN(baseIdNum) ? undefined : baseIdNum;
    }

    // Удаляем undefined значения (но сохраняем platform_id и base_id даже если они 0)
    Object.keys(normalized).forEach(key => {
        if (normalized[key] === undefined) {
            delete normalized[key];
        }
    });

    return normalized;
}
