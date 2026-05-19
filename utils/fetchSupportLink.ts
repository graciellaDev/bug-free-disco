export type SupportLinkConfig = {
  url: string | null
  label: string | null
}

export async function fetchSupportLink(): Promise<SupportLinkConfig> {
  try {
    const data = await $fetch<{ url?: string | null; label?: string | null }>(
      '/api/public/support',
    )
    const url = typeof data?.url === 'string' ? data.url.trim() : ''
    const label = typeof data?.label === 'string' ? data.label.trim() : ''
    return {
      url: url || null,
      label: label || null,
    }
  } catch {
    return { url: null, label: null }
  }
}

export function resolveSupportLinkLabel(url: string, label: string | null): string {
  if (label) {
    return label
  }
  if (url.startsWith('mailto:')) {
    const email = url.slice(7).split('?')[0]?.trim()
    return email || 'Связаться с поддержкой'
  }
  try {
    const parsed = new URL(url)
    const path = parsed.pathname === '/' ? '' : parsed.pathname
    return `${parsed.host}${path}` || url
  } catch {
    return url
  }
}
