/**
 * Префикс для редиректов /api/code-hh, code-avito и т.д.
 * Приоритет: NUXT_PUBLIC_API_BACKEND (если хост открывается в браузере) → публичный API / админка / APP_PUBLIC_URL → относительный /api.
 *
 * NUXT_PUBLIC_API_BACKEND часто задают как http://jobly-back:8000 для прокси Nitro **внутри Docker** —
 * такой хост в браузере даёт NXDOMAIN, поэтому для OAuth он пропускается.
 */
function isBrowserReachableOAuthOrigin(originUrl: string): boolean {
  const raw = String(originUrl || '').trim()
  if (!raw) return false
  try {
    const u = new URL(raw)
    const h = u.hostname.toLowerCase()
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true
    if (h.includes('.')) return true
    // IPv6
    if (u.hostname.includes(':')) return true
    // Одно слово без точки: jobly-back, mysql — только внутри docker-сети
    return false
  } catch {
    return false
  }
}

export async function resolveOAuthApiPrefix(runtimeConfig: {
  public: { apiBase?: string; apiBackend?: string }
}): Promise<string> {
  const fromEnv = String(runtimeConfig.public.apiBackend || '').replace(/\/$/, '')
  if (fromEnv && isBrowserReachableOAuthOrigin(fromEnv)) {
    return `${fromEnv}/api`
  }
  try {
    const base = String(runtimeConfig.public.apiBase || '/api').replace(/\/$/, '')
    const data = await $fetch<{ api_prefix?: string }>(
      `${base}/public/frontend-oauth-backend`
    )
    if (data?.api_prefix) {
      return String(data.api_prefix).replace(/\/$/, '')
    }
  } catch {
    // прокси/API недоступен — ниже fallback
  }
  return String(runtimeConfig.public.apiBase || '/api').replace(/\/$/, '')
}
