
type Status = 'Active' | 'Inactive' | 'Archived'

interface Props {
  value: Status | null
  onChange: (value: Status) => void
}

const OPTIONS = [
  { v: 'Active'   as Status, c: 'sa'  },
  { v: 'Inactive' as Status, c: 'si'  },
  { v: 'Archived' as Status, c: 'sar' },
]

export function NStatusPicker({ value, onChange }: Props) {
  return (
    <div className="stp">
      {OPTIONS.map(s => (
        <div
          key={s.v}
          className={`stb${value === s.v ? ' ' + s.c : ''}`}
          onClick={() => onChange(s.v)}
        >
          {s.v}
        </div>
      ))}
    </div>
  )
}
