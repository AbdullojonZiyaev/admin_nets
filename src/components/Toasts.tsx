import { useToasts } from '../lib/toast'
import { ICheck, IXmark } from './icons'

export function Toasts() {
  const toasts = useToasts()

  return (
    <div className="sys-toasts">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`sys-toast sys-card ${t.type === 'ok' ? 'toast-ok' : 'toast-err'}`}
        >
          {t.type === 'ok' ? <ICheck /> : <IXmark />}
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
