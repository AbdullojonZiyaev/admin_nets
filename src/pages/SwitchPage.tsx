import React, { useState, useEffect, useCallback } from 'react'
import type { ApiCall, Switch, SearchCache } from '../types'
import { toast } from '../lib/toast'
import { ISearch, IPlus, IEdit, ITrash } from '../components/icons'
import { SmartSelect } from '../components/SmartSelect'
import { Empty, Modal, ConfirmDel, NEmpty, NModal, NConfirmDel } from './shared'

interface Props {
  api: ApiCall
  onCnt: (n: number) => void
  cache?: SearchCache
}

// ── Lain SwitchPage ──────────────────────────────────────────────────

function SwitchForm({
  form, setForm, vendorOpts, cityOpts,
}: {
  form: { ip: string; port: string; name: string; vendorId: number | null; cityId: number | null }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  vendorOpts: { value: number | string; label: string }[]
  cityOpts: { value: number | string; label: string }[]
}) {
  return (
    <>
      <div className="sys-fg"><label className="sys-fl">IP *</label><input className="sys-fi" placeholder="192.168.1.1" value={form.ip} onChange={e => setForm(f => ({ ...f, ip: e.target.value }))} /></div>
      <div className="sys-fg"><label className="sys-fl">Порт</label><input className="sys-fi" type="number" placeholder="22" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} /></div>
      <div className="sys-fg"><label className="sys-fl">Имя</label><input className="sys-fi" placeholder="Название" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
      <div className="sys-fg"><label className="sys-fl">Производитель</label><SmartSelect options={vendorOpts} value={form.vendorId} onChange={v => setForm(f => ({ ...f, vendorId: v as number | null }))} placeholder="Выберите..." /></div>
      <div className="sys-fg"><label className="sys-fl">Город</label><SmartSelect options={cityOpts} value={form.cityId} onChange={v => setForm(f => ({ ...f, cityId: v as number | null }))} placeholder="Выберите..." /></div>
    </>
  )
}

const emptyForm = { ip: '', port: '', name: '', vendorId: null as number | null, cityId: null as number | null }

