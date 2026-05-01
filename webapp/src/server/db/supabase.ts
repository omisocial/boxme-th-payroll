import { createClient } from '@supabase/supabase-js'
import type { Env } from '../auth/rbac'

export type SB = ReturnType<typeof createClient>

export function getSupabase(env: Env): SB {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

export async function storageUpload(
  sb: SB,
  bucket: string,
  path: string,
  data: ArrayBuffer | Blob | string,
  contentType: string
): Promise<void> {
  const { error } = await sb.storage.from(bucket).upload(path, data, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(error.message)
}

export async function storageDownload(sb: SB, bucket: string, path: string): Promise<string> {
  const { data, error } = await sb.storage.from(bucket).download(path)
  if (error || !data) throw new Error(error?.message ?? 'File not found in storage')
  return data.text()
}
