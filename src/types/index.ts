// ── Shared entity interfaces ────────────────────────────────────────

export interface BillingUser {
  id: number
  name: string
  billingId: string | number
  status?: string
}

export interface BitrixUser {
  id: number
  name: string
  bitrixId: string | number
  status?: string
}

export interface UserLink {
  id: number
  billingId: string | number
  bitrixId: string | number
  billingUserId?: number
  bitrixUserId?: number
  billingUserName?: string
  bitrixUserName?: string
  status?: 'Active' | 'Inactive' | 'Archived'
  createdAt?: string
}

export interface Switch {
  id: number
  name?: string
  ip?: string
  port?: number
  cityId?: number
  vendorId?: number
  status?: string
  [key: string]: unknown
}

export interface City {
  id: number
  name: string
}

export interface Vendor {
  id: number
  name: string
}

// ── API envelope ────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  statusCode: number
  message: string | null
  data: T
}

// ── Toast ───────────────────────────────────────────────────────────

export type ToastType = 'ok' | 'err'

export interface ToastItem {
  id: number
  msg: string
  type: ToastType
}

// ── Navigation ──────────────────────────────────────────────────────

export type PageId =
  | 'dashboard'
  | 'billing'
  | 'bitrix'
  | 'links'
  | 'tasks'
  | 'switch'
  | 'city'
  | 'vendor'

export interface NavCounts {
  billing: number
  bitrix: number
  links: number
  sw: number
  city: number
  vendor: number
}

// ── Global search cache ─────────────────────────────────────────────

export interface SearchCache {
  billing: BillingUser[]
  bitrix: BitrixUser[]
  links: UserLink[]
  sw: Switch[]
  city: City[]
  vendor: Vendor[]
}

// ── API call helper ─────────────────────────────────────────────────

export type ApiCall = (path: string, opts?: RequestInit) => Promise<{ data: unknown; msg: string | null }>

// ── Auth ────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}
