// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

export type CountryCode = 'TH' | 'VN' | 'PH'
export type RoleCode = 'super_admin' | 'country_admin' | 'hr' | 'supervisor' | 'viewer'

export interface UserSession {
  id: string
  email: string
  role: RoleCode
  country_scope: CountryCode | '*'
  warehouse_id?: string
  force_password_change: boolean
}

// Auth
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserSession
}

// Worker
export interface WorkerRow {
  id: string
  country_code: CountryCode
  warehouse_id: string
  code: string
  name_local: string
  name_en?: string
  department_code?: string
  shift_code?: string
  grade_id?: string
  job_type_code: string
  status: 'active' | 'resigned' | 'suspended'
  bank_code?: string
  bank_account?: string
  start_date?: string
  end_date?: string
  created_at: string
}

// Attendance import
export interface ImportPreviewRow {
  rowIndex: number
  workDate: string
  fullName: string
  checkin?: string
  checkout?: string
  note?: string
  shiftCode?: string
  warning?: string
}

export interface ImportPreviewResponse {
  importSessionId: string
  rows: ImportPreviewRow[]
  warnings: string[]
  totalRows: number
}

export interface ImportCommitRequest {
  importSessionId: string
}

export interface ImportCommitResponse {
  imported: number
  skipped: number
  errors: string[]
}
