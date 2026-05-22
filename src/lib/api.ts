const BASE = 'https://cussed-retake-arose.ngrok-free.dev'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  me: () => apiFetch<{ name: string; email?: string; picture?: string; slackUser?: string; slackTeam?: string; providers: string[] }>('/api/me'),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  gmail: {
    messages: () => apiFetch<{ messages: GmailMessage[] }>('/api/gmail/messages'),
  },
  slack: {
    channels: () => apiFetch<{ channels: SlackChannel[] }>('/api/slack/channels'),
    messages: (channelId: string) =>
      apiFetch<{ messages: SlackMessage[] }>(`/api/slack/channels/${channelId}/messages`),
  },
}

export interface GmailMessage {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
  isUnread: boolean
}

export interface SlackChannel {
  id: string
  name: string
  isPrivate: boolean
  memberCount: number
  topic: string
  purpose: string
}

export interface SlackMessage {
  ts: string
  text: string
  user: string
  time: string | null
}
