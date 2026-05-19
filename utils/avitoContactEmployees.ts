/**
 * Контакты публикации Avito: телефон должен принадлежать сотруднику аккаунта.
 * @see GET /accounts-hierarchy/v1/employees, GET /core/v1/accounts/self (phones[])
 */

export type AvitoContactEmployeeOption = {
  /** Ключ опции в UI: emp:{id} | phone:{digits} */
  id: string
  name: string
  phone: string
  email?: string
  employee_id?: number | null
  label?: string
  is_chief?: boolean
}

/** Только цифры; для РФ — 11 цифр, начинается с 7. */
export function normalizeAvitoPhoneDigits(raw: unknown): string {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    return '7' + digits.slice(1)
  }
  if (digits.length === 10) {
    return '7' + digits
  }
  return digits
}

export function formatAvitoPhoneDisplay(digits: string): string {
  const d = normalizeAvitoPhoneDigits(digits)
  if (d.length === 11 && d.startsWith('7')) {
    return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`
  }
  return d ? `+${d}` : ''
}

export function buildAvitoContactEmployeeLabel(name: string, phoneDigits: string): string {
  const n = String(name ?? '').trim()
  const p = formatAvitoPhoneDisplay(phoneDigits)
  if (n && p) return `${n} — ${p}`
  return n || p || 'Контакт'
}

export function mapAvitoPhoneToApiPayload(phoneDigits: string): { number: string } | null {
  const digits = normalizeAvitoPhoneDigits(phoneDigits)
  if (digits.length < 10) return null
  return { number: digits }
}

function pushContactOption(
  out: AvitoContactEmployeeOption[],
  seen: Set<string>,
  row: {
    id: string
    name: string
    phone: string
    email?: string
    employee_id?: number | null
    is_chief?: boolean
  },
) {
  const phone = normalizeAvitoPhoneDigits(row.phone)
  if (!phone || seen.has(phone)) return
  seen.add(phone)
  const name = String(row.name ?? '').trim() || formatAvitoPhoneDisplay(phone)
  out.push({
    id: row.id,
    name,
    phone,
    email: String(row.email ?? '').trim() || undefined,
    employee_id: row.employee_id ?? null,
    is_chief: row.is_chief,
    label: buildAvitoContactEmployeeLabel(name, phone),
  })
}

function extractAvitoContactEmployeeItems(payload: unknown): unknown[] {
  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  if (Array.isArray(root.items)) return root.items
  if (Array.isArray(root)) return root
  const data = root.data
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>
    if (Array.isArray(nested.items)) return nested.items
  }
  return []
}

/** Ответ GET /avito/contact-employees (полный JSON или уже data: { items }). */
export function parseAvitoContactEmployeesResponse(payload: unknown): AvitoContactEmployeeOption[] {
  const items = extractAvitoContactEmployeeItems(payload)
  if (!items.length) return []

  const out: AvitoContactEmployeeOption[] = []
  const seen = new Set<string>()
  for (const row of items) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const phone = normalizeAvitoPhoneDigits(r.phone)
    if (!phone) continue
    const employeeId = r.employee_id != null ? Number(r.employee_id) : null
    const id = String(r.id ?? '').trim() || (employeeId ? `emp:${employeeId}` : `phone:${phone}`)
    pushContactOption(out, seen, {
      id,
      name: String(r.name ?? r.label ?? '').trim(),
      phone,
      email: r.email != null ? String(r.email) : undefined,
      employee_id: Number.isFinite(employeeId) && employeeId > 0 ? employeeId : null,
      is_chief: r.is_chief === true,
    })
  }
  return out
}

export function findAvitoContactEmployeeByPhone(
  options: AvitoContactEmployeeOption[],
  rawPhone: unknown,
): AvitoContactEmployeeOption | null {
  const digits = normalizeAvitoPhoneDigits(rawPhone)
  if (!digits) return null
  return options.find((o) => normalizeAvitoPhoneDigits(o.phone) === digits) ?? null
}
