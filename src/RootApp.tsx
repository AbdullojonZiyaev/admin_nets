import { useState, useEffect, useCallback, useRef } from 'react'
import { Toasts } from './components/Toasts'
import { LoginPage } from './pages/LoginPage'
import { LainApp } from './layouts/LainApp'
import { NormalApp } from './layouts/NormalApp'

const TOKEN_KEY = 'nets_token'
const BASE      = ''

type Mode = 'lain' | 'normal'

declare global {
  interface Window {
    __toggleTheme?: () => void
  }
}

export function RootApp() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [mode,  setMode]  = useState<Mode>(() =>
    document.documentElement.classList.contains('theme-light') ? 'normal' : 'lain'
  )
  const [base, setBase] = useState(BASE)
  const godTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── theme toggle ────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    const root    = document.documentElement
    const overlay = document.getElementById('theme-transition-overlay')
    const ind     = document.getElementById('theme-indicator')
    const isLight = root.classList.contains('theme-light')

    if (overlay) { overlay.classList.remove('active'); void overlay.offsetWidth; overlay.classList.add('active') }

    setTimeout(() => {
      if (isLight) {
        root.classList.remove('theme-light')
        root.setAttribute('data-theme', 'dark')
        setMode('lain')
        if (ind) { ind.textContent = '// LAIN MODE'; ind.style.display = 'block'; setTimeout(() => { ind.style.display = 'none' }, 1500) }
      } else {
        root.classList.add('theme-light')
        root.setAttribute('data-theme', 'light')
        setMode('normal')
        if (ind) { ind.textContent = '// NORMAL MODE'; ind.style.display = 'block'; setTimeout(() => { ind.style.display = 'none' }, 1500) }
      }
      setTimeout(() => { if (overlay) overlay.classList.remove('active') }, 400)
    }, 50)
  }, [])

  useEffect(() => {
    window.__toggleTheme = toggleTheme
    return () => { delete window.__toggleTheme }
  }, [toggleTheme])

  // ── keyboard shortcut ────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'T') { e.preventDefault(); toggleTheme() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleTheme])

  // ── god overlay (Lain only, 3 min idle) ─────────────────────────
  useEffect(() => {
    if (mode !== 'lain') return
    const overlay = document.getElementById('god-overlay')
    if (!overlay) return

    function resetTimer() {
      if (overlay!.classList.contains('visible')) {
        overlay!.classList.remove('visible'); overlay!.classList.add('leaving')
        setTimeout(() => overlay!.classList.remove('leaving'), 800)
      }
      if (godTimerRef.current) clearTimeout(godTimerRef.current)
      godTimerRef.current = setTimeout(() => {
        overlay!.classList.add('entering')
        setTimeout(() => { overlay!.classList.remove('entering'); overlay!.classList.add('visible') }, 600)
      }, 3 * 60 * 1000)
    }

    resetTimer()
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }))

    overlay.addEventListener('click', resetTimer)
    return () => {
      if (godTimerRef.current) clearTimeout(godTimerRef.current)
      events.forEach(ev => window.removeEventListener(ev, resetTimer))
    }
  }, [mode])

  // ── auth ─────────────────────────────────────────────────────────
  function handleLogin(t: string) {
    localStorage.setItem(TOKEN_KEY, t)
    setToken(t)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  if (!token) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toasts />
      </>
    )
  }

  return (
    <>
      {mode === 'lain'
        ? <LainApp  base={base} setBase={setBase} onLogout={handleLogout} />
        : <NormalApp base={base} setBase={setBase} onLogout={handleLogout} />
      }
      <Toasts />
    </>
  )
}
