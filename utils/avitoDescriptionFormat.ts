/**
 * Описание вакансии для Avito Job API.
 * Перенос строк в примере документации: \n<br>\n между абзацами.
 * @see https://developers.avito.ru/api-catalog/job/documentation
 */

/** Один перенос строки в description для Avito API. */
export const AVITO_DESCRIPTION_LINE_BREAK = '\n<br>\n'

/** Пустая строка между абзацами (двойной перенос в редакторе → два блока \n<br>\n). */
export const AVITO_DESCRIPTION_PARAGRAPH_BREAK =
  `${AVITO_DESCRIPTION_LINE_BREAK}${AVITO_DESCRIPTION_LINE_BREAK}`

const SECTION_BREAK_PATTERNS: RegExp[] = [
  /\s+(Работодатель предлагает)/giu,
  /\s+(Работа предполагает)/giu,
  /\s+(Требования к кандидатам:)/giu,
  /\s+(Требования:)/giu,
  /\s+(Обязанности:)/giu,
  /(?<=[.!?])\s+(Функциональные обязанности\s+включают)/giu,
  /\s+(Условия(?:\s+работы)?:)/giu,
  /\s+(Мы предлагаем:)/giu,
  /\s+(Что предлагаем:)/giu,
  /\s+(Что нужно делать:)/giu,
  /\s+(Что предстоит делать:)/giu,
  /\s+(Вам предстоит:)/giu,
  /\s+(Будет плюсом:)/giu,
  /\s+(Дополнительно:)/giu,
  /\s+(Знания в области)/giu,
]

const SECTION_HEADER_LINE =
  /^(Требования(?:\s+к\s+кандидатам)?|Обязанности|Функциональные обязанности(?:\s+включают)?|Условия(?:\s+работы)?|Что нужно делать|Что предстоит делать|Вам предстоит|Будет плюсом|Дополнительно|Мы предлагаем|Что предлагаем):$/iu

const REQUIREMENT_ITEM_SPLIT =
  /,\s+(?=готовность|ответственность|адаптивность|умение\s+работать|опыт\s+работы|знание\s+страны)/iu

const DUTY_ITEM_SPLIT =
  /,\s+(?=участие\s+в|лингвистическое\s+сопровождение|обеспечение\s+точности|а\s+также\s+обеспечение)/iu

function normalizeLineBreaks(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/** Входящий текст Avito/редактора → внутренние переносы для разбора. */
function normalizeAvitoBreaksInSource(text: string): string {
  return normalizeLineBreaks(text)
    .replace(/(?:\n\s*<br\s*\/?>\s*\n){2,}/gi, '\n\n')
    .replace(/\n\s*<br\s*\/?>\s*\n/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
}

function formatLineForAvito(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return ''
  if (/^[—\-•·]\s+/.test(trimmed)) {
    return `• ${trimmed.replace(/^[—\-•·]\s+/, '').trim()}`
  }
  return trimmed
}

function collapseSpacesPreservingNewlines(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function breakLongParagraphs(text: string, maxLen = 320): string {
  return text
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim()
      if (trimmed.length <= maxLen) return trimmed
      return trimmed.replace(/(?<=[.!?])\s+(?=[А-ЯA-ZЁ])/gu, '\n')
    })
    .join('\n\n')
}

function splitListBody(header: string, tail: string, splitRe: RegExp): string {
  const body = tail.trim()
  if (!body) return header

  const parts = body
    .split(splitRe)
    .map((p) => p.trim().replace(/[.;]\s*$/u, ''))
    .filter(Boolean)

  if (parts.length < 2) {
    return [header, body].filter(Boolean).join('\n')
  }

  return [header, ...parts.map((p) => `— ${p}`)].join('\n')
}

function splitListAfterSectionHeader(block: string, splitRe: RegExp): string {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return block

  const first = lines[0]
  const colonMatch = first.match(/^(.+?:)\s*(.*)$/u)
  if (colonMatch) {
    const header = colonMatch[1]
    if (!SECTION_HEADER_LINE.test(header)) return block
    const rest = [colonMatch[2], ...lines.slice(1)].filter(Boolean).join(' ').trim()
    return splitListBody(header, rest, splitRe)
  }

  const dutiesMatch = first.match(/^(Функциональные обязанности\s+включают)\s+(.+)$/iu)
  if (dutiesMatch && lines.length === 1) {
    return splitListBody(dutiesMatch[1], dutiesMatch[2], splitRe)
  }

  return block
}

function enhanceSectionBlocks(text: string): string {
  return text
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim()
      if (/^Требования/i.test(trimmed)) {
        return splitListAfterSectionHeader(trimmed, REQUIREMENT_ITEM_SPLIT)
      }
      if (/^Функциональные обязанности/i.test(trimmed)) {
        return splitListAfterSectionHeader(trimmed, DUTY_ITEM_SPLIT)
      }
      return trimmed
    })
    .join('\n\n')
}

