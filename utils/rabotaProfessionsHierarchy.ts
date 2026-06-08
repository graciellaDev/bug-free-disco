export type RabotaProfessionNodeType = 'category' | 'group' | 'profession'

export interface RabotaProfessionNode {
  id: number
  local_id: number
  name: string
  tree: string
  selectable: boolean
  type: RabotaProfessionNodeType
  children?: RabotaProfessionNode[]
}

export interface RabotaProfessionSelection {
  id: number
  name: string
  tree?: string
  local_id?: number
  /** id профессии на rabota.ru (из rabota-professions-by-professional-role) */
  rabota_id?: number
}

export interface RabotaProfessionsHierarchyMeta {
  current_page?: number
  per_page?: number
  total?: number
  last_page?: number
  from?: number
  to?: number
}

const TREE_CODE_PATTERN = /^\d+(?:\.\d+)+$/

/** Скрываем заголовки групп, где name совпадает с кодом дерева (например «03.01.04»). */
export function isTreeCodeLabel(name: string, tree?: string): boolean {
  const label = String(name ?? '').trim()
  if (!label) return true
  if (tree && label === tree) return true
  return TREE_CODE_PATTERN.test(label)
}

export function getNodeKey(node: RabotaProfessionNode): string {
  if (node.id) return `id:${node.id}`
  if (node.local_id) return `local:${node.local_id}`
  return `tree:${node.tree}`
}

export function flattenSelectableProfessions(nodes: RabotaProfessionNode[] | null | undefined): RabotaProfessionSelection[] {
  const out: RabotaProfessionSelection[] = []
  const seen = new Set<string>()

  const walk = (list: RabotaProfessionNode[] | undefined) => {
    if (!Array.isArray(list)) return
    for (const node of list) {
      if (node.type === 'profession' && node.selectable && node.id) {
        const key = String(node.id)
        if (!seen.has(key)) {
          seen.add(key)
          out.push({ id: node.id, name: node.name, tree: node.tree, local_id: node.local_id })
        }
      }
      if (node.children?.length) walk(node.children)
    }
  }

  walk(nodes)
  return out
}

export function findProfessionByNameLoose(
  nodes: RabotaProfessionNode[] | null | undefined,
  name: string,
): RabotaProfessionSelection | null {
  const target = String(name ?? '').trim().toLowerCase()
  if (!target) return null
  const flat = flattenSelectableProfessions(nodes)
  const exact = flat.find((p) => p.name.trim().toLowerCase() === target)
  if (exact) return exact
  return flat.find((p) => p.name.trim().toLowerCase().includes(target) || target.includes(p.name.trim().toLowerCase())) ?? null
}

export interface RabotaProfessionColumnBlock {
  key: string
  name: string
  showHeader: boolean
  professions: RabotaProfessionSelection[]
}

/** Секции правой колонки: группы и профессии на любой глубине под выбранной категорией. */
export function buildRightColumnBlocks(node: RabotaProfessionNode | null | undefined): RabotaProfessionColumnBlock[] {
  if (!node?.children?.length) return []

  const blocks: RabotaProfessionColumnBlock[] = []

  const walk = (children: RabotaProfessionNode[]) => {
    for (const child of children) {
      if (child.type === 'group') {
        const professions = (child.children ?? [])
          .filter((n) => n.type === 'profession' && n.selectable && n.id)
          .map((n) => ({ id: n.id, name: n.name, tree: n.tree, local_id: n.local_id }))
        if (professions.length) {
          blocks.push({
            key: getNodeKey(child),
            name: child.name,
            showHeader: !isTreeCodeLabel(child.name, child.tree),
            professions,
          })
        }
        if (child.children?.length) {
          const nestedGroups = child.children.filter((n) => n.type !== 'profession')
          if (nestedGroups.length) walk(nestedGroups)
        }
      } else if (child.type === 'profession' && child.selectable && child.id) {
        blocks.push({
          key: getNodeKey(child),
          name: '',
          showHeader: false,
          professions: [{ id: child.id, name: child.name, tree: child.tree, local_id: child.local_id }],
        })
      } else if (child.children?.length) {
        walk(child.children)
      }
    }
  }

  walk(node.children)
  return blocks
}

