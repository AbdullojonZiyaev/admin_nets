import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callApi } from '../lib/api'
import type { PageId, NavCounts, BillingUser, BitrixUser, ApiCall } from '../types'
import { IDash, IBill, IUser, ILink, ITask, ISwitch, ICity, IVendor, ISearch, ILogout } from '../components/icons'
import { NDashPage } from '../pages/DashPage'
import { NBillingPage } from '../pages/BillingPage'
import { NBitrixPage } from '../pages/BitrixPage'
import { NLinksPage } from '../pages/LinksPage'
import { NTasksPage } from '../pages/TasksPage'
import { NSwitchPage } from '../pages/SwitchPage'
import { NCityPage } from '../pages/CityPage'
import { NVendorPage } from '../pages/VendorPage'

interface Props {
  base: string
  setBase: (v: string) => void
  onLogout: () => void
}

interface NavItem {
  id: PageId
  label: string
  icon: React.ReactNode
  cnt?: keyof NavCounts
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд',   icon: <IDash /> },
  { id: 'billing',   label: 'Биллинг',   icon: <IBill />,   cnt: 'billing' },
  { id: 'bitrix',    label: 'Битрикс',   icon: <IUser />,   cnt: 'bitrix' },
  { id: 'links',     label: 'Связи',     icon: <ILink />,   cnt: 'links' },
  { id: 'tasks',     label: 'Задачи',    icon: <ITask /> },
  { id: 'switch',    label: 'Свитчи',    icon: <ISwitch />, cnt: 'sw' },
  { id: 'city',      label: 'Города',    icon: <ICity />,   cnt: 'city' },
  { id: 'vendor',    label: 'Вендоры',   icon: <IVendor />, cnt: 'vendor' },
]

const emptyCnts: NavCounts = { billing: 0, bitrix: 0, links: 0, sw: 0, city: 0, vendor: 0 }

