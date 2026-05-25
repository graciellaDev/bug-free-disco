import { apiGet, apiPatch, apiPost, apiPut } from './client';

export type NotificationChannelKey =
  | 'email'
  | 'sms'
  | 'browser'
  | 'system'
  | 'messenger';

export type NotificationChannelSettings = {
  enabled: boolean;
  events: Record<string, boolean>;
};

export type NotificationSettings = {
  channels: Record<NotificationChannelKey, NotificationChannelSettings>;
  system_position?: string;
};

export type NotificationSchemaEvent = {
  key: string;
  title: string;
  description?: string | null;
  locked?: boolean;
  default?: boolean;
};

export type NotificationSchemaChannel = {
  key: NotificationChannelKey;
  title: string;
  description?: string | null;
  events: NotificationSchemaEvent[];
  /** Если true — канал нельзя выключить. */
  locked?: boolean;
  default_enabled?: boolean;
};

export type NotificationSchemaSection = {
  key: string;
  title: string;
  description?: string | null;
  channels: NotificationSchemaChannel[];
};

export type NotificationSettingsGetResponse = {
  schema: NotificationSchemaSection[];
  settings: NotificationSettings;
};

export async function getNotificationSettings(opts?: { signal?: AbortSignal }) {
  return await apiGet<NotificationSettingsGetResponse>(
    '/notification-settings',
    undefined,
    { skipLoader: true, signal: opts?.signal }
  );
}

export async function patchNotificationSettings(
  payload: Partial<NotificationSettings>,
  opts?: { signal?: AbortSignal }
) {
  return await apiPatch<NotificationSettingsGetResponse, Partial<NotificationSettings>>(
    '/notification-settings',
    payload,
    { skipLoader: true, signal: opts?.signal }
  );
}

export async function putNotificationSettings(
  payload: NotificationSettings,
  opts?: { signal?: AbortSignal }
) {
  return await apiPut<NotificationSettingsGetResponse, NotificationSettings>(
    '/notification-settings',
    payload,
    { skipLoader: true, signal: opts?.signal }
  );
}

export type PushPublicKeyResponse = {
  public_key: string;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function getPushPublicKey(opts?: { signal?: AbortSignal }) {
  return await apiGet<PushPublicKeyResponse>(
    '/push/public-key',
    undefined,
    { skipLoader: true, signal: opts?.signal }
  );
}

export async function subscribePush(
  subscription: PushSubscriptionPayload,
  opts?: { signal?: AbortSignal }
) {
  return await apiPost<{ id: number; enabled: boolean }, { subscription: PushSubscriptionPayload }>(
    '/push/subscribe',
    { subscription },
    { skipLoader: true, signal: opts?.signal }
  );
}

export async function unsubscribePush(
  endpoint?: string,
  opts?: { signal?: AbortSignal }
) {
  return await apiPost<{ message?: string }, { endpoint?: string }>(
    '/push/unsubscribe',
    endpoint ? { endpoint } : {},
    { skipLoader: true, signal: opts?.signal }
  );
}