/** Строки для API: \n<br>\n внутри абзаца, \n<br>\n\n<br>\n между абзацами (пустая строка). */
export function formatParagraphBreaksForAvitoApi(plain: string): string {
  const normalized = collapseSpacesPreservingNewlines(normalizeAvitoBreaksInSource(plain))
  if (!normalized) return ''

  return normalized
    .split(/\n\n+/)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .map((l) => formatLineForAvito(l))
        .filter(Boolean)
        .join(AVITO_DESCRIPTION_LINE_BREAK),
    )
    .filter((p) => p.length > 0)
    .join(AVITO_DESCRIPTION_PARAGRAPH_BREAK)
}

/** Нужно ли заново структурировать текст (сплошная «простыня» без абзацев). */
export function needsAvitoDescriptionReformat(raw: unknown): boolean {
  const source = String(raw ?? '').trim()
  if (!source) return false

  const text = /<\/?[a-z][^>]*>/i.test(source)
    ? normalizeAvitoBreaksInSource(
        source
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]+>/g, ''),
      )
    : normalizeAvitoBreaksInSource(source)
  const trimmed = text.trim()
  if (trimmed.length < 120) return false
  if (/\n\s*<br\s*\/?>\s*\n/i.test(String(raw ?? ''))) return false
  if (trimmed.includes('\n\n')) return false
  if (!trimmed.includes('\n') && trimmed.length > 200) return true
  if (trimmed.split('\n').filter((l) => l.trim()).length <= 2 && trimmed.length > 250) return true
  return false
}

/** Разбивка сплошного текста на абзацы по типовым заголовкам. */
export function structurePlainDescriptionForAvito(raw: string): string {
  let text = normalizeAvitoBreaksInSource(String(raw ?? '')).trim()
  if (!text) return ''

  text = text.replace(
    /(Вакансия компании:\s*[^\n]+?)\s+(?=[А-ЯA-ZЁ])/u,
    '$1\n\n',
  )

  for (const pattern of SECTION_BREAK_PATTERNS) {
    text = text.replace(pattern, '\n\n$1')
  }

  const INNER_SECTION_MARKERS = [
    'Требования к кандидатам:',
    'Требования:',
    'Обязанности:',
    'Функциональные обязанности включают',
    'Условия работы:',
    'Условия:',
    'Знания в области',
    'Мы предлагаем:',
    'Что предлагаем:',
    'Что нужно делать:',
    'Что предстоит делать:',
    'Вам предстоит:',
    'Будет плюсом:',
    'Дополнительно:',
  ]

  const blocks = text.split(/\n\n+/).filter((b) => b.trim())
  const out: string[] = []

  for (const block of blocks) {
    let chunk = block.trim()
    if (!chunk) continue

    for (const marker of INNER_SECTION_MARKERS) {
      const idx = chunk.toLowerCase().indexOf(marker.toLowerCase())
      if (idx > 0) {
        chunk = `${chunk.slice(0, idx).trim()}\n\n${chunk.slice(idx).trim()}`
      }
    }

    for (const sub of chunk.split(/\n\n+/).filter((b) => b.trim())) {
      const trimmed = sub.trim()
      if (!trimmed) continue
      let piece = trimmed
      if (piece.length > 320 && !/^Требования|^Функциональные/i.test(piece)) {
        piece = breakLongParagraphs(piece)
      }
      out.push(enhanceSectionBlocks(piece))
    }
  }

  return collapseSpacesPreservingNewlines(out.join('\n\n'))
}

