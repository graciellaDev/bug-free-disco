export type EventType =
  | 'system'
  | 'chat'
  | 'email'
  | 'note'
  | 'task'
  | 'comment'
  | 'messanger'
  | 'call';

export type ChatChannel = 'jobly' | 'hh' | 'avito' | 'rabota' | string;
export type MessangerChannel = 'telegram' | 'max' | string;

export type EventDirection = 'incoming' | 'outgoing' | null;

export type SystemPayload = { content: string };
export type CallPayload = { calls: Call[] };
export type NotePayload = { content: string };
export type TaskPayload = { title: string; scheduled?: string; user: string };
export type EmailPayload = { emails: EmailItem[] };
export type CommentPayload = { content: string };
export type ChatPayload = { content: string; company?: string; initials?: string };
export type MessangerPayload = { content: string; initials?: string };

export interface ApiEventBase {
  id: number;
  occurred_at: string;
  author_name: string | null;
  direction: EventDirection;
}

export type ApiEvent =
  | (ApiEventBase & { type: 'system'; payload: SystemPayload })
  | (ApiEventBase & { type: 'call'; payload: CallPayload })
  | (ApiEventBase & { type: 'note'; payload: NotePayload })
  | (ApiEventBase & { type: 'task'; payload: TaskPayload })
  | (ApiEventBase & { type: 'email'; payload: EmailPayload })
  | (ApiEventBase & { type: 'comment'; payload: CommentPayload })
  | (ApiEventBase & {
    type: 'chat';
    payload: ChatPayload;
    channel: ChatChannel;
  })
  | (ApiEventBase & {
    type: 'messanger';
    payload: MessangerPayload;
    channel: MessangerChannel;
  });

export interface ApiEventsResponse {
  data: ApiEvent[];
}

// Для использования в payload
export type Call = {
  id: number;
  number: string;
  duration: number;
  direction: 'incoming' | 'outgoing';
  status: 'completed' | 'cancelled' | 'pending';
  timestamp: string;
};

export type EmailItem = {
  id: number;
  subject: string;
  from: string;
  to: string;
  timestamp: string;
};