export function SwitchPage({ api, onCnt, cache }: Props) {
  const [data, setData]   = useState<Switch[]>([])
  const [load, setLoad]   = useState(true)
  const [srch, setSrch]   = useState('')
  const [modal, setModal] = useState(false)
  const [editM, setEditM] = useState<Switch | null>(null)
  const [conf, setConf]   = useState<{ id: number; lbl: string } | null>(null)
  const [form, setForm]   = useState({ ...emptyForm })
  const [ef, setEf]       = useState({ ...emptyForm })

  const vendorOpts = (cache?.vendor ?? []).map(v => ({ value: v.id, label: v.name }))
  const cityOpts   = (cache?.city ?? []).map(c => ({ value: c.id, label: c.name }))

  const vendorName = (id?: number | null) => id ? (cache?.vendor?.find(v => v.id === id)?.name ?? String(id)) : '—'
  const cityName   = (id?: number | null) => id ? (cache?.city?.find(c => c.id === id)?.name ?? String(id)) : '—'

  const reload = useCallback(() => {
    setLoad(true)
    api('/api/switch')
      .then(r => { const a = Array.isArray(r.data) ? (r.data as Switch[]) : []; setData(a); onCnt(a.length) })
      .catch(e => toast((e as Error).message, 'err'))
      .finally(() => setLoad(false))
  }, [api, onCnt])
  useEffect(() => { reload() }, [reload])

  const fd = data.filter(s =>
    (s.name ?? '').toLowerCase().includes(srch.toLowerCase()) ||
    (s.ip ?? '').includes(srch) || String(s.id ?? '').includes(srch)
  )

  async function submit() {
    if (!form.ip.trim()) { toast('IP обязателен', 'err'); return }
    try {
      const body: Record<string, unknown> = { ip: form.ip }
      if (form.port) body.port = parseInt(form.port)
      if (form.name) body.name = form.name
      if (form.vendorId) body.vendorId = form.vendorId
      if (form.cityId) body.cityId = form.cityId
      const r = await api('/api/switch', { method: 'POST', body: JSON.stringify(body) })
      toast((r.msg) ?? 'Свитч создан'); setModal(false); setForm({ ...emptyForm }); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function submitEdit() {
    if (!editM || !ef.ip.trim()) { toast('IP обязателен', 'err'); return }
    try {
      const body: Record<string, unknown> = { ip: ef.ip }
      if (ef.port) body.port = parseInt(ef.port)
      if (ef.name) body.name = ef.name
      body.vendorId = ef.vendorId
      body.cityId = ef.cityId
      const r = await api(`/api/switch/${editM.id}`, { method: 'PUT', body: JSON.stringify(body) })
      toast((r.msg) ?? 'Обновлено'); setEditM(null); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function del(id: number) {
    try { const r = await api(`/api/switch/${id}`, { method: 'DELETE' }); toast((r.msg) ?? 'Удалено'); reload() } catch (e) { toast((e as Error).message, 'err') }
    setConf(null)
  }

  return (
    <>
      <div className="sys-head">
        <div><div className="sys-title">Свитчи</div><div className="sys-subtitle">POST · GET · PUT · DELETE /api/switch</div></div>
        <div className="sys-acts">
          <div className="sys-srch-wrap"><span className="sys-srch-ico"><ISearch /></span><input className="sys-srch-inp" placeholder="Поиск по IP, имени..." value={srch} onChange={e => setSrch(e.target.value)} /></div>
          <button className="sys-btn btn-exec" onClick={() => { setForm({ ...emptyForm }); setModal(true) }}><IPlus />Добавить</button>
        </div>
      </div>
      <div className="sys-tbl-wrap sys-card"><div className="sys-tbl-scroll"><table>
        <thead><tr><th>ID</th><th>IP</th><th>Порт</th><th>Имя</th><th>Производитель</th><th>Город</th><th>Действия</th></tr></thead>
        <tbody>
          {load && <tr><td colSpan={7}><Empty title="Загрузка..." /></td></tr>}
          {!load && fd.length === 0 && <tr><td colSpan={7}><Empty title="Нет свитчей" sub="Добавьте первый свитч" /></td></tr>}
          {!load && fd.map(s => (
            <tr key={s.id}>
              <td className="sys-mono" style={{ color: 'var(--t3)' }}>#{s.id}</td>
              <td className="sys-mono" style={{ color: 'var(--ac)' }}>{s.ip ?? '—'}</td>
              <td className="sys-mono">{s.port ?? '—'}</td>
              <td>{s.name ?? '—'}</td>
              <td>{vendorName(s.vendorId)}</td>
              <td>{cityName(s.cityId)}</td>
              <td><div style={{ display: 'flex', gap: 5 }}>
                <button className="sys-btn btn-ghost btn-sq btn-xs" onClick={() => { setEditM(s); setEf({ ip: s.ip ?? '', port: String(s.port ?? ''), name: s.name ?? '', vendorId: s.vendorId ?? null, cityId: s.cityId ?? null }) }}><IEdit /></button>
                <button className="sys-btn btn-kill btn-sq btn-xs" onClick={() => setConf({ id: s.id, lbl: s.ip ?? String(s.id) })}><ITrash /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {modal && <Modal onClose={() => setModal(false)}>
        <div className="sys-modal-title">Добавить свитч</div>
        <div className="sys-modal-sub">POST /api/switch</div>
        <SwitchForm form={form} setForm={setForm} vendorOpts={vendorOpts} cityOpts={cityOpts} />
        <div className="sys-modal-acts"><button className="sys-btn btn-ghost" onClick={() => setModal(false)}>Отмена</button><button className="sys-btn btn-exec" onClick={submit}>Создать</button></div>
      </Modal>}

      {editM && <Modal onClose={() => setEditM(null)}>
        <div className="sys-modal-title">Редактировать свитч</div>
        <div className="sys-modal-sub">PUT /api/switch/{editM.id}</div>
        <SwitchForm form={ef} setForm={setEf} vendorOpts={vendorOpts} cityOpts={cityOpts} />
        <div className="sys-modal-acts"><button className="sys-btn btn-ghost" onClick={() => setEditM(null)}>Отмена</button><button className="sys-btn btn-exec" onClick={submitEdit}>Сохранить</button></div>
      </Modal>}

      {conf && <ConfirmDel text={`Удалить свитч ${conf.lbl}?`} onOk={() => del(conf.id)} onNo={() => setConf(null)} />}
    </>
  )
}

// ── Normal NSwitchPage ───────────────────────────────────────────────

export function NSwitchPage({ api, onCnt }: Props) {
  const [data, setData]   = useState<Switch[]>([])
  const [load, setLoad]   = useState(true)
  const [srch, setSrch]   = useState('')
  const [modal, setModal] = useState(false)
  const [editM, setEditM] = useState<Switch | null>(null)
  const [conf, setConf]   = useState<{ id: number; lbl: string } | null>(null)
  const [form, setForm]   = useState({ ip: '', port: '', name: '', vendorId: '', cityId: '' })
  const [ef, setEf]       = useState({ ip: '', port: '', name: '', vendorId: '', cityId: '' })

  const reload = useCallback(() => {
    setLoad(true)
    api('/api/switch')
      .then(r => { const a = Array.isArray(r.data) ? (r.data as Switch[]) : []; setData(a); onCnt(a.length) })
      .catch(e => toast((e as Error).message, 'err'))
      .finally(() => setLoad(false))
  }, [api, onCnt])
  useEffect(() => { reload() }, [reload])

  const fd = data.filter(s =>
    (s.name ?? '').toLowerCase().includes(srch.toLowerCase()) ||
    (s.ip ?? '').includes(srch) || String(s.id ?? '').includes(srch)
  )

  async function submit() {
    if (!form.ip.trim()) { toast('IP обязателен', 'err'); return }
    try {
      const body: Record<string, unknown> = { ip: form.ip }
      if (form.port) body.port = parseInt(form.port)
      if (form.name) body.name = form.name
      if (form.vendorId) body.vendorId = parseInt(form.vendorId)
      if (form.cityId) body.cityId = parseInt(form.cityId)
      const r = await api('/api/switch', { method: 'POST', body: JSON.stringify(body) })
      toast((r.msg) ?? 'Свитч создан'); setModal(false); setForm({ ip: '', port: '', name: '', vendorId: '', cityId: '' }); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function submitEdit() {
    if (!editM || !ef.ip.trim()) { toast('IP обязателен', 'err'); return }
    try {
      const body: Record<string, unknown> = { ip: ef.ip }
      if (ef.port) body.port = parseInt(ef.port)
      if (ef.name) body.name = ef.name
      body.vendorId = ef.vendorId ? parseInt(ef.vendorId) : null
      body.cityId = ef.cityId ? parseInt(ef.cityId) : null
      const r = await api(`/api/switch/${editM.id}`, { method: 'PUT', body: JSON.stringify(body) })
      toast((r.msg) ?? 'Обновлено'); setEditM(null); reload()
    } catch (e) { toast((e as Error).message, 'err') }
  }
  async function del(id: number) {
    try { const r = await api(`/api/switch/${id}`, { method: 'DELETE' }); toast((r.msg) ?? 'Удалено'); reload() } catch (e) { toast((e as Error).message, 'err') }
    setConf(null)
  }

  return (
    <>
      <div className="sec-head">
        <div><div className="sec-title">Свитчи</div><div className="sec-sub">POST · GET · PUT · DELETE /api/switch</div></div>
        <div className="sec-acts">
          <div className="sw"><span className="si"><ISearch /></span><input className="sinp" placeholder="Поиск по IP, имени..." value={srch} onChange={e => setSrch(e.target.value)} /></div>
          <button className="btn btn-p" onClick={() => { setForm({ ip: '', port: '', name: '', vendorId: '', cityId: '' }); setModal(true) }}><IPlus />Добавить</button>
        </div>
      </div>
      <div className="tw card"><div className="ts"><table>
        <thead><tr><th>ID</th><th>IP</th><th>Порт</th><th>Имя</th><th>Vendor ID</th><th>City ID</th><th>Действия</th></tr></thead>
        <tbody>
          {load && <tr><td colSpan={7}><NEmpty title="Загрузка..." /></td></tr>}
          {!load && fd.length === 0 && <tr><td colSpan={7}><NEmpty title="Нет свитчей" sub="Добавьте первый свитч" /></td></tr>}
          {!load && fd.map(s => (
            <tr key={s.id}>
              <td className="mono" style={{ color: 'var(--t3)' }}>#{s.id}</td>
              <td className="mono" style={{ color: 'var(--ac)' }}>{s.ip ?? '—'}</td>
              <td className="mono">{s.port ?? '—'}</td>
              <td>{s.name ?? '—'}</td>
              <td className="mono">{s.vendorId ?? '—'}</td>
              <td className="mono">{s.cityId ?? '—'}</td>
              <td><div style={{ display: 'flex', gap: 5 }}>
                <button className="btn btn-g btn-ic btn-sm" onClick={() => { setEditM(s); setEf({ ip: s.ip ?? '', port: String(s.port ?? ''), name: s.name ?? '', vendorId: String(s.vendorId ?? ''), cityId: String(s.cityId ?? '') }) }}><IEdit /></button>
                <button className="btn btn-d btn-ic btn-sm" onClick={() => setConf({ id: s.id, lbl: s.ip ?? String(s.id) })}><ITrash /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {modal && <NModal onClose={() => setModal(false)}>
        <div className="modal-title">Добавить свитч</div>
        <div className="modal-sub">POST /api/switch</div>
        <div className="fg"><label className="fl">IP *</label><input className="fi" placeholder="192.168.1.1" value={form.ip} onChange={e => setForm(f => ({ ...f, ip: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Порт</label><input className="fi" type="number" placeholder="22" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Имя</label><input className="fi" placeholder="Название" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Vendor ID</label><input className="fi" type="number" placeholder="1" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} /></div>
        <div className="fg"><label className="fl">City ID</label><input className="fi" type="number" placeholder="1" value={form.cityId} onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))} /></div>
        <div className="modal-acts"><button className="btn btn-g" onClick={() => setModal(false)}>Отмена</button><button className="btn btn-p" onClick={submit}>Создать</button></div>
      </NModal>}

      {editM && <NModal onClose={() => setEditM(null)}>
        <div className="modal-title">Редактировать свитч</div>
        <div className="modal-sub">PUT /api/switch/{editM.id}</div>
        <div className="fg"><label className="fl">IP *</label><input className="fi" placeholder="192.168.1.1" value={ef.ip} onChange={e => setEf(f => ({ ...f, ip: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Порт</label><input className="fi" type="number" placeholder="22" value={ef.port} onChange={e => setEf(f => ({ ...f, port: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Имя</label><input className="fi" placeholder="Название" value={ef.name} onChange={e => setEf(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Vendor ID</label><input className="fi" type="number" placeholder="1" value={ef.vendorId} onChange={e => setEf(f => ({ ...f, vendorId: e.target.value }))} /></div>
        <div className="fg"><label className="fl">City ID</label><input className="fi" type="number" placeholder="1" value={ef.cityId} onChange={e => setEf(f => ({ ...f, cityId: e.target.value }))} /></div>
        <div className="modal-acts"><button className="btn btn-g" onClick={() => setEditM(null)}>Отмена</button><button className="btn btn-p" onClick={submitEdit}>Сохранить</button></div>
      </NModal>}

      {conf && <NConfirmDel text={`Удалить свитч ${conf.lbl}?`} onOk={() => del(conf.id)} onNo={() => setConf(null)} />}
    </>
  )
}