/** HTML / редактор → plain text для POST /job/v1/vacancies. */
export function htmlToPlainDescriptionForAvito(html: unknown): string {
  let s = normalizeAvitoBreaksInSource(String(html ?? ''))
  if (!s.trim()) return ''

  const looksLikeHtml = /<\/?[a-z][^>]*>/i.test(s)
  if (!looksLikeHtml) {
    return structurePlainDescriptionForAvito(s)
  }

  s = s
    .replace(/<li[^>]*>/gi, '\n— ')
    .replace(/<\/li>/gi, '')
    .replace(/\n—\s*[—\-•·]\s+/g, '\n— ')
    .replace(/<\/ul>/gi, '\n\n')
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>\s*<\/p>/gi, '\n\n\n')
    .replace(/<\/p>\s*<p/gi, '\n\n<p')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6][^>]*>/gi, '')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')

  return structurePlainDescriptionForAvito(s)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function linesToParagraphsHtml(lines: string[], strong = false): string {
  return lines
    .map((line) => {
      const inner = escapeHtml(line)
      return strong ? `<p><strong>${inner}</strong></p>` : `<p>${inner}</p>`
    })
    .join('')
}

/** Plain text → HTML для Tiptap (отдельный <p> на строку — не схлопывается в одну простыню). */
export function plainDescriptionToEditorHtml(plain: string): string {
  const structured = structurePlainDescriptionForAvito(plain)
  if (!structured) return ''

  const blocks = structured.split(/\n\n+/).filter((b) => b.trim())
  const parts: string[] = []

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    const listLines = lines.filter((l) => /^[—\-•·]\s+/.test(l))
    const headLines = lines.filter((l) => !/^[—\-•·]\s+/.test(l))

    if (listLines.length > 0 && listLines.length >= lines.length - headLines.length) {
      if (headLines.length > 0) {
        parts.push(linesToParagraphsHtml(headLines, headLines.length === 1 && /:$/u.test(headLines[0])))
      }
      const items = listLines
        .map((l) => l.replace(/^[—\-•·]\s+/, '').trim())
        .filter(Boolean)
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')
      if (items) parts.push(`<ul>${items}</ul>`)
    } else if (lines.length === 1 && /:$/u.test(lines[0])) {
      parts.push(`<p><strong>${escapeHtml(lines[0])}</strong></p>`)
    } else {
      parts.push(linesToParagraphsHtml(lines))
    }
  }

  return parts.join('')
}

/** Единая точка: сырьё из Наймикс → HTML для редактора. */
export function formatDescriptionForAvitoEditor(raw: unknown): string {
  const source = String(raw ?? '').trim()
  if (!source) return ''

  const looksLikeHtml = /<\/?[a-z][^>]*>/i.test(source)
  if (looksLikeHtml) {
    const plain = htmlToPlainDescriptionForAvito(source)
    return plainDescriptionToEditorHtml(plain) || source
  }

  return plainDescriptionToEditorHtml(source)
}

/** Для публикации: description из формы (HTML) → Avito API с переносами \n<br>\n. */
export function formatDescriptionForAvitoApi(description: unknown): string {
  const plain = htmlToPlainDescriptionForAvito(description)
  return formatParagraphBreaksForAvitoApi(plain)
}
