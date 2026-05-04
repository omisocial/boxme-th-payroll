import type { SB } from '../db/supabase'

export interface AuthUser {
  id: string
  email: string
  role: string
  country_scope: string
  warehouse_id: string | null
  force_password_change: boolean
}

export async function resolveProfile(sb: SB, userId: string): Promise<AuthUser | null> {
  const { data: user } = await sb.from('users')
    .select('id, email, role, country_scope, warehouse_id, force_password_change, active')
    .eq('id', userId)
    .eq('active', true)
    .maybeSingle()

  if (!user) return null
  const u = user as Record<string, unknown>
  return {
    id: u['id'] as string,
    email: u['email'] as string,
    role: u['role'] as string,
    country_scope: u['country_scope'] as string,
    warehouse_id: u['warehouse_id'] as string | null,
    force_password_change: Boolean(u['force_password_change']),
  }
}
