import { useState, useEffect, useCallback } from 'react'
import type { ApiCall, Vendor } from '../types'
import { toast } from '../lib/toast'
import { ISearch, IPlus, IEdit, ITrash } from '../components/icons'
import { Empty, Modal, ConfirmDel, NEmpty, NModal, NConfirmDel } from './shared'

interface Props {
  api: ApiCall
  onCnt: (n: number) => void
}

// ── Lain VendorPage ──────────────────────────────────────────────────

export function VendorPage({ api, onCnt }: Props) {
  const [data, setData]   = useState<Vendor[]>([])
  const [load, setLoad]   = useState(true)
  const [srch, setSrch]   = useState('')
  const [modal, setModal] = useState(false)
  const [editM, setEditM] = useState<Vendor | null>(null)
  const [conf, setConf]   = useState<{ id: number; lbl: string } | null>(null)
  const [name, setName]   = useState('')
  const [ename, setEname] = useState('')

  const reload = useCallback(() => {
    setLoad(true)
    api('/api/vendor')
      .then(r => { const a = Array.isArray(r.data) ? (r.data as Vendor[]) : []; setData(a); onCnt(a.length) })
      .catch(e => toast((e as Error).message, 'err'))
      .finally(() => setLoad(false))
  }, [api, onCnt])
  useEffect(() => { reload() }, [reload])

  const fd = data.filter(v => (v.name ?? '').toLowerCase().includes(srch.toLowerCase()) || String(v.id ?? '').includes(srch))

  async function submit() {
    if (!name.trim()) { toast('Название обязательно', 'err'); return }
    try {
      const r = await api('/api/vendor', { method: 'POST', body: JSON.stringify({ name }) })
      toast((r.msg) ?? 'Вендор создан'); setModal(false); setName(''); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function submitEdit() {
    if (!editM || !ename.trim()) { toast('Название обязательно', 'err'); return }
    try {
      const r = await api(`/api/vendor/${editM.id}`, { method: 'PUT', body: JSON.stringify({ name: ename }) })
      toast((r.msg) ?? 'Обновлено'); setEditM(null); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function del(id: number) {
    try { const r = await api(`/api/vendor/${id}`, { method: 'DELETE' }); toast((r.msg) ?? 'Удалено'); reload() } catch (e) { toast((e as Error).message, 'err') }
    setConf(null)
  }

  return (
    <>
      <div className="sys-head">
        <div><div className="sys-title">Вендоры</div><div className="sys-subtitle">POST · GET · PUT · DELETE /api/vendor</div></div>
        <div className="sys-acts">
          <div className="sys-srch-wrap"><span className="sys-srch-ico"><ISearch /></span><input className="sys-srch-inp" placeholder="Поиск по названию..." value={srch} onChange={e => setSrch(e.target.value)} /></div>
          <button className="sys-btn btn-exec" onClick={() => { setName(''); setModal(true) }}><IPlus />Добавить</button>
        </div>
      </div>
      <div className="sys-tbl-wrap sys-card"><div className="sys-tbl-scroll"><table>
        <thead><tr><th>ID</th><th>Название</th><th>Действия</th></tr></thead>
        <tbody>
          {load && <tr><td colSpan={3}><Empty title="Загрузка..." /></td></tr>}
          {!load && fd.length === 0 && <tr><td colSpan={3}><Empty title="Нет вендоров" sub="Добавьте первого вендора" /></td></tr>}
          {!load && fd.map(v => (
            <tr key={v.id}>
              <td className="sys-mono" style={{ color: 'var(--t3)' }}>#{v.id}</td>
              <td style={{ fontWeight: 600 }}>{v.name ?? '—'}</td>
              <td><div style={{ display: 'flex', gap: 5 }}>
                <button className="sys-btn btn-ghost btn-sq btn-xs" onClick={() => { setEditM(v); setEname(v.name ?? '') }}><IEdit /></button>
                <button className="sys-btn btn-kill btn-sq btn-xs" onClick={() => setConf({ id: v.id, lbl: v.name ?? String(v.id) })}><ITrash /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {modal && <Modal onClose={() => setModal(false)}>
        <div className="sys-modal-title">Добавить вендора</div>
        <div className="sys-modal-sub">POST /api/vendor</div>
        <div className="sys-fg"><label className="sys-fl">Название *</label><input className="sys-fi" placeholder="Cisco" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="sys-modal-acts"><button className="sys-btn btn-ghost" onClick={() => setModal(false)}>Отмена</button><button className="sys-btn btn-exec" onClick={submit}>Создать</button></div>
      </Modal>}

      {editM && <Modal onClose={() => setEditM(null)}>
        <div className="sys-modal-title">Редактировать вендора</div>
        <div className="sys-modal-sub">PUT /api/vendor/{editM.id}</div>
        <div className="sys-fg"><label className="sys-fl">Название *</label><input className="sys-fi" placeholder="Cisco" value={ename} onChange={e => setEname(e.target.value)} /></div>
        <div className="sys-modal-acts"><button className="sys-btn btn-ghost" onClick={() => setEditM(null)}>Отмена</button><button className="sys-btn btn-exec" onClick={submitEdit}>Сохранить</button></div>
      </Modal>}

      {conf && <ConfirmDel text={`Удалить «${conf.lbl}»?`} onOk={() => del(conf.id)} onNo={() => setConf(null)} />}
    </>
  )
}

// ── Normal NVendorPage ───────────────────────────────────────────────

export function NVendorPage({ api, onCnt }: Props) {
  const [data, setData]   = useState<Vendor[]>([])
  const [load, setLoad]   = useState(true)
  const [srch, setSrch]   = useState('')
  const [modal, setModal] = useState(false)
  const [editM, setEditM] = useState<Vendor | null>(null)
  const [conf, setConf]   = useState<{ id: number; lbl: string } | null>(null)
  const [name, setName]   = useState('')
  const [ename, setEname] = useState('')

  const reload = useCallback(() => {
    setLoad(true)
    api('/api/vendor')
      .then(r => { const a = Array.isArray(r.data) ? (r.data as Vendor[]) : []; setData(a); onCnt(a.length) })
      .catch(e => toast((e as Error).message, 'err'))
      .finally(() => setLoad(false))
  }, [api, onCnt])
  useEffect(() => { reload() }, [reload])

  const fd = data.filter(v => (v.name ?? '').toLowerCase().includes(srch.toLowerCase()) || String(v.id ?? '').includes(srch))

  async function submit() {
    if (!name.trim()) { toast('Название обязательно', 'err'); return }
    try {
      const r = await api('/api/vendor', { method: 'POST', body: JSON.stringify({ name }) })
      toast((r.msg) ?? 'Вендор создан'); setModal(false); setName(''); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function submitEdit() {
    if (!editM || !ename.trim()) { toast('Название обязательно', 'err'); return }
    try {
      const r = await api(`/api/vendor/${editM.id}`, { method: 'PUT', body: JSON.stringify({ name: ename }) })
      toast((r.msg) ?? 'Обновлено'); setEditM(null); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function del(id: number) {
    try { const r = await api(`/api/vendor/${id}`, { method: 'DELETE' }); toast((r.msg) ?? 'Удалено'); reload() } catch (e) { toast((e as Error).message, 'err') }
    setConf(null)
  }

  return (
    <>
      <div className="sec-head">
        <div><div className="sec-title">Вендоры</div><div className="sec-sub">POST · GET · PUT · DELETE /api/vendor</div></div>
        <div className="sec-acts">
          <div className="sw"><span className="si"><ISearch /></span><input className="sinp" placeholder="Поиск по названию..." value={srch} onChange={e => setSrch(e.target.value)} /></div>
          <button className="btn btn-p" onClick={() => { setName(''); setModal(true) }}><IPlus />Добавить</button>
        </div>
      </div>
      <div className="tw card"><div className="ts"><table>
        <thead><tr><th>ID</th><th>Название</th><th>Действия</th></tr></thead>
        <tbody>
          {load && <tr><td colSpan={3}><NEmpty title="Загрузка..." /></td></tr>}
          {!load && fd.length === 0 && <tr><td colSpan={3}><NEmpty title="Нет вендоров" sub="Добавьте первого вендора" /></td></tr>}
          {!load && fd.map(v => (
            <tr key={v.id}>
              <td className="mono" style={{ color: 'var(--t3)' }}>#{v.id}</td>
              <td style={{ fontWeight: 600 }}>{v.name ?? '—'}</td>
              <td><div style={{ display: 'flex', gap: 5 }}>
                <button className="btn btn-g btn-ic btn-sm" onClick={() => { setEditM(v); setEname(v.name ?? '') }}><IEdit /></button>
                <button className="btn btn-d btn-ic btn-sm" onClick={() => setConf({ id: v.id, lbl: v.name ?? String(v.id) })}><ITrash /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {modal && <NModal onClose={() => setModal(false)}>
        <div className="modal-title">Добавить вендора</div>
        <div className="modal-sub">POST /api/vendor</div>
        <div className="fg"><label className="fl">Название *</label><input className="fi" placeholder="Cisco" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="modal-acts"><button className="btn btn-g" onClick={() => setModal(false)}>Отмена</button><button className="btn btn-p" onClick={submit}>Создать</button></div>
      </NModal>}

      {editM && <NModal onClose={() => setEditM(null)}>
        <div className="modal-title">Редактировать вендора</div>
        <div className="modal-sub">PUT /api/vendor/{editM.id}</div>
        <div className="fg"><label className="fl">Название *</label><input className="fi" placeholder="Cisco" value={ename} onChange={e => setEname(e.target.value)} /></div>
        <div className="modal-acts"><button className="btn btn-g" onClick={() => setEditM(null)}>Отмена</button><button className="btn btn-p" onClick={submitEdit}>Сохранить</button></div>
      </NModal>}

      {conf && <NConfirmDel text={`Удалить «${conf.lbl}»?`} onOk={() => del(conf.id)} onNo={() => setConf(null)} />}
    </>
  )
}
