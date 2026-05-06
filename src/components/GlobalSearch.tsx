import React, { useState, useEffect, useRef } from 'react'
import type { SearchCache } from '../types'
import { ISearch, IBill, IUser, ILink } from './icons'

interface Props {
  cache: SearchCache
}

function highlight(text: string, query: string): React.ReactNode {
  const s = String(text ?? '')
  if (!query) return s
  const i = s.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return s
  return (
    <>
      {s.slice(0, i)}
      <span className="gs-hl">{s.slice(i, i + query.length)}</span>
      {s.slice(i + query.length)}
    </>
  )
}

export function GlobalSearch({ cache }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQ('')
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const q2 = q.trim().toLowerCase()

  const res = {
    billing: (q2
      ? (cache.billing ?? []).filter(u =>
          (u.name ?? '').toLowerCase().includes(q2) ||
          String(u.billingId ?? '').includes(q2) ||
          String(u.id ?? '').includes(q2)
        )
      : []
    ).slice(0, 5),

    bitrix: (q2
      ? (cache.bitrix ?? []).filter(u =>
          (u.name ?? '').toLowerCase().includes(q2) ||
          String(u.bitrixId ?? '').includes(q2) ||
          String(u.id ?? '').includes(q2)
        )
      : []
    ).slice(0, 5),

    links: (q2
      ? (cache.links ?? []).filter(l =>
          (l.billingUserName ?? '').toLowerCase().includes(q2) ||
          (l.bitrixUserName ?? '').toLowerCase().includes(q2) ||
          String(l.billingId ?? '').includes(q2) ||
          String(l.bitrixId ?? '').includes(q2)
        )
      : []
    ).slice(0, 4),
  }

  const total = res.billing.length + res.bitrix.length + res.links.length

  return (
    <div className="sys-gs" ref={ref}>
      <span className="sys-gs-ico"><ISearch /></span>
      <input
        className="sys-gs-inp"
        placeholder="Поиск по всем данным..."
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {!q && <span className="sys-gs-kbd">⌘K</span>}

      {open && q2 && (
        <div className="sys-gs-dd">
          {total === 0 && (
            <div className="gs-empty">Ничего не найдено по «{q}»</div>
          )}

          {res.billing.length > 0 && (
            <div className="gs-sec">
              <div className="gs-hd">Биллинг</div>
              {res.billing.map((u, i) => (
                <div key={i} className="gs-row" onClick={() => { setOpen(false); setQ('') }}>
                  <div className="gs-ico-box"><IBill /></div>
                  <div>
                    <div className="gs-nm">{highlight(u.name ?? '', q)}</div>
                    <div className="gs-sb">billing id: {u.billingId ?? '—'} · #{u.id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {res.bitrix.length > 0 && (
            <div className="gs-sec">
              <div className="gs-hd">Битрикс</div>
              {res.bitrix.map((u, i) => (
                <div key={i} className="gs-row" onClick={() => { setOpen(false); setQ('') }}>
                  <div className="gs-ico-box"><IUser /></div>
                  <div>
                    <div className="gs-nm">{highlight(u.name ?? '', q)}</div>
                    <div className="gs-sb">bitrix id: {u.bitrixId ?? '—'} · #{u.id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {res.links.length > 0 && (
            <div className="gs-sec">
              <div className="gs-hd">Связи</div>
              {res.links.map((l, i) => (
                <div key={i} className="gs-row" onClick={() => { setOpen(false); setQ('') }}>
                  <div className="gs-ico-box"><ILink /></div>
                  <div>
                    <div className="gs-nm">
                      {highlight(`${l.billingUserName ?? '—'} → ${l.bitrixUserName ?? '—'}`, q)}
                    </div>
                    <div className="gs-sb">billing: {l.billingId} · bitrix: {l.bitrixId}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
