export interface CommentTemplateItem {
  id: string
  title: string
  text: string
}

const COMMENT_TEMPLATES_STORAGE_KEY = 'jobly-comment-templates'

export const DEFAULT_COMMENT_TEMPLATES: CommentTemplateItem[] = [
  {
    id: 'first-contact',
    title: 'Первичный контакт',
    text: 'Связались с кандидатом, кратко рассказали о вакансии и уточнили актуальность поиска работы.',
  },
  {
    id: 'call-completed',
    title: 'Созвон проведён',
    text: 'Провели созвон с кандидатом. Уточнили опыт, условия и готовность к следующему этапу.',
  },
  {
    id: 'interview-scheduled',
    title: 'Собеседование назначено',
    text: 'Назначили собеседование. Подтверждение по времени и формату отправлено кандидату.',
  },
  {
    id: 'waiting-feedback',
    title: 'Ожидаем обратную связь',
    text: 'Кандидат ознакомился с информацией, ожидаем обратную связь по дальнейшим шагам.',
  },
  {
    id: 'request-docs',
    title: 'Запрос документов',
    text: 'Запросили у кандидата дополнительные документы. Ожидаем ответ и вернёмся с обновлением.',
  },
  {
    id: 'follow-up',
    title: 'Нужен follow-up',
    text: 'Кандидат пока не ответил. Нужен повторный контакт для уточнения статуса.',
  },
  {
    id: 'offer-discussion',
    title: 'Обсуждение оффера',
    text: 'Обсудили с кандидатом условия оффера, зафиксировали комментарии и вопросы.',
  },
  {
    id: 'process-closed',
    title: 'Процесс закрыт',
    text: 'По кандидату завершили процесс на текущем этапе. Зафиксировали итог и причину решения.',
  },
]

function normalizeTemplate(input: Partial<CommentTemplateItem>): CommentTemplateItem | null {
  const id = String(input?.id ?? '').trim()
  const title = String(input?.title ?? '').trim()
  const text = String(input?.text ?? '').trim()
  if (!id || !title || !text) return null
  return { id, title, text }
}

export function getCommentTemplatesLibrary(): CommentTemplateItem[] {
  if (typeof localStorage === 'undefined') {
    return [...DEFAULT_COMMENT_TEMPLATES]
  }
  try {
    const raw = localStorage.getItem(COMMENT_TEMPLATES_STORAGE_KEY)
    if (!raw) return [...DEFAULT_COMMENT_TEMPLATES]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_COMMENT_TEMPLATES]
    const normalized = parsed
      .map((item) => normalizeTemplate(item ?? {}))
      .filter((item): item is CommentTemplateItem => item != null)
    return normalized.length ? normalized : [...DEFAULT_COMMENT_TEMPLATES]
  } catch {
    return [...DEFAULT_COMMENT_TEMPLATES]
  }
}

export function saveCommentTemplatesLibrary(templates: CommentTemplateItem[]): CommentTemplateItem[] {
  const normalized = (Array.isArray(templates) ? templates : [])
    .map((item) => normalizeTemplate(item ?? {}))
    .filter((item): item is CommentTemplateItem => item != null)
  const result = normalized.length ? normalized : [...DEFAULT_COMMENT_TEMPLATES]
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(COMMENT_TEMPLATES_STORAGE_KEY, JSON.stringify(result))
  }
  return result
}
