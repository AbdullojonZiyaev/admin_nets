import React, { useState, useEffect, useCallback } from 'react'
import { callApi } from '../lib/api'
import { triggerGlitch } from '../lib/glitch'
import { toast } from '../lib/toast'
import type { PageId, NavCounts, SearchCache, BillingUser, BitrixUser, UserLink, Switch, City, Vendor, ApiCall } from '../types'
import { NetsLogo } from '../components/NetsLogo'
import { GlobalSearch } from '../components/GlobalSearch'
import { IDash, IBill, IUser, ILink, ITask, ISwitch, ICity, IVendor, ILogout } from '../components/icons'
import { DashPage } from '../pages/DashPage'
import { BillingPage } from '../pages/BillingPage'
import { BitrixPage } from '../pages/BitrixPage'
import { LinksPage } from '../pages/LinksPage'
import { TasksPage } from '../pages/TasksPage'
import { SwitchPage } from '../pages/SwitchPage'
import { CityPage } from '../pages/CityPage'
import { VendorPage } from '../pages/VendorPage'

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

const emptyCache: SearchCache = { billing: [], bitrix: [], links: [], sw: [], city: [], vendor: [] }
const emptyCnts: NavCounts = { billing: 0, bitrix: 0, links: 0, sw: 0, city: 0, vendor: 0 }

export function LainApp({ base, setBase, onLogout }: Props) {
  const [page,      setPage]      = useState<PageId>('dashboard')
  const [cnts,      setCnts]      = useState<NavCounts>({ ...emptyCnts })
  const [cache,     setCache]     = useState<SearchCache>({ ...emptyCache })
  const [quickBx,   setQuickBx]   = useState<{ bitrixId?: string; name?: string } | null>(null)
  const [quickLink, setQuickLink] = useState<{ bitrixUserId?: number | null } | null>(null)

  const api: ApiCall = useCallback(
    (path, opts) => callApi(base, path, opts),
    [base]
  )

  const refreshCache = useCallback(async () => {
    try {
      const [bl, bx, lk, sw, ci, ve] = await Promise.all([
        api('/api/billinguser').catch(() => ({ data: [] })),
        api('/api/bitrixuser').catch(() => ({ data: [] })),
        api('/api/userlink').catch(() => ({ data: [] })),
        api('/api/switch').catch(() => ({ data: [] })),
        api('/api/city').catch(() => ({ data: [] })),
        api('/api/vendor').catch(() => ({ data: [] })),
      ])
      setCache({
        billing: Array.isArray(bl.data) ? (bl.data as BillingUser[]) : [],
        bitrix:  Array.isArray(bx.data) ? (bx.data as BitrixUser[]) : [],
        links:   Array.isArray(lk.data) ? (lk.data as UserLink[]) : [],
        sw:      Array.isArray(sw.data) ? (sw.data as Switch[]) : [],
        city:    Array.isArray(ci.data) ? (ci.data as City[]) : [],
        vendor:  Array.isArray(ve.data) ? (ve.data as Vendor[]) : [],
      })
      setCnts(c => ({
        billing: Array.isArray(bl.data) ? bl.data.length : c.billing,
        bitrix:  Array.isArray(bx.data) ? bx.data.length : c.bitrix,
        links:   Array.isArray(lk.data) ? lk.data.length : c.links,
        sw:      Array.isArray(sw.data) ? sw.data.length : c.sw,
        city:    Array.isArray(ci.data) ? ci.data.length : c.city,
        vendor:  Array.isArray(ve.data) ? ve.data.length : c.vendor,
      }))
    } catch (e) { toast((e as Error).message, 'err') }
  }, [api])

  useEffect(() => { refreshCache() }, [refreshCache])

  function navigate(p: PageId) {
    if (p === page) return
    triggerGlitch(() => setPage(p))
  }

  function handleAddBitrix(d: { bitrixId: string; name: string }) {
    setQuickBx(d)
    navigate('bitrix')
  }
  function handleLinkBilling(d: { bitrixUserId: number }) {
    setQuickLink(d)
    navigate('links')
  }

  const onDashSetCnts = useCallback((partial: Partial<NavCounts>) => setCnts(c => ({ ...c, ...partial })), [])
  const onBillingCnt  = useCallback((n: number) => setCnts(c => ({ ...c, billing: n })), [])
  const onBitrixCnt   = useCallback((n: number) => setCnts(c => ({ ...c, bitrix: n })), [])
  const onLinksCnt    = useCallback((n: number) => setCnts(c => ({ ...c, links: n })), [])
  const onSwitchCnt   = useCallback((n: number) => setCnts(c => ({ ...c, sw: n })), [])
  const onCityCnt     = useCallback((n: number) => setCnts(c => ({ ...c, city: n })), [])
  const onVendorCnt   = useCallback((n: number) => setCnts(c => ({ ...c, vendor: n })), [])
  const onInitBxDone  = useCallback(() => setQuickBx(null), [])
  const onInitLkDone  = useCallback(() => setQuickLink(null), [])

  const pageLabel = NAV.find(n => n.id === page)?.label ?? ''

  return (
    <div className="sys-app">
      {/* ── Sidebar ── */}
      <aside className="sys-sidebar">
        <NetsLogo />
        <nav className="sys-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`sys-node${page === n.id ? ' active' : ''}`}
              onClick={() => navigate(n.id)}
            >
              <span className="sys-node-ico">{n.icon}</span>
              <span>{n.label}</span>
              {n.cnt !== undefined && cnts[n.cnt] > 0 && (
                <span className="sys-badge">{cnts[n.cnt]}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sys-sidebar-foot">
          <div className="sys-kb-hint">Ctrl+Shift+Alt+T — тема</div>
          <button className="sys-logout-btn" onClick={onLogout}>
            <ILogout />
            <span>ВЫХОД</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="sys-main">
        {/* Topbar */}
        <header className="sys-topbar">
          <div className="sys-tb-title">{pageLabel}</div>
          <GlobalSearch cache={cache} />
          <div className="sys-tb-right">
            <span className="sys-live-dot" />
            <span className="sys-avatar">AP</span>
          </div>
        </header>

        {/* Content */}
        <div className="sys-content">
          <div className="sys-pg">
            {page === 'dashboard' && (
              <DashPage
                api={api}
                setCnts={onDashSetCnts}
                base={base}
                setBase={setBase}
                onNavigate={navigate}
              />
            )}
            {page === 'billing' && (
              <BillingPage
                api={api}
                onCnt={onBillingCnt}
              />
            )}
            {page === 'bitrix' && (
              <BitrixPage
                api={api}
                onCnt={onBitrixCnt}
                initModal={quickBx}
                onInitDone={onInitBxDone}
              />
            )}
            {page === 'links' && (
              <LinksPage
                api={api}
                onCnt={onLinksCnt}
                initLink={quickLink}
                onInitDone={onInitLkDone}
              />
            )}
            {page === 'tasks' && (
              <TasksPage
                api={api}
                onAddBitrix={handleAddBitrix}
                onLinkBilling={handleLinkBilling}
              />
            )}
            {page === 'switch' && (
              <SwitchPage
                api={api}
                onCnt={onSwitchCnt}
                cache={cache}
              />
            )}
            {page === 'city' && (
              <CityPage
                api={api}
                onCnt={onCityCnt}
              />
            )}
            {page === 'vendor' && (
              <VendorPage
                api={api}
                onCnt={onVendorCnt}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