export interface RabotaLeftColumnSection {
  header: string | null
  items: RabotaProfessionNode[]
}

/** Левая колонка: корень + подкатегории; при поиске — и сами корневые категории без вложенных sub. */
export function buildLeftColumnSections(roots: RabotaProfessionNode[] | null | undefined): RabotaLeftColumnSection[] {
  if (!Array.isArray(roots) || !roots.length) return []

  const sections: RabotaLeftColumnSection[] = []

  for (const root of roots) {
    const subcategories = (root.children ?? []).filter((c) => c.type === 'category')
    if (subcategories.length) {
      sections.push({ header: root.name, items: subcategories })
    } else if (root.type === 'category') {
      sections.push({ header: null, items: [root] })
    }
  }

  return sections
}

export function findFirstNavigableSubcategory(roots: RabotaProfessionNode[] | null | undefined): RabotaProfessionNode | null {
  const sections = buildLeftColumnSections(roots)
  return sections[0]?.items[0] ?? null
}

export function nodeHasProfessionDescendants(node: RabotaProfessionNode | null | undefined): boolean {
  return buildRightColumnBlocks(node).length > 0
}

export interface RabotaProfessionByRoleItem {
  id: number
  name: string
  rabota_id?: number
  tree?: string
  selectable?: boolean
  rabota_profession_id?: number
  rabota_professional_category_id?: number
  rabota_professional_group_id?: number
}

/** id профессиональной сферы rabota.ru для POST /me/vacancy/create.json → professional_areas[].id */
export function resolveRabotaProfessionalAreaId(
  role: { id?: unknown; rabota_id?: unknown; rabota_profession_id?: unknown } | null | undefined,
): number | null {
  if (!role || typeof role !== 'object') return null
  const raw = role.rabota_id ?? role.rabota_profession_id ?? role.id
  if (raw == null || String(raw).trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null
}

/** Первая сфера из ответа rabota-professions-by-professional-role. */
export function mapRabotaProfessionByRoleItem(
  item: RabotaProfessionByRoleItem | null | undefined,
): RabotaProfessionSelection | null {
  if (!item) return null
  const rabotaId = resolveRabotaProfessionalAreaId(item)
  if (rabotaId == null) return null
  return {
    id: rabotaId,
    rabota_id: item.rabota_id != null ? Number(item.rabota_id) : rabotaId,
    name: item.name,
    tree: item.tree,
  }
}

export interface HhRoleCatalogCategory {
  id?: number | string
  name?: string
  roles?: Array<{ id?: number | string; name?: string; hh_id?: number | string }>
}

function normalizeSpecLabel(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase()
}

/** Роль hh.ru и родительская категория по строке/объекту specializations (как в AddPublication findHhRoleInFullCatalog). */
export function findHhRoleInCategories(
  specializations: unknown,
  categories: HhRoleCatalogCategory[] | null | undefined,
): { role: { id?: number | string; name?: string }; category: HhRoleCatalogCategory } | null {
  if (specializations == null || specializations === '' || !categories?.length) return null

  const matchByPredicate = (predicate: (r: { id?: number | string; name?: string }) => boolean) => {
    for (const cat of categories) {
      const roles = Array.isArray(cat?.roles) ? cat.roles : []
      for (const r of roles) {
        if (predicate(r)) return { role: r, category: cat }
      }
    }
    return null
  }

  if (typeof specializations === 'object' && specializations !== null) {
    const specObj = specializations as Record<string, unknown>
    const directId = specObj.hh_id ?? specObj.professional_role_id ?? specObj.id
    if (directId != null && String(directId).trim() !== '') {
      const idStr = String(directId).trim()
      const byId = matchByPredicate((r) => r.id != null && String(r.id) === idStr)
      if (byId) return byId
      return { role: { id: directId as number | string, name: String(specObj.name ?? '') }, category: categories[0] }
    }
    if (specObj.name) {
      const target = normalizeSpecLabel(specObj.name)
      const byName = matchByPredicate((r) => r?.name != null && normalizeSpecLabel(r.name) === target)
      if (byName) return byName
    }
    return null
  }

  if (typeof specializations !== 'string') return null

  const raw = specializations.trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    const byId = matchByPredicate((r) => r.id != null && String(r.id) === raw)
    if (byId) return byId
    return { role: { id: raw }, category: categories[0] }
  }

  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean)
  const candidates = parts.length > 0 ? parts : [raw]

  for (const part of candidates) {
    const n = normalizeSpecLabel(part)
    if (!n) continue
    const hit = matchByPredicate((r) => r?.name != null && normalizeSpecLabel(r.name) === n)
    if (hit) return hit
  }
  for (const part of candidates) {
    const n = normalizeSpecLabel(part)
    if (!n || n.length < 4) continue
    const hit = matchByPredicate((r) => {
      if (!r?.name) return false
      const rn = normalizeSpecLabel(r.name)
      return rn.includes(n) || n.includes(rn)
    })
    if (hit) return hit
  }
  return null
}

