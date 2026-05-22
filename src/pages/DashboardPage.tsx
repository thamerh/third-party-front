import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, GmailMessage, SlackChannel, SlackMessage } from '../lib/api'
import type { User } from '../hooks/useUser'
import styles from './DashboardPage.module.css'

const BACKEND = 'https://cussed-retake-arose.ngrok-free.dev'

interface Props {
  user: User
  logout: () => void
  setUser: (u: User) => void
}

type Tab = 'gmail' | 'slack'

export function DashboardPage({ user, logout }: Props) {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>(
    params.get('connected') === 'slack' ? 'slack' : 'gmail'
  )

  // Gmail state
  const [emails, setEmails] = useState<GmailMessage[]>([])
  const [gmailLoading, setGmailLoading] = useState(false)
  const [gmailError, setGmailError] = useState<string | null>(null)

  // Slack state
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(null)
  const [messages, setMessages] = useState<SlackMessage[]>([])
  const [slackLoading, setSlackLoading] = useState(false)
  const [slackError, setSlackError] = useState<string | null>(null)
  const [msgLoading, setMsgLoading] = useState(false)

  const hasGoogle = user.providers.includes('google')
  const hasSlack  = user.providers.includes('slack')

  // Auto-load on tab switch
  useEffect(() => {
    if (tab === 'gmail' && hasGoogle && emails.length === 0) loadGmail()
    if (tab === 'slack' && hasSlack && channels.length === 0) loadSlack()
  }, [tab])

  async function loadGmail() {
    setGmailLoading(true); setGmailError(null)
    try {
      const data = await api.gmail.messages()
      setEmails(data.messages)
    } catch (e: any) {
      setGmailError(e.message)
    } finally {
      setGmailLoading(false)
    }
  }

  async function loadSlack() {
    setSlackLoading(true); setSlackError(null)
    try {
      const data = await api.slack.channels()
      setChannels(data.channels)
    } catch (e: any) {
      setSlackError(e.message)
    } finally {
      setSlackLoading(false)
    }
  }

  async function openChannel(ch: SlackChannel) {
    setSelectedChannel(ch)
    setMsgLoading(true)
    try {
      const data = await api.slack.messages(ch.id)
      setMessages(data.messages)
    } catch {
      setMessages([])
    } finally {
      setMsgLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>⬡ inbox</div>

        {/* User */}
        <div className={styles.userCard}>
          {user.picture && <img src={user.picture} alt="" className={styles.avatar} />}
          <div>
            <div className={styles.userName}>{user.name}</div>
            {user.email && <div className={styles.userEmail}>{user.email}</div>}
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${tab === 'gmail' ? styles.active : ''}`}
            onClick={() => setTab('gmail')}
          >
            <span className={styles.navIcon}>✉</span>
            Gmail
            {!hasGoogle && <span className={styles.navBadge}>connect</span>}
          </button>
          <button
            className={`${styles.navItem} ${tab === 'slack' ? styles.active : ''}`}
            onClick={() => setTab('slack')}
          >
            <span className={styles.navIcon}>#</span>
            Slack
            {!hasSlack && <span className={styles.navBadge}>connect</span>}
          </button>
        </nav>

        {/* Connect providers */}
        <div className={styles.connects}>
          {!hasGoogle && (
            <a href={`${BACKEND}/auth/google`} className={`${styles.connectBtn} ${styles.connectGoogle}`}>
              + Connect Google
            </a>
          )}
          {!hasSlack && (
            <a href={`${BACKEND}/auth/slack`} className={`${styles.connectBtn} ${styles.connectSlack}`}>
              + Connect Slack
            </a>
          )}
        </div>

        <button className={styles.logout} onClick={logout}>← Sign out</button>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {tab === 'gmail' && (
          <GmailView
            emails={emails}
            loading={gmailLoading}
            error={gmailError}
            hasGoogle={hasGoogle}
            onRefresh={loadGmail}
          />
        )}
        {tab === 'slack' && (
          <SlackView
            channels={channels}
            messages={messages}
            selectedChannel={selectedChannel}
            loading={slackLoading}
            msgLoading={msgLoading}
            error={slackError}
            hasSlack={hasSlack}
            onSelectChannel={openChannel}
            onRefresh={loadSlack}
          />
        )}
      </main>
    </div>
  )
}

// ─── Gmail View ───────────────────────────────────────────────────────────────
function GmailView({ emails, loading, error, hasGoogle, onRefresh }: {
  emails: GmailMessage[]
  loading: boolean
  error: string | null
  hasGoogle: boolean
  onRefresh: () => void
}) {
  if (!hasGoogle) return (
    <EmptyState
      icon="✉"
      title="Connect Gmail"
      desc="Link your Google account to read your inbox here."
      action={<a href="https://cussed-retake-arose.ngrok-free.dev/auth/google" className="connectAction">Connect Google →</a>}
    />
  )

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Inbox</h2>
        <button className={styles.refreshBtn} onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {error && <div className={styles.errBox}>⚠ {error}</div>}
      {loading && <Loader />}

      {!loading && emails.length === 0 && !error && (
        <EmptyState icon="✉" title="No messages" desc="Your inbox is empty." />
      )}

      <div className={styles.list}>
        {emails.map((m, i) => (
          <div
            key={m.id}
            className={`${styles.emailRow} ${m.isUnread ? styles.unread : ''}`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className={styles.emailMeta}>
              <span className={styles.emailFrom}>{formatFrom(m.from)}</span>
              <span className={styles.emailDate}>{formatDate(m.date)}</span>
            </div>
            <div className={styles.emailSubject}>{m.subject}</div>
            <div className={styles.emailSnippet}>{m.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Slack View ───────────────────────────────────────────────────────────────
function SlackView({ channels, messages, selectedChannel, loading, msgLoading, error, hasSlack, onSelectChannel, onRefresh }: {
  channels: SlackChannel[]
  messages: SlackMessage[]
  selectedChannel: SlackChannel | null
  loading: boolean
  msgLoading: boolean
  error: string | null
  hasSlack: boolean
  onSelectChannel: (ch: SlackChannel) => void
  onRefresh: () => void
}) {
  if (!hasSlack) return (
    <EmptyState
      icon="#"
      title="Connect Slack"
      desc="Link your Slack workspace to browse channels here."
      action={<a href="https://cussed-retake-arose.ngrok-free.dev/auth/slack" className="connectAction">Connect Slack →</a>}
    />
  )

  return (
    <div className={styles.slackLayout}>
      {/* Channel list */}
      <div className={styles.channelList}>
        <div className={styles.panelHeader}>
          <h2>Channels</h2>
          <button className={styles.refreshBtn} onClick={onRefresh} disabled={loading}>
            {loading ? '...' : '↻'}
          </button>
        </div>
        {error && <div className={styles.errBox}>⚠ {error}</div>}
        {loading && <Loader />}
        {channels.map((ch, i) => (
          <button
            key={ch.id}
            className={`${styles.channelItem} ${selectedChannel?.id === ch.id ? styles.channelActive : ''}`}
            style={{ animationDelay: `${i * 20}ms` }}
            onClick={() => onSelectChannel(ch)}
          >
            <span className={styles.chanHash}>{ch.isPrivate ? '🔒' : '#'}</span>
            <span className={styles.chanName}>{ch.name}</span>
            {ch.memberCount > 0 && (
              <span className={styles.chanCount}>{ch.memberCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className={styles.messagePane}>
        {!selectedChannel ? (
          <div className={styles.selectPrompt}>
            <span>←</span> Select a channel
          </div>
        ) : (
          <>
            <div className={styles.panelHeader}>
              <h2># {selectedChannel.name}</h2>
              {selectedChannel.topic && (
                <span className={styles.topicText}>{selectedChannel.topic}</span>
              )}
            </div>
            {msgLoading && <Loader />}
            <div className={styles.messageList}>
              {messages.map((m) => (
                <div key={m.ts} className={styles.messageRow}>
                  <div className={styles.msgMeta}>
                    <span className={styles.msgUser}>{m.user}</span>
                    <span className={styles.msgTime}>{m.time ? formatTime(m.time) : ''}</span>
                  </div>
                  <div className={styles.msgText}>{m.text}</div>
                </div>
              ))}
              {!msgLoading && messages.length === 0 && (
                <div className={styles.selectPrompt}>No messages in this channel.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
function EmptyState({ icon, title, desc, action }: {
  icon: string; title: string; desc: string; action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 40 }}>
      <div style={{ fontSize: 40, opacity: 0.3 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center', maxWidth: 300 }}>{desc}</div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.1)',
        borderTopColor: 'var(--accent-s)',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  )
}

function formatFrom(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*</)
  return match ? match[1].trim() : from.replace(/<.*>/, '').trim()
}

function formatDate(date: string) {
  try {
    const d = new Date(date)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch { return date }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}
