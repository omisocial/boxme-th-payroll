import { supabase } from './supabase'

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const existingHeaders = (options.headers ?? {}) as Record<string, string>
  // Don't set Content-Type for FormData — browser sets it with correct boundary
  const isFormData = options.body instanceof FormData
  return fetch(url, {
    ...options,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...existingHeaders,
    },
  })
}
