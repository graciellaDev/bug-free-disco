/** Имена пресетов с бекенда (DefaultFunnelTemplatePresets) — для группировки в UI. */
export const FUNNEL_TEMPLATE_PRESET_NAMES: readonly string[] = [
  'Универсальный подбор',
  'IT и digital',
  'Массовый подбор (ритейл, производство)',
  'Продажи и коммерция',
  'Офис и администрация',
  'Медицина и фарма',
  'Строительство и рабочие специальности',
  'HoReCa и гостеприимство',
] as const

export function isPresetFunnelTemplate(name: string): boolean {
  return (FUNNEL_TEMPLATE_PRESET_NAMES as readonly string[]).includes(name)
}