function NGlobalSearch({ api }: { api: ApiCall }) {
  const [q, setQ]       = useState('')
  const [open, setOpen] = useState(false)
  const [res, setRes]   = useState<{ section: string; id: number | string; label: string; sub?: string }[]>([])
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  useEffect(() => {
    if (!q.trim()) { setRes([]); setOpen(false); return }
    const t = setTimeout(async () => {
      try {
        const [bl, bx] = await Promise.all([
          api('/api/billinguser').catch(() => ({ data: [] })),
          api('/api/bitrixuser').catch(() => ({ data: [] })),
        ])
        const lq = q.toLowerCase()
        const hits: typeof res = []
        if (Array.isArray(bl.data)) {
          for (const u of bl.data as BillingUser[]) {
            if ((u.name ?? '').toLowerCase().includes(lq) || String(u.billingId ?? '').includes(lq)) {
              hits.push({ section: 'Биллинг', id: u.id, label: u.name ?? `#${u.id}`, sub: `billing id: ${u.billingId ?? '—'}` })
            }
          }
        }
        if (Array.isArray(bx.data)) {
          for (const u of bx.data as BitrixUser[]) {
            if ((u.name ?? '').toLowerCase().includes(lq) || String(u.bitrixId ?? '').includes(lq)) {
              hits.push({ section: 'Битрикс', id: u.id, label: u.name ?? `#${u.id}`, sub: `bitrix id: ${u.bitrixId ?? '—'}` })
            }
          }
        }
        setRes(hits.slice(0, 12)); setOpen(hits.length > 0)
      } catch { /* silent */ }
    }, 220)
    return () => clearTimeout(t)
  }, [q, api])

  return (
    <div className="gs" ref={ref}>
      <span className="gs-ico"><ISearch /></span>
      <input
        className="gs-inp"
        placeholder="Глобальный поиск..."
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => res.length > 0 && setOpen(true)}
      />
      <span className="gs-kbd">⌘K</span>
      {open && (
        <div className="gs-dd">
          {Array.from(new Set(res.map(r => r.section))).map(sec => (
            <div className="gd-sec" key={sec}>
              <div className="gd-hd">{sec}</div>
              {res.filter(r => r.section === sec).map(r => (
                <div className="gd-row" key={`${r.section}-${r.id}`} onClick={() => setOpen(false)}>
                  <div className="gd-info">
                    <div className="gd-nm">{r.label}</div>
                    {r.sub && <div className="gd-sub">{r.sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function NormalApp({ base, setBase, onLogout }: Props) {
  const [page,      setPage]      = useState<PageId>('dashboard')
  const [cnts,      setCnts]      = useState<NavCounts>({ ...emptyCnts })
  const [quickBx,   setQuickBx]   = useState<{ bitrixId?: string; name?: string } | null>(null)
  const [quickLink, setQuickLink] = useState<{ bitrixUserId?: number | null } | null>(null)

  const api: ApiCall = useCallback(
    (path, opts) => callApi(base, path, opts),
    [base]
  )

  const onDashSetCnts = useCallback((partial: Partial<NavCounts>) => setCnts(c => ({ ...c, ...partial })), [])
  const onBillingCnt  = useCallback((n: number) => setCnts(c => ({ ...c, billing: n })), [])
  const onBitrixCnt   = useCallback((n: number) => setCnts(c => ({ ...c, bitrix: n })), [])
  const onLinksCnt    = useCallback((n: number) => setCnts(c => ({ ...c, links: n })), [])
  const onSwitchCnt   = useCallback((n: number) => setCnts(c => ({ ...c, sw: n })), [])
  const onCityCnt     = useCallback((n: number) => setCnts(c => ({ ...c, city: n })), [])
  const onVendorCnt   = useCallback((n: number) => setCnts(c => ({ ...c, vendor: n })), [])
  const onInitBxDone  = useCallback(() => setQuickBx(null), [])
  const onInitLkDone  = useCallback(() => setQuickLink(null), [])

  function navigate(p: PageId) { setPage(p) }

  function handleAddBitrix(d: { bitrixId: string; name: string }) {
    setQuickBx(d)
    navigate('bitrix')
  }
  function handleLinkBilling(d: { bitrixUserId: number }) {
    setQuickLink(d)
    navigate('links')
  }

  const pageLabel = NAV.find(n => n.id === page)?.label ?? ''

  return (
    <div className="normal-app">
      <div className="app-shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-text">NETS</span>
            <span className="logo-tag">v2</span>
          </div>
          <nav className="s-nav">
            {NAV.map(n => (
              <button
                key={n.id}
                className={`s-item${page === n.id ? ' active' : ''}`}
                onClick={() => navigate(n.id)}
              >
                <span className="s-ico">{n.icon}</span>
                <span>{n.label}</span>
                {n.cnt !== undefined && cnts[n.cnt] > 0 && (
                  <span className="s-cnt">{cnts[n.cnt]}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-foot">
            <button
              className="theme-toggle-btn"
              onClick={() => (window as Window & typeof globalThis & { __toggleTheme?: () => void }).__toggleTheme?.()}
              title="Переключить тему (Ctrl+Shift+Alt+T)"
            >
              ◑ Тема Lain
            </button>
            <button className="n-logout-btn" onClick={onLogout}>
              <ILogout />
              <span>Выйти</span>
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          {/* Topbar */}
          <header className="topbar">
            <div className="tb-title">{pageLabel}</div>
            <NGlobalSearch api={api} />
            <div className="tb-right">
              <span className="tb-avatar">AP</span>
            </div>
          </header>

          {/* Content */}
          <div className="content">
            <div className="pg">
              {page === 'dashboard' && (
                <NDashPage
                  api={api}
                  setCnts={onDashSetCnts}
                  base={base}
                  setBase={setBase}
                />
              )}
              {page === 'billing' && (
                <NBillingPage
                  api={api}
                  onCnt={onBillingCnt}
                />
              )}
              {page === 'bitrix' && (
                <NBitrixPage
                  api={api}
                  onCnt={onBitrixCnt}
                  initModal={quickBx}
                  onInitDone={onInitBxDone}
                />
              )}
              {page === 'links' && (
                <NLinksPage
                  api={api}
                  onCnt={onLinksCnt}
                  initLink={quickLink}
                  onInitDone={onInitLkDone}
                />
              )}
              {page === 'tasks' && (
                <NTasksPage
                  api={api}
                  onAddBitrix={handleAddBitrix}
                  onLinkBilling={handleLinkBilling}
                />
              )}
              {page === 'switch' && (
                <NSwitchPage
                  api={api}
                  onCnt={onSwitchCnt}
                />
              )}
              {page === 'city' && (
                <NCityPage
                  api={api}
                  onCnt={onCityCnt}
                />
              )}
              {page === 'vendor' && (
                <NVendorPage
                  api={api}
                  onCnt={onVendorCnt}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
