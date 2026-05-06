import React from 'react'

// ── Lain (sys-*) shared sub-components ─────────────────────────────

export function SChip({ s }: { s?: string }) {
  const l = (s ?? '').toLowerCase()
  const c =
    l === 'active'   ? 'chip-on'  :
    l === 'inactive' ? 'chip-off' :
    l === 'archived' ? 'chip-arc' : 'chip-unk'
  return <span className={`sys-chip ${c}`}>{s ?? '—'}</span>
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="sys-empty">
      <div className="sys-empty-title">{title}</div>
      {sub && <div className="sys-empty-sub">{sub}</div>}
    </div>
  )
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="sys-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sys-modal sys-card">
        <div className="sys-modal-bar" />
        <div className="sys-modal-body">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDel({ text, onOk, onNo }: { text: string; onOk: () => void; onNo: () => void }) {
  return (
    <div className="sys-overlay" onClick={e => e.target === e.currentTarget && onNo()}>
      <div className="sys-modal sys-card" style={{ maxWidth: 340 }}>
        <div className="sys-modal-bar" />
        <div className="sys-modal-body">
          <div className="sys-del-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rd)" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </div>
          <div className="sys-modal-title">Удалить запись?</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 6 }}>{text}</div>
          <div className="sys-modal-acts">
            <button className="sys-btn btn-ghost" onClick={onNo}>Отмена</button>
            <button className="sys-btn btn-kill" style={{ fontWeight: 700 }} onClick={onOk}>Удалить</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Normal shared sub-components ────────────────────────────────────

export function NSChip({ s }: { s?: string }) {
  const l = (s ?? '').toLowerCase()
  const c =
    l === 'active'   ? 'c-active'   :
    l === 'inactive' ? 'c-inactive' :
    l === 'archived' ? 'c-archived' : 'c-other'
  return <span className={`chip ${c}`}>{s ?? '—'}</span>
}

export function NEmpty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  )
}

export function NModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal card">
        <div className="modal-stripe" />
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function NConfirmDel({ text, onOk, onNo }: { text: string; onOk: () => void; onNo: () => void }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onNo()}>
      <div className="modal card" style={{ maxWidth: 340 }}>
        <div className="modal-stripe" />
        <div className="modal-body">
          <div className="del-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rd)" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </div>
          <div className="modal-title">Удалить запись?</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 6 }}>{text}</div>
          <div className="modal-acts">
            <button className="btn btn-g" onClick={onNo}>Отмена</button>
            <button className="btn btn-d" style={{ fontWeight: 700 }} onClick={onOk}>Удалить</button>
          </div>
        </div>
      </div>
    </div>
  )
}
