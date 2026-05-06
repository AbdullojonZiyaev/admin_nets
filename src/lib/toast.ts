import { useState } from 'react'
import type { ToastItem, ToastType } from '../types'

// Module-level setter — populated by the single useToasts() instance in RootApp
let _setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>> | null = null

/**
 * Call once at the top of your root component to wire up the toast system.
 * Returns the current list of toasts to render.
 */
export function useToasts(): ToastItem[] {
  const [list, setList] = useState<ToastItem[]>([])
  _setToasts = setList
  return list
}

/**
 * Fire a toast from anywhere — no React context needed.
 * type: 'ok' | 'err'
 */
export function toast(msg: string, type: ToastType = 'ok', duration = 3500): void {
  if (!_setToasts) return
  const id = Date.now() + Math.random()
  _setToasts(l => [...l, { id, msg, type }])
  setTimeout(() => _setToasts!(l => l.filter(x => x.id !== id)), duration)
}
