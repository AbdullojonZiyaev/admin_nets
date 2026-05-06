import { useState, useEffect, useCallback } from 'react'
import type { ApiCall, BillingUser, BitrixUser, UserLink } from '../types'
import { toast } from '../lib/toast'
import { ISearch, IPlus, IEdit, ITrash } from '../components/icons'
import { SmartSelect } from '../components/SmartSelect'
import { StatusPicker } from '../components/StatusPicker'
import { NSmartSelect } from '../components/NSmartSelect'
import { NStatusPicker } from '../components/NStatusPicker'
import { SChip, Modal, ConfirmDel, NSChip, NModal, NConfirmDel } from './shared'

type Status = 'Active' | 'Inactive' | 'Archived'

interface Props {
  api: ApiCall
  onCnt: (n: number) => void
  initLink?: { bitrixUserId?: number | null } | null
  onInitDone?: () => void
}

function fmtDate(s?: string): string {
  if (!s) return '—'
  try { return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return s }
}

// ── Lain LinksPage ───────────────────────────────────────────────────

export function LinksPage({ api, onCnt, initLink, onInitDone }: Props) {
  const [data, setData]     = useState<UserLink[]>([])
  const [load, setLoad]     = useState(true)
  const [srch, setSrch]     = useState('')
  const [modal, setModal]   = useState(false)
  const [editM, setEditM]   = useState<{ id: number } | null>(null)
  const [conf, setConf]     = useState<{ id: number; lbl: string } | null>(null)
  const [bU, setBU]         = useState<BillingUser[]>([])
  const [bxU, setBxU]       = useState<BitrixUser[]>([])
  const [form, setForm]     = useState<{ billingUserId: number | null; bitrixUserId: number | null; status: Status }>({ billingUserId: null, bitrixUserId: null, status: 'Active' })
  const [editSt, setEditSt] = useState<Status>('Active')

  const reload = useCallback(() => {
    setLoad(true)
    api('/api/userlink')
      .then(r => { const a = Array.isArray(r.data) ? (r.data as UserLink[]) : []; setData(a); onCnt(a.length) })
      .catch(e => toast((e as Error).message, 'err'))
      .finally(() => setLoad(false))
  }, [api, onCnt])
  useEffect(() => { reload() }, [reload])

  async function openCreate(prefill?: { billingUserId?: number | null; bitrixUserId?: number | null }) {
    setForm({ billingUserId: prefill?.billingUserId ?? null, bitrixUserId: prefill?.bitrixUserId ?? null, status: 'Active' })
    setModal(true)
    try {
      const [bl, bx] = await Promise.all([api('/api/billinguser').catch(() => ({ data: [] })), api('/api/bitrixuser').catch(() => ({ data: [] }))])
      setBU(Array.isArray(bl.data) ? (bl.data as BillingUser[]) : [])
      setBxU(Array.isArray(bx.data) ? (bx.data as BitrixUser[]) : [])
    } catch (e) { toast((e as Error).message, 'err') }
  }
  useEffect(() => { if (initLink) { openCreate({ bitrixUserId: initLink.bitrixUserId ?? null }); onInitDone?.() } }, [initLink])

  async function create() {
    if (!form.billingUserId || !form.bitrixUserId) { toast('Выберите обоих пользователей', 'err'); return }
    try {
      const r = await api('/api/userlink', { method: 'POST', body: JSON.stringify({ billingUserId: form.billingUserId, bitrixUserId: form.bitrixUserId, status: form.status }) })
      toast((r.msg) ?? 'Связь создана'); setModal(false); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function updSt() {
    if (!editM) return
    try {
      const r = await api(`/api/userlink/${editM.id}`, { method: 'PUT', body: JSON.stringify(editSt) })
      toast((r.msg) ?? 'Статус обновлён'); setEditM(null); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function del(id: number) {
    try { const r = await api(`/api/userlink/${id}`, { method: 'DELETE' }); toast((r.msg) ?? 'Удалено'); reload() } catch (e) { toast((e as Error).message, 'err') }
    setConf(null)
  }

  const fd = data.filter(l =>
    (l.billingUserName ?? '').toLowerCase().includes(srch.toLowerCase()) ||
    (l.bitrixUserName ?? '').toLowerCase().includes(srch.toLowerCase()) ||
    String(l.billingId ?? '').includes(srch) || String(l.bitrixId ?? '').includes(srch) || String(l.id ?? '').includes(srch)
  )
  const bOpts  = bU.map(u => ({ value: u.id, label: u.name ?? `#${u.id}`, sub: u.billingId ?? u.id }))
  const bxOpts = bxU.map(u => ({ value: u.id, label: u.name ?? `#${u.id}`, sub: u.bitrixId ?? u.id }))

  return (
    <>
      <div className="sys-head">
        <div><div className="sys-title">Связи пользователей</div><div className="sys-subtitle">POST · GET · PUT · DELETE /api/userlink</div></div>
        <div className="sys-acts">
          <div className="sys-srch-wrap"><span className="sys-srch-ico"><ISearch /></span><input className="sys-srch-inp" placeholder="Поиск по имени, ID..." value={srch} onChange={e => setSrch(e.target.value)} /></div>
          <button className="sys-btn btn-exec" onClick={() => openCreate()}><IPlus />Создать связь</button>
        </div>
      </div>
      <div className="sys-tbl-wrap sys-card"><div className="sys-tbl-scroll"><table>
        <thead><tr><th>ID</th><th>Пользователь Биллинга</th><th>Пользователь Битрикс</th><th>Статус</th><th>Создана</th><th>Действия</th></tr></thead>
        <tbody>
          {load && <tr><td colSpan={6}><div className="sys-empty"><div className="sys-empty-title">Загрузка...</div></div></td></tr>}
          {!load && fd.length === 0 && <tr><td colSpan={6}><div className="sys-empty"><div className="sys-empty-title">Нет связей</div><div className="sys-empty-sub">Создайте первую связь пользователей</div></div></td></tr>}
          {!load && fd.map(l => (
            <tr key={l.id}>
              <td className="sys-mono" style={{ color: 'var(--t3)' }}>#{l.id}</td>
              <td><div className="sys-un">{l.billingUserName ?? '—'}</div><div className="sys-us">billing id: {l.billingId ?? '—'}</div></td>
              <td><div className="sys-un">{l.bitrixUserName ?? '—'}</div><div className="sys-us">bitrix id: {l.bitrixId ?? '—'}</div></td>
              <td><SChip s={l.status} /></td>
              <td><span className="sys-dt">{fmtDate(l.createdAt as string | undefined)}</span></td>
              <td><div style={{ display: 'flex', gap: 5 }}>
                <button className="sys-btn btn-ghost btn-sq btn-xs" onClick={() => { setEditM({ id: l.id }); setEditSt((l.status as Status) || 'Active') }}><IEdit /></button>
                <button className="sys-btn btn-kill btn-sq btn-xs" onClick={() => setConf({ id: l.id, lbl: `#${l.id}` })}><ITrash /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {modal && <Modal onClose={() => setModal(false)}>
        <div className="sys-modal-title">Создать связь</div>
        <div className="sys-modal-sub">POST /api/userlink</div>
        <div className="sys-fg"><label className="sys-fl">Пользователь Биллинга</label><SmartSelect options={bOpts} value={form.billingUserId} onChange={v => setForm(f => ({ ...f, billingUserId: v as number }))} placeholder="Выберите..." /></div>
        <div className="sys-fg"><label className="sys-fl">Пользователь Битрикс</label><SmartSelect options={bxOpts} value={form.bitrixUserId} onChange={v => setForm(f => ({ ...f, bitrixUserId: v as number }))} placeholder="Выберите..." /></div>
        <div className="sys-fg"><label className="sys-fl">Статус</label><StatusPicker value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} /></div>
        <div className="sys-modal-acts"><button className="sys-btn btn-ghost" onClick={() => setModal(false)}>Отмена</button><button className="sys-btn btn-exec" onClick={create}>Создать</button></div>
      </Modal>}

      {editM && <Modal onClose={() => setEditM(null)}>
        <div className="sys-modal-title">Изменить статус</div>
        <div className="sys-modal-sub">PUT /api/userlink/{editM.id}</div>
        <div className="sys-fg"><label className="sys-fl">Статус</label><StatusPicker value={editSt} onChange={setEditSt} /></div>
        <div className="sys-modal-acts"><button className="sys-btn btn-ghost" onClick={() => setEditM(null)}>Отмена</button><button className="sys-btn btn-exec" onClick={updSt}>Сохранить</button></div>
      </Modal>}

      {conf && <ConfirmDel text={`Удалить связь ${conf.lbl}?`} onOk={() => del(conf.id)} onNo={() => setConf(null)} />}
    </>
  )
}

// ── Normal NLinksPage ────────────────────────────────────────────────

export function NLinksPage({ api, onCnt, initLink, onInitDone }: Props) {
  const [data, setData]     = useState<UserLink[]>([])
  const [load, setLoad]     = useState(true)
  const [srch, setSrch]     = useState('')
  const [modal, setModal]   = useState(false)
  const [editM, setEditM]   = useState<{ id: number } | null>(null)
  const [conf, setConf]     = useState<{ id: number; lbl: string } | null>(null)
  const [bU, setBU]         = useState<BillingUser[]>([])
  const [bxU, setBxU]       = useState<BitrixUser[]>([])
  const [form, setForm]     = useState<{ billingUserId: number | null; bitrixUserId: number | null; status: Status }>({ billingUserId: null, bitrixUserId: null, status: 'Active' })
  const [editSt, setEditSt] = useState<Status>('Active')

  const reload = useCallback(() => {
    setLoad(true)
    api('/api/userlink')
      .then(r => { const a = Array.isArray(r.data) ? (r.data as UserLink[]) : []; setData(a); onCnt(a.length) })
      .catch(e => toast((e as Error).message, 'err'))
      .finally(() => setLoad(false))
  }, [api, onCnt])
  useEffect(() => { reload() }, [reload])

  async function openCreate(prefill?: { billingUserId?: number | null; bitrixUserId?: number | null }) {
    setForm({ billingUserId: prefill?.billingUserId ?? null, bitrixUserId: prefill?.bitrixUserId ?? null, status: 'Active' })
    setModal(true)
    try {
      const [bl, bx] = await Promise.all([api('/api/billinguser').catch(() => ({ data: [] })), api('/api/bitrixuser').catch(() => ({ data: [] }))])
      setBU(Array.isArray(bl.data) ? (bl.data as BillingUser[]) : [])
      setBxU(Array.isArray(bx.data) ? (bx.data as BitrixUser[]) : [])
    } catch (e) { toast((e as Error).message, 'err') }
  }
  useEffect(() => { if (initLink) { openCreate({ bitrixUserId: initLink.bitrixUserId ?? null }); onInitDone?.() } }, [initLink])

  async function create() {
    if (!form.billingUserId || !form.bitrixUserId) { toast('Выберите обоих пользователей', 'err'); return }
    try {
      const r = await api('/api/userlink', { method: 'POST', body: JSON.stringify({ billingUserId: form.billingUserId, bitrixUserId: form.bitrixUserId, status: form.status }) })
      toast((r.msg) ?? 'Связь создана'); setModal(false); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function updSt() {
    if (!editM) return
    try {
      const r = await api(`/api/userlink/${editM.id}`, { method: 'PUT', body: JSON.stringify(editSt) })
      toast((r.msg) ?? 'Статус обновлён'); setEditM(null); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function del(id: number) {
    try { const r = await api(`/api/userlink/${id}`, { method: 'DELETE' }); toast((r.msg) ?? 'Удалено'); reload() } catch (e) { toast((e as Error).message, 'err') }
    setConf(null)
  }

  const fd = data.filter(l =>
    (l.billingUserName ?? '').toLowerCase().includes(srch.toLowerCase()) ||
    (l.bitrixUserName ?? '').toLowerCase().includes(srch.toLowerCase()) ||
    String(l.billingId ?? '').includes(srch) || String(l.bitrixId ?? '').includes(srch) || String(l.id ?? '').includes(srch)
  )
  const bOpts  = bU.map(u => ({ value: u.id, label: u.name ?? `#${u.id}`, sub: u.billingId ?? u.id }))
  const bxOpts = bxU.map(u => ({ value: u.id, label: u.name ?? `#${u.id}`, sub: u.bitrixId ?? u.id }))

  return (
    <>
      <div className="sec-head">
        <div><div className="sec-title">Связи пользователей</div><div className="sec-sub">POST · GET · PUT · DELETE /api/userlink</div></div>
        <div className="sec-acts">
          <div className="sw"><span className="si"><ISearch /></span><input className="sinp" placeholder="Поиск по имени, ID..." value={srch} onChange={e => setSrch(e.target.value)} /></div>
          <button className="btn btn-p" onClick={() => openCreate()}><IPlus />Создать связь</button>
        </div>
      </div>
      <div className="tw card"><div className="ts"><table>
        <thead><tr><th>ID</th><th>Пользователь Биллинга</th><th>Пользователь Битрикс</th><th>Статус</th><th>Создана</th><th>Действия</th></tr></thead>
        <tbody>
          {load && <tr><td colSpan={6}><div className="empty"><div className="empty-title">Загрузка...</div></div></td></tr>}
          {!load && fd.length === 0 && <tr><td colSpan={6}><div className="empty"><div className="empty-title">Нет связей</div><div className="empty-sub">Создайте первую связь пользователей</div></div></td></tr>}
          {!load && fd.map(l => (
            <tr key={l.id}>
              <td className="mono" style={{ color: 'var(--t3)' }}>#{l.id}</td>
              <td><div className="un">{l.billingUserName ?? '—'}</div><div className="us">billing id: {l.billingId ?? '—'}</div></td>
              <td><div className="un">{l.bitrixUserName ?? '—'}</div><div className="us">bitrix id: {l.bitrixId ?? '—'}</div></td>
              <td><NSChip s={l.status} /></td>
              <td><span className="dt">{fmtDate(l.createdAt as string | undefined)}</span></td>
              <td><div style={{ display: 'flex', gap: 5 }}>
                <button className="btn btn-g btn-ic btn-sm" onClick={() => { setEditM({ id: l.id }); setEditSt((l.status as Status) || 'Active') }}><IEdit /></button>
                <button className="btn btn-d btn-ic btn-sm" onClick={() => setConf({ id: l.id, lbl: `#${l.id}` })}><ITrash /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {modal && <NModal onClose={() => setModal(false)}>
        <div className="modal-title">Создать связь</div>
        <div className="modal-sub">POST /api/userlink</div>
        <div className="fg"><label className="fl">Пользователь Биллинга</label><NSmartSelect options={bOpts} value={form.billingUserId} onChange={v => setForm(f => ({ ...f, billingUserId: v as number }))} placeholder="Выберите..." /></div>
        <div className="fg"><label className="fl">Пользователь Битрикс</label><NSmartSelect options={bxOpts} value={form.bitrixUserId} onChange={v => setForm(f => ({ ...f, bitrixUserId: v as number }))} placeholder="Выберите..." /></div>
        <div className="fg"><label className="fl">Статус</label><NStatusPicker value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} /></div>
        <div className="modal-acts"><button className="btn btn-g" onClick={() => setModal(false)}>Отмена</button><button className="btn btn-p" onClick={create}>Создать</button></div>
      </NModal>}

      {editM && <NModal onClose={() => setEditM(null)}>
        <div className="modal-title">Изменить статус</div>
        <div className="modal-sub">PUT /api/userlink/{editM.id}</div>
        <div className="fg"><label className="fl">Статус</label><NStatusPicker value={editSt} onChange={setEditSt} /></div>
        <div className="modal-acts"><button className="btn btn-g" onClick={() => setEditM(null)}>Отмена</button><button className="btn btn-p" onClick={updSt}>Сохранить</button></div>
      </NModal>}

      {conf && <NConfirmDel text={`Удалить связь ${conf.lbl}?`} onOk={() => del(conf.id)} onNo={() => setConf(null)} />}
    </>
  )
}
