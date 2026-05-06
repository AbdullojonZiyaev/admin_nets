import React, { useState } from 'react'
import { callApi } from '../lib/api'
import { toast } from '../lib/toast'
import type { LoginPayload } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

interface Props {
  onLogin: (token: string) => void
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast('Введите логин и пароль', 'err')
      return
    }
    setLoading(true)
    try {
      const payload: LoginPayload = { email: email.trim(), password }
      const r = await callApi<unknown>(API_BASE, '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const d = r.data
      const token =
        typeof d === 'string' ? d :
        (d as Record<string, unknown>)?.accessToken as string | undefined ??
        (d as Record<string, unknown>)?.access_token as string | undefined ??
        (d as Record<string, unknown>)?.token as string | undefined
      if (!token) throw new Error('Токен не получен')
      localStorage.setItem('nets_token', token)
      toast('Добро пожаловать, ' + email)
      onLogin(token)
    } catch (e: unknown) {
      toast((e as Error).message ?? 'Ошибка авторизации', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sys-login-wrap">
      <form className="sys-login-box sys-card" onSubmit={submit} autoComplete="off">
        <div className="sys-login-logo">
          <span style={{
            fontFamily: "'Share Tech Mono','Courier New',monospace",
            fontSize: '20px', fontWeight: 700, letterSpacing: '3px',
            color: 'var(--ac)', textTransform: 'uppercase', userSelect: 'none',
          }}>
            <span style={{ color: 'var(--t3)', marginRight: 2 }}>_</span>NETS
          </span>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)', letterSpacing: 2, marginTop: 4 }}>
            ADMIN // ACCESS REQUIRED
          </div>
        </div>

        <div className="sys-fg" style={{ marginTop: 28 }}>
          <label className="sys-fl">EMAIL</label>
          <input
            className="sys-fi"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <div className="sys-fg">
          <label className="sys-fl">ПАРОЛЬ</label>
          <input
            className="sys-fi"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="sys-btn btn-exec"
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '11px 0', marginTop: 8 }}
        >
          {loading ? 'ПОДКЛЮЧЕНИЕ...' : 'ВОЙТИ // ENTER'}
        </button>
      </form>
    </div>
  )
}
