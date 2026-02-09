import type {
  ChatChannel,
  MessangerChannel,
  Call,
  EmailItem,
} from './events';

export interface TimelineMessage {
  time: string;
  author: string;
  content: string;
  company?: string;
  avatar?: string;
  initials?: string;
  channel?: ChatChannel | MessangerChannel | string;
}

export type UiTimelineEvent =
  | {
    id: number;
    type: 'system';
    time: string;
    content: string;
    occurredAt: string
  } | {
    id: number;
    type: 'call';
    calls: Call[];
    occurredAt: string
  } | {
    id: number;
    type: 'note';
    time: string;
    author: string;
    content: string;
    occurredAt: string
  } | {
    id: number;
    type: 'task';
    time: string;
    title: string;
    scheduled?: string;
    user: string;
    occurredAt: string
  } | {
    id: number;
    type: 'email';
    emails: EmailItem[];
    occurredAt: string
  } | {
    id: number;
    type: 'comment';
    time: string;
    author: string;
    content: string;
    occurredAt: string
  } | {
    id: number;
    type: 'chat';
    time: string;
    author: string;
    content: string;
    company?: string;
    initials?: string;
    channel: ChatChannel;
    occurredAt: string;
  } | {
    id: number;
    type: 'messanger';
    time: string;
    author: string;
    content: string;
    initials?: string;
    channel: MessangerChannel;
    occurredAt: string;
  };

export type UiTimelineEventType =
  | 'system'
  | 'chat'
  | 'email'
  | 'call'
  | 'note'
  | 'task'
  | 'messanger'
  | 'comment';

export interface UiTimelineGroup {
  date: string;
  events: UiTimelineEvent[];
}
