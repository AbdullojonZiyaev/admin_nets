type Status = 'Active' | 'Inactive' | 'Archived'

interface StatusOption {
  v: Status
  c: string
}

const OPTIONS: StatusOption[] = [
  { v: 'Active',   c: 'stb-a'  },
  { v: 'Inactive', c: 'stb-i'  },
  { v: 'Archived', c: 'stb-ar' },
]

interface Props {
  value: Status | null
  onChange: (value: Status) => void
}

export function StatusPicker({ value, onChange }: Props) {
  return (
    <div className="sys-stp">
      {OPTIONS.map(s => (
        <div
          key={s.v}
          className={`sys-stb${value === s.v ? ' ' + s.c : ''}`}
          onClick={() => onChange(s.v)}
        >
          {s.v}
        </div>
      ))}
    </div>
  )
}
