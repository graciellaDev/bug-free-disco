export type TextLinkSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href: string };

/**
 * Разбивает текст на фрагменты: обычный текст и http(s)-ссылки (для <a>).
 * Хвостовая пунктуация у ссылки (точка, скобка) убирается из href.
 */
export function splitTextWithLinks(raw: string): TextLinkSegment[] {
  if (raw == null || raw === '') return [];

  const re = /(https?:\/\/[^\s<>"'()[\]{}]+)/gi;
  const segments: TextLinkSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      segments.push({ kind: 'text', text: raw.slice(last, m.index) });
    }
    const matched = m[1];
    const href = matched.replace(/[),.;:!?'"»\]]+$/u, '');
    if (/^https?:\/\//i.test(href) && href.length >= 8) {
      segments.push({ kind: 'link', text: href, href });
    } else {
      segments.push({ kind: 'text', text: matched });
    }
    last = m.index + m[0].length;
  }

  if (last < raw.length) {
    segments.push({ kind: 'text', text: raw.slice(last) });
  }

  if (segments.length === 0) {
    return [{ kind: 'text', text: raw }];
  }
  return segments;
}
