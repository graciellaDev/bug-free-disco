import { formatDate, formatDateOnly } from "@/helpers/date";
import type { ApiEvent, ApiEventsResponse, CallPayload, ChatPayload, CommentPayload, EmailPayload, MessangerPayload, NotePayload, SystemPayload, TaskPayload } from "@/types/events";
import type { UiTimelineGroup, UiTimelineEvent } from "@/types/timeline";

export function mapApiEventToUiEvent(event: ApiEvent): UiTimelineEvent | null {
  const { id, occurred_at, author_name } = event;

  const time = formatDate(event.occurred_at);

  switch (event.type) {
    case 'system':
      return {
        id,
        type: 'system',
        time,
        content: event.payload.content,
        occurredAt: occurred_at,
      }

    case 'call':
      return {
        id,
        type: 'call',
        calls: event.payload.calls,
        occurredAt: occurred_at,
      }

    case 'note':
      return {
        id,
        type: 'note',
        time,
        author: author_name ?? '',
        content: event.payload.content,
        occurredAt: occurred_at,
      }

    case 'task':
      return {
        id,
        type: 'task',
        time,
        title: event.payload.title,
        scheduled: event.payload.scheduled,
        user: event.payload.user,
        occurredAt: occurred_at,
      }

    case 'email':
      return {
        id,
        type: 'email',
        emails: event.payload.emails,
        occurredAt: occurred_at,
      }

    case 'comment':
      return {
        id,
        type: 'comment',
        time,
        author: author_name ?? '',
        content: event.payload.content,
        occurredAt: occurred_at,
      }

    case 'chat':
      return {
        id,
        type: 'chat',
        time,
        author: author_name ?? '',
        content: event.payload.content,
        company: event.payload.company,
        initials: event.payload.initials,
        channel: event.channel,
        occurredAt: occurred_at,
      }

    case 'messanger':
      return {
        id,
        type: 'messanger',
        time,
        author: author_name ?? '',
        content: event.payload.content,
        initials: event.payload.initials,
        channel: event.channel,
        occurredAt: occurred_at,
      }

    default:
      return null
  }
}

export function groupByDate(events: UiTimelineEvent[]): UiTimelineGroup[] {
  const sorted = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)) // ASC

  const groups: UiTimelineGroup[] = [];
  for (const event of sorted) {
    const dayKey = formatDateOnly(event.occurredAt);
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup || lastGroup.date !== dayKey) {
      groups.push({ date: dayKey, events: [] })
    }
    groups[groups.length - 1].events.push(event);
  }
  return groups
}

export function mapEventsToTimelineGroups(response: ApiEventsResponse): UiTimelineGroup[] {
  const uiEvents = response.data
    .map(mapApiEventToUiEvent)
    .filter((e): e is UiTimelineEvent => e !== null);

  return groupByDate(uiEvents)
}