function joblySpecializationSource(vacancy: Record<string, unknown>): unknown {
  const s = vacancy.specializations
  if (s != null && s !== '') return s
  const pr = vacancy.professional_role
  if (pr != null && pr !== '') return pr
  const role = vacancy.role
  if (role != null && role !== '') return role
  return null
}

/** ID professional_role (hh) из вакансии Jobly для запроса маппинга на rabota.ru. */
export function resolveProfessionalRoleIdFromVacancy(
  vacancy: Record<string, unknown> | null | undefined,
  hhCategories?: HhRoleCatalogCategory[] | null,
): number | string | null {
  if (!vacancy || typeof vacancy !== 'object') return null

  const spec = vacancy.specializations
  if (spec != null && typeof spec === 'object') {
    const specObj = spec as Record<string, unknown>
    const fromSpec = specObj.hh_id ?? specObj.professional_role_id ?? specObj.id
    if (fromSpec != null && String(fromSpec).trim() !== '') return fromSpec as number | string
  }
  if (typeof spec === 'string' && /^\d+$/.test(spec.trim())) {
    return spec.trim()
  }

  const pr = vacancy.professional_role
  if (pr != null && typeof pr === 'object') {
    const prObj = pr as Record<string, unknown>
    const fromRole = prObj.hh_id ?? prObj.id
    if (fromRole != null && String(fromRole).trim() !== '') return fromRole as number | string
  }

  if (vacancy.professional_role_id != null) return vacancy.professional_role_id as number | string

  const hhApiRoles = vacancy._hh_api_professional_roles
  if (Array.isArray(hhApiRoles) && hhApiRoles.length > 0) {
    const first = hhApiRoles[0] as Record<string, unknown>
    const fromApi = first?.id ?? first?.hh_id
    if (fromApi != null && String(fromApi).trim() !== '') return fromApi as number | string
    if (hhCategories?.length) {
      const hit = findHhRoleInCategories(first, hhCategories)
      if (hit?.role?.id != null) return hit.role.id
    }
  }

  if (hhCategories?.length) {
    const source = joblySpecializationSource(vacancy)
    if (source != null) {
      const hit = findHhRoleInCategories(source, hhCategories)
      if (hit?.role?.id != null) return hit.role.id
    }
  }

  return null
}

/** id специализации Jobly из ответа GET /api/specializations_by_hh/{hhRoleId}. */
export function resolveProfessionalRoleIdForRabotaFromSpecializationByHh(
  payload: Record<string, unknown> | null | undefined,
): number | string | null {
  if (!payload || typeof payload !== 'object') return null
  const id = payload.id ?? payload.professional_role_id ?? payload.specialization_id
  if (id != null && String(id).trim() !== '') return id as number | string
  return null
}
