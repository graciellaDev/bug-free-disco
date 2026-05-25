export interface ApplicationHistoryEvent {
  id: string | number;
  eventTitle: string;
  eventContent: string;
  eventLogDateTime: string;
}

export function applicationHistoryFromDetail(
  detail: { history?: ApplicationHistoryEvent[] } | null | undefined
): ApplicationHistoryEvent[] {
  const items = detail?.history;
  if (!Array.isArray(items)) return [];
  return items.filter(
    (e): e is ApplicationHistoryEvent =>
      e != null &&
      typeof e.eventTitle === 'string' &&
      typeof e.eventLogDateTime === 'string'
  );
}
