import { useState, useEffect, useCallback } from 'react'
import type { ApiCall, BillingUser } from '../types'
import { toast } from '../lib/toast'
import { ISearch, IPlus, IEdit, ITrash } from '../components/icons'
import { Empty, Modal, ConfirmDel, NEmpty, NModal, NConfirmDel } from './shared'

// ── Lain BillingPage ────────────────────────────────────────────────

interface Props {
  api: ApiCall
  onCnt: (n: number) => void
}

export function BillingPage({ api, onCnt }: Props) {
  const [data, setData]   = useState<BillingUser[]>([])
  const [load, setLoad]   = useState(true)
  const [srch, setSrch]   = useState('')
  const [modal, setModal] = useState(false)
  const [editM, setEditM] = useState<BillingUser | null>(null)
  const [conf, setConf]   = useState<{ id: number; lbl: string } | null>(null)
  const [form, setForm]   = useState({ billingId: '', name: '' })
  const [ef, setEf]       = useState({ billingId: '', name: '' })

  const reload = useCallback(() => {
    setLoad(true)
    api('/api/billinguser')
      .then(r => { const a = Array.isArray(r.data) ? (r.data as BillingUser[]) : []; setData(a); onCnt(a.length) })
      .catch(e => toast((e as Error).message, 'err'))
      .finally(() => setLoad(false))
  }, [api, onCnt])
  useEffect(() => { reload() }, [reload])

  const fd = data.filter(u =>
    (u.name ?? '').toLowerCase().includes(srch.toLowerCase()) ||
    String(u.billingId ?? '').includes(srch) || String(u.id ?? '').includes(srch)
  )

  async function submit() {
    if (!form.name.trim()) { toast('Имя обязательно', 'err'); return }
    try {
      const r = await api('/api/billinguser', { method: 'POST', body: JSON.stringify({ billingId: parseInt(form.billingId) || undefined, name: form.name }) })
      toast((r.msg) ?? 'Пользователь создан'); setModal(false); setForm({ billingId: '', name: '' }); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function submitEdit() {
    if (!editM || !ef.name.trim()) { toast('Имя обязательно', 'err'); return }
    try {
      const r = await api(`/api/billinguser/${editM.id}`, { method: 'PUT', body: JSON.stringify({ name: ef.name, billingId: parseInt(ef.billingId) || undefined }) })
      toast((r.msg) ?? 'Обновлено'); setEditM(null); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function del(id: number) {
    try { const r = await api(`/api/billinguser/${id}`, { method: 'DELETE' }); toast((r.msg) ?? 'Удалено'); reload() } catch (e) { toast((e as Error).message, 'err') }
    setConf(null)
  }

  return (
    <>
      <div className="sys-head">
        <div><div className="sys-title">Пользователи Биллинга</div><div className="sys-subtitle">POST · GET · PUT · DELETE /api/billinguser</div></div>
        <div className="sys-acts">
          <div className="sys-srch-wrap"><span className="sys-srch-ico"><ISearch /></span><input className="sys-srch-inp" placeholder="Поиск по имени, ID..." value={srch} onChange={e => setSrch(e.target.value)} /></div>
          <button className="sys-btn btn-exec" onClick={() => setModal(true)}><IPlus />Добавить</button>
        </div>
      </div>
      <div className="sys-tbl-wrap sys-card"><div className="sys-tbl-scroll"><table>
        <thead><tr><th>ID</th><th>Billing ID</th><th>Имя</th><th>Действия</th></tr></thead>
        <tbody>
          {load && <tr><td colSpan={4}><Empty title="Загрузка..." /></td></tr>}
          {!load && fd.length === 0 && <tr><td colSpan={4}><Empty title="Нет записей" sub="Добавьте первого пользователя Биллинга" /></td></tr>}
          {!load && fd.map(u => (
            <tr key={u.id}>
              <td className="sys-mono" style={{ color: 'var(--t3)' }}>#{u.id}</td>
              <td className="sys-mono" style={{ color: 'var(--ac)' }}>{u.billingId ?? '—'}</td>
              <td style={{ fontWeight: 600 }}>{u.name ?? '—'}</td>
              <td><div style={{ display: 'flex', gap: 5 }}>
                <button className="sys-btn btn-ghost btn-sq btn-xs" onClick={() => { setEditM(u); setEf({ billingId: String(u.billingId ?? ''), name: u.name ?? '' }) }}><IEdit /></button>
                <button className="sys-btn btn-kill btn-sq btn-xs" onClick={() => setConf({ id: u.id, lbl: u.name ?? String(u.id) })}><ITrash /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {modal && <Modal onClose={() => setModal(false)}>
        <div className="sys-modal-title">Добавить пользователя Биллинга</div>
        <div className="sys-modal-sub">POST /api/billinguser</div>
        <div className="sys-fg"><label className="sys-fl">Billing ID</label><input className="sys-fi" type="number" placeholder="1001" value={form.billingId} onChange={e => setForm(f => ({ ...f, billingId: e.target.value }))} /></div>
        <div className="sys-fg"><label className="sys-fl">Имя *</label><input className="sys-fi" placeholder="Иванов Иван" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="sys-modal-acts"><button className="sys-btn btn-ghost" onClick={() => setModal(false)}>Отмена</button><button className="sys-btn btn-exec" onClick={submit}>Создать</button></div>
      </Modal>}

      {editM && <Modal onClose={() => setEditM(null)}>
        <div className="sys-modal-title">Редактировать пользователя</div>
        <div className="sys-modal-sub">PUT /api/billinguser/{editM.id}</div>
        <div className="sys-fg"><label className="sys-fl">Billing ID</label><input className="sys-fi" type="number" placeholder="1001" value={ef.billingId} onChange={e => setEf(f => ({ ...f, billingId: e.target.value }))} /></div>
        <div className="sys-fg"><label className="sys-fl">Имя *</label><input className="sys-fi" placeholder="Иванов Иван" value={ef.name} onChange={e => setEf(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="sys-modal-acts"><button className="sys-btn btn-ghost" onClick={() => setEditM(null)}>Отмена</button><button className="sys-btn btn-exec" onClick={submitEdit}>Сохранить</button></div>
      </Modal>}

      {conf && <ConfirmDel text={`Удалить «${conf.lbl}»?`} onOk={() => del(conf.id)} onNo={() => setConf(null)} />}
    </>
  )
}

// ── Normal NBillingPage ──────────────────────────────────────────────

export function NBillingPage({ api, onCnt }: Props) {
  const [data, setData]   = useState<BillingUser[]>([])
  const [load, setLoad]   = useState(true)
  const [srch, setSrch]   = useState('')
  const [modal, setModal] = useState(false)
  const [editM, setEditM] = useState<BillingUser | null>(null)
  const [conf, setConf]   = useState<{ id: number; lbl: string } | null>(null)
  const [form, setForm]   = useState({ billingId: '', name: '' })
  const [ef, setEf]       = useState({ billingId: '', name: '' })

  const reload = useCallback(() => {
    setLoad(true)
    api('/api/billinguser')
      .then(r => { const a = Array.isArray(r.data) ? (r.data as BillingUser[]) : []; setData(a); onCnt(a.length) })
      .catch(e => toast((e as Error).message, 'err'))
      .finally(() => setLoad(false))
  }, [api, onCnt])
  useEffect(() => { reload() }, [reload])

  const fd = data.filter(u =>
    (u.name ?? '').toLowerCase().includes(srch.toLowerCase()) ||
    String(u.billingId ?? '').includes(srch) || String(u.id ?? '').includes(srch)
  )

  async function submit() {
    if (!form.name.trim()) { toast('Имя обязательно', 'err'); return }
    try {
      const r = await api('/api/billinguser', { method: 'POST', body: JSON.stringify({ billingId: parseInt(form.billingId) || undefined, name: form.name }) })
      toast((r.msg) ?? 'Пользователь создан'); setModal(false); setForm({ billingId: '', name: '' }); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function submitEdit() {
    if (!editM || !ef.name.trim()) { toast('Имя обязательно', 'err'); return }
    try {
      const r = await api(`/api/billinguser/${editM.id}`, { method: 'PUT', body: JSON.stringify({ name: ef.name, billingId: parseInt(ef.billingId) || undefined }) })
      toast((r.msg) ?? 'Обновлено'); setEditM(null); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function del(id: number) {
    try { const r = await api(`/api/billinguser/${id}`, { method: 'DELETE' }); toast((r.msg) ?? 'Удалено'); reload() } catch (e) { toast((e as Error).message, 'err') }
    setConf(null)
  }

  return (
    <>
      <div className="sec-head">
        <div><div className="sec-title">Пользователи Биллинга</div><div className="sec-sub">POST · GET · PUT · DELETE /api/billinguser</div></div>
        <div className="sec-acts">
          <div className="sw"><span className="si"><ISearch /></span><input className="sinp" placeholder="Поиск по имени, ID..." value={srch} onChange={e => setSrch(e.target.value)} /></div>
          <button className="btn btn-p" onClick={() => setModal(true)}><IPlus />Добавить</button>
        </div>
      </div>
      <div className="tw card"><div className="ts"><table>
        <thead><tr><th>ID</th><th>Billing ID</th><th>Имя</th><th>Действия</th></tr></thead>
        <tbody>
          {load && <tr><td colSpan={4}><NEmpty title="Загрузка..." /></td></tr>}
          {!load && fd.length === 0 && <tr><td colSpan={4}><NEmpty title="Нет записей" sub="Добавьте первого пользователя Биллинга" /></td></tr>}
          {!load && fd.map(u => (
            <tr key={u.id}>
              <td className="mono" style={{ color: 'var(--t3)' }}>#{u.id}</td>
              <td className="mono" style={{ color: 'var(--ac)' }}>{u.billingId ?? '—'}</td>
              <td style={{ fontWeight: 600 }}>{u.name ?? '—'}</td>
              <td><div style={{ display: 'flex', gap: 5 }}>
                <button className="btn btn-g btn-ic btn-sm" onClick={() => { setEditM(u); setEf({ billingId: String(u.billingId ?? ''), name: u.name ?? '' }) }}><IEdit /></button>
                <button className="btn btn-d btn-ic btn-sm" onClick={() => setConf({ id: u.id, lbl: u.name ?? String(u.id) })}><ITrash /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {modal && <NModal onClose={() => setModal(false)}>
        <div className="modal-title">Добавить пользователя Биллинга</div>
        <div className="modal-sub">POST /api/billinguser</div>
        <div className="fg"><label className="fl">Billing ID</label><input className="fi" type="number" placeholder="1001" value={form.billingId} onChange={e => setForm(f => ({ ...f, billingId: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Имя *</label><input className="fi" placeholder="Иванов Иван" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="modal-acts"><button className="btn btn-g" onClick={() => setModal(false)}>Отмена</button><button className="btn btn-p" onClick={submit}>Создать</button></div>
      </NModal>}

      {editM && <NModal onClose={() => setEditM(null)}>
        <div className="modal-title">Редактировать пользователя</div>
        <div className="modal-sub">PUT /api/billinguser/{editM.id}</div>
        <div className="fg"><label className="fl">Billing ID</label><input className="fi" type="number" placeholder="1001" value={ef.billingId} onChange={e => setEf(f => ({ ...f, billingId: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Имя *</label><input className="fi" placeholder="Иванов Иван" value={ef.name} onChange={e => setEf(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="modal-acts"><button className="btn btn-g" onClick={() => setEditM(null)}>Отмена</button><button className="btn btn-p" onClick={submitEdit}>Сохранить</button></div>
      </NModal>}

      {conf && <NConfirmDel text={`Удалить «${conf.lbl}»?`} onOk={() => del(conf.id)} onNo={() => setConf(null)} />}
    </>
  )
}
