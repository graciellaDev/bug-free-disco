/** Отступ тоста от нижней кромки верхнего «хрома» (шапка / nav). */
export const JOBLY_TOAST_GAP_PX = 10;

/**
 * Нижняя граница фиксированной/липкой верхней панели.
 * При необходимости пометьте контейнер шапки атрибутом data-jobly-top-chrome.
 */
export function getJoblyTopChromeBottomPx(): number {
  const marked = document.querySelector('[data-jobly-top-chrome]');
  if (marked instanceof HTMLElement) {
    return Math.ceil(marked.getBoundingClientRect().bottom);
  }
  let maxBottom = 0;
  const roots = document.querySelectorAll('header, nav, [role="banner"]');
  for (let i = 0; i < roots.length; i++) {
    const el = roots[i];
    if (!(el instanceof HTMLElement)) continue;
    const st = getComputedStyle(el);
    if (st.position !== 'fixed' && st.position !== 'sticky') continue;
    const r = el.getBoundingClientRect();
    if (r.top > 4) continue;
    if (r.height < 6) continue;
    maxBottom = Math.max(maxBottom, r.bottom);
  }
  if (maxBottom > 0) return Math.ceil(maxBottom);

  /**
   * Глобальная шапка у нас — часто `div.sticky.top-0`, не семантический header/nav.
   * Берём широкие fixed/sticky-блоки, прижатые к верху вьюпорта.
   */
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const minWidth = Math.min(vw * 0.72, vw - 24);
  const all = document.body?.querySelectorAll('div') ?? [];
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (!(el instanceof HTMLElement)) continue;
    const st = getComputedStyle(el);
    if (st.position !== 'fixed' && st.position !== 'sticky') continue;
    const r = el.getBoundingClientRect();
    if (r.top > 4 || r.height < 8) continue;
    if (r.width < minWidth) continue;
    maxBottom = Math.max(maxBottom, r.bottom);
  }
  return Math.ceil(maxBottom);
}

export function getJoblyToastTopPx(): number {
  return getJoblyTopChromeBottomPx() + JOBLY_TOAST_GAP_PX;
}
