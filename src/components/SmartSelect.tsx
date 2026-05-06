import { useState, useEffect, useRef } from 'react'
import { IChev } from './icons'

export interface SelectOption {
  value: string | number
  label: string
  sub?: string | number
}

interface Props {
  options: SelectOption[]
  value: string | number | null
  onChange: (value: string | number) => void
  placeholder?: string
}

export function SmartSelect({ options, value, onChange, placeholder = 'Выберите...' }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = options.filter(o =>
    (o.label ?? '').toLowerCase().includes(q.toLowerCase()) ||
    String(o.sub ?? '').includes(q)
  )

  const selected = options.find(o => o.value === value)

  return (
    <div className="sys-ss" ref={ref}>
      <div
        className={`ss-trigger${open ? ' open' : ''}`}
        onClick={() => { setOpen(x => !x); setQ('') }}
      >
        {selected
          ? <><span>{selected.label}</span><span className="ss-meta">id: {selected.sub}</span></>
          : <span className="ss-placeholder">{placeholder}</span>
        }
      </div>
      <span className={`ss-arrow${open ? ' open' : ''}`}><IChev /></span>

      {open && (
        <div className="ss-dropdown">
          <input
            className="ss-search"
            placeholder="Поиск..."
            value={q}
            onChange={e => setQ(e.target.value)}
            autoFocus
          />
          <div className="ss-list">
            {filtered.length === 0 && <div className="ss-empty">Ничего не найдено</div>}
            {filtered.map(o => (
              <div
                key={o.value}
                className={`ss-option${value === o.value ? ' sel' : ''}`}
                onClick={() => { onChange(o.value); setOpen(false); setQ('') }}
              >
                <span>{o.label}</span>
                {o.sub != null && <span className="ss-meta">id: {o.sub}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
