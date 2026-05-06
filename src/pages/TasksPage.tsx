import { useState } from 'react'
import type { ApiCall } from '../types'
import { toast } from '../lib/toast'
import { ISearch, IUserP, IChain } from '../components/icons'

interface TaskInfo {
  id: number
  title: string
  creatorId?: number
  creatorName?: string
  deadline?: string
  status?: string
  description?: string
  responsibleName?: string
}

interface Props {
  api: ApiCall
  onAddBitrix: (d: { bitrixId: string; name: string }) => void
  onLinkBilling: (d: { bitrixUserId: number }) => void
}

// ── Lain TasksPage ───────────────────────────────────────────────────

export function TasksPage({ api, onAddBitrix, onLinkBilling }: Props) {
  const [tid, setTid]       = useState('')
  const [task, setTask]     = useState<TaskInfo | null>(null)
  const [checking, setChk]  = useState(false)
  const [exists, setExists] = useState<boolean | null>(null)
  const [step, setStep]     = useState<0 | 1 | 2>(0)

  async function lookup() {
    if (!tid.trim()) return
    setStep(1); setTask(null); setExists(null)
    try {
      const r = await api(`/api/bitrix/${tid.trim()}`)
      const d = r.data as TaskInfo
      setTask(d); setStep(2)
      if (d.creatorId) {
        setChk(true)
        api(`/api/bitrixuser/${d.creatorId}`)
          .then(() => setExists(true))
          .catch(() => setExists(false))
          .finally(() => setChk(false))
      }
    } catch (e) { toast((e as Error).message, 'err'); setStep(0) }
  }

  return (
    <div className="sys-task-layout">
      <div className="sys-task-box sys-card">
        <div className="sys-task-res sys-task-res-lbl">Поиск задачи Битрикс</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            className="sys-fi"
            style={{ flex: 1 }}
            placeholder="ID задачи"
            value={tid}
            onChange={e => setTid(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
          />
          <button className="sys-btn btn-exec" onClick={lookup}><ISearch />Найти</button>
        </div>

        {step === 1 && (
          <div className="sys-task-step">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
            Запрос к Битрикс API...
          </div>
        )}

        {step === 2 && task && (
          <>
            <div className="sys-task-grid">
              <div className="sys-task-key">ID задачи</div><div className="sys-task-val sys-tsn">{task.id}</div>
              <div className="sys-task-key">Название</div><div className="sys-task-val">{task.title ?? '—'}</div>
              <div className="sys-task-key">Статус</div><div className="sys-task-val sys-tst">{task.status ?? '—'}</div>
              <div className="sys-task-key">Дедлайн</div><div className="sys-task-val">{task.deadline ?? '—'}</div>
              <div className="sys-task-key">Ответственный</div><div className="sys-task-val">{task.responsibleName ?? '—'}</div>
              {task.creatorId && <><div className="sys-task-key">Создатель ID</div><div className="sys-task-val sys-tsn">{task.creatorId}</div></>}
              {task.creatorName && <><div className="sys-task-key">Создатель</div><div className="sys-task-val">{task.creatorName}</div></>}
            </div>

            {task.creatorId && (
              <div className="sys-task-acts">
                <div className="sys-task-acts-lbl">
                  {checking && <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg> Проверка создателя...</>}
                  {!checking && exists === true && <span style={{ color: 'var(--gr)' }}>✓ Создатель уже добавлен в Битрикс пользователи</span>}
                  {!checking && exists === false && 'Создатель не найден в системе:'}
                </div>
                {!checking && exists === false && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="sys-task-act" onClick={() => onAddBitrix({ bitrixId: String(task.creatorId), name: task.creatorName ?? '' })}>
                      <span className="sys-task-act-ico"><IUserP /></span>Добавить как Битрикс пользователя
                    </button>
                    <button className="sys-task-act" onClick={() => onLinkBilling({ bitrixUserId: task.creatorId! })}>
                      <span className="sys-task-act-ico"><IChain /></span>Связать с биллингом
                    </button>
                  </div>
                )}
                {!checking && exists === true && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="sys-task-act" onClick={() => onLinkBilling({ bitrixUserId: task.creatorId! })}>
                      <span className="sys-task-act-ico"><IChain /></span>Создать связь с биллингом
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Normal NTasksPage ────────────────────────────────────────────────

export function NTasksPage({ api, onAddBitrix, onLinkBilling }: Props) {
  const [tid, setTid]       = useState('')
  const [task, setTask]     = useState<TaskInfo | null>(null)
  const [checking, setChk]  = useState(false)
  const [exists, setExists] = useState<boolean | null>(null)
  const [step, setStep]     = useState<0 | 1 | 2>(0)

  async function lookup() {
    if (!tid.trim()) return
    setStep(1); setTask(null); setExists(null)
    try {
      const r = await api(`/api/bitrix/${tid.trim()}`)
      const d = r.data as TaskInfo
      setTask(d); setStep(2)
      if (d.creatorId) {
        setChk(true)
        api(`/api/bitrixuser/${d.creatorId}`)
          .then(() => setExists(true))
          .catch(() => setExists(false))
          .finally(() => setChk(false))
      }
    } catch (e) { toast((e as Error).message, 'err'); setStep(0) }
  }

  return (
    <div className="task-layout">
      <div className="task-box card">
        <div className="task-res task-res-lbl">Поиск задачи Битрикс</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            className="fi"
            style={{ flex: 1 }}
            placeholder="ID задачи"
            value={tid}
            onChange={e => setTid(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
          />
          <button className="btn btn-p" onClick={lookup}><ISearch />Найти</button>
        </div>

        {step === 1 && (
          <div className="task-step">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
            Запрос к Битрикс API...
          </div>
        )}

        {step === 2 && task && (
          <>
            <div className="task-grid">
              <div className="task-key">ID задачи</div><div className="task-val tsn">{task.id}</div>
              <div className="task-key">Название</div><div className="task-val">{task.title ?? '—'}</div>
              <div className="task-key">Статус</div><div className="task-val tst">{task.status ?? '—'}</div>
              <div className="task-key">Дедлайн</div><div className="task-val">{task.deadline ?? '—'}</div>
              <div className="task-key">Ответственный</div><div className="task-val">{task.responsibleName ?? '—'}</div>
              {task.creatorId && <><div className="task-key">Создатель ID</div><div className="task-val tsn">{task.creatorId}</div></>}
              {task.creatorName && <><div className="task-key">Создатель</div><div className="task-val">{task.creatorName}</div></>}
            </div>

            {task.creatorId && (
              <div className="task-acts">
                <div className="task-acts-lbl">
                  {checking && <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg> Проверка создателя...</>}
                  {!checking && exists === true && <span style={{ color: 'var(--gr)' }}>✓ Создатель уже добавлен в Битрикс пользователи</span>}
                  {!checking && exists === false && 'Создатель не найден в системе:'}
                </div>
                {!checking && exists === false && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="task-act" onClick={() => onAddBitrix({ bitrixId: String(task.creatorId), name: task.creatorName ?? '' })}>
                      <span className="task-act-ico"><IUserP /></span>Добавить как Битрикс пользователя
                    </button>
                    <button className="task-act" onClick={() => onLinkBilling({ bitrixUserId: task.creatorId! })}>
                      <span className="task-act-ico"><IChain /></span>Связать с биллингом
                    </button>
                  </div>
                )}
                {!checking && exists === true && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="task-act" onClick={() => onLinkBilling({ bitrixUserId: task.creatorId! })}>
                      <span className="task-act-ico"><IChain /></span>Создать связь с биллингом
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
