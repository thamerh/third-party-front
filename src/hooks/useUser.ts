import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export interface User {
  name: string
  email?: string
  picture?: string
  slackUser?: string
  slackTeam?: string
  providers: string[]
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return { user, loading, logout, setUser }
}
