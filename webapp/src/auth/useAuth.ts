import { useState, useEffect, useCallback } from 'react'

export interface AuthUser {
  id: string
  email: string
  role: string
  country_scope: string
  warehouse_id: string | null
  force_password_change: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json() as { data: { user: AuthUser } }
        setState({ user: json.data.user, loading: false })
      } else {
        setState({ user: null, loading: false })
      }
    } catch {
      setState({ user: null, loading: false })
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json() as { success: boolean; data?: { user: AuthUser }; message?: string }
    if (json.success && json.data) {
      setState({ user: json.data.user, loading: false })
      return { ok: true }
    }
    return { ok: false, message: json.message ?? 'Login failed' }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setState({ user: null, loading: false })
  }, [])

  const changePassword = useCallback(async (newPassword: string) => {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    })
    const json = await res.json() as { success: boolean; message?: string }
    if (json.success) {
      // Refresh user — force_password_change should be false now
      await fetchMe()
    }
    return json
  }, [fetchMe])

  return { ...state, login, logout, changePassword }
}
