/**
 * Query-фрагмент для старта OAuth из браузера: return (path+query SPA) + front_origin (window.location.origin).
 * Бэкенд на проде сохраняет origin в сессии и редиректит обратно на локальный/нужный фронт.
 */
export function oauthClientStartQuery(fullPath: string): string {
  const returnEnc = encodeURIComponent(fullPath)
  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  const frontOriginEnc = encodeURIComponent(origin)
  return `return=${returnEnc}&front_origin=${frontOriginEnc}`
}
