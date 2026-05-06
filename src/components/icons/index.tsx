interface IcProps {
  d: string | string[]
  s?: number
}

export const Ic = ({ d, s = 18 }: IcProps) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {([] as string[]).concat(d).map((p, i) => <path key={i} d={p} />)}
  </svg>
)

export const IDash = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2"  y="2"  width="8" height="8" rx="0" />
    <rect x="14" y="2"  width="8" height="8" rx="0" />
    <rect x="2"  y="14" width="8" height="8" rx="0" />
    <rect x="14" y="14" width="8" height="8" rx="0" />
  </svg>
)

export const IBill = () => (
  <Ic s={17} d={[
    'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    'M12 11v2',
  ]} />
)

export const IUser = () => (
  <Ic s={17} d={[
    'M12 2a6 6 0 0 1 6 6v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a6 6 0 0 1 6-6z',
    'M10 17v-3M14 17v-3',
    'M8 17h8',
    'M9 9h.01M15 9h.01',
  ]} />
)

export const ILink = () => (
  <Ic s={17} d={[
    'M18 8h1a4 4 0 0 1 0 8h-1',
    'M2 8h1',
    'M6 8h10',
    'M5 8a4 4 0 0 0 0 8',
    'M6 16h10',
  ]} />
)

export const ITask = () => (
  <Ic s={17} d={[
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    'M12 9v4',
    'M12 17h.01',
  ]} />
)

export const IPlus   = () => <Ic d="M12 5v14M5 12h14" />

export const ISearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

export const ITrash = () => (
  <Ic s={13} d={[
    'M3 6h18',
    'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
    'M10 11v6M14 11v6',
    'M9 6V4h6v2',
  ]} />
)

export const IEdit = () => (
  <Ic s={13} d={[
    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
    'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  ]} />
)

export const ICheck = () => <Ic d="M20 6L9 17l-5-5" />
export const IXmark = () => <Ic d="M18 6L6 18M6 6l12 12" />
export const IMoon  = () => <Ic d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />

export const ISun = () => (
  <Ic d={[
    'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
    'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  ]} />
)

export const IChev = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IUserP = () => (
  <Ic d={[
    'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
    'M8.5 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M20 8v6M23 11h-6',
  ]} />
)

export const IChain = () => (
  <Ic d={[
    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
    'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    'M12 8v8',
  ]} />
)

export const ISwitch = () => (
  <Ic s={17} d={[
    'M5 12.55a11 11 0 0 1 14.08 0',
    'M1.42 9a16 16 0 0 1 21.16 0',
    'M8.53 16.11a6 6 0 0 1 6.95 0',
    'M12 20h.01',
  ]} />
)

export const ICity = () => (
  <Ic s={17} d={[
    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    'M9 22V12h6v10',
  ]} />
)

export const IVendor = () => (
  <Ic s={17} d={[
    'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z',
    'M7 7h.01',
  ]} />
)

export const ILogin = () => (
  <Ic s={17} d={[
    'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4',
    'M10 17l5-5-5-5',
    'M15 12H3',
  ]} />
)

export const ILogout = () => (
  <Ic s={17} d={[
    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
    'M16 17l5-5-5-5',
    'M21 12H9',
  ]} />
)
