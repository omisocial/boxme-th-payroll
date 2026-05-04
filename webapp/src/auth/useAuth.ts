import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { apiFetch } from '../utils/apiFetch'

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

  const loadProfile = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auth/me')
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadProfile()
      } else {
        setState({ user: null, loading: false })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile()
      } else {
        setState({ user: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ user: null, loading: false })
  }, [])

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, message: error.message }
    const res = await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    })
    const json = await res.json() as { success: boolean; message?: string }
    if (json.success) await loadProfile()
    return json
  }, [loadProfile])

  return { ...state, login, logout, changePassword }
}
