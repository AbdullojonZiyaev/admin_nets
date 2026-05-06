export function NetsLogo() {
  return (
    <span style={{
      fontFamily: "'Share Tech Mono','Courier New',monospace",
      fontSize: '16px',
      fontWeight: '700',
      letterSpacing: '3px',
      color: 'var(--ac)',
      textTransform: 'uppercase',
      userSelect: 'none',
    }}>
      <span style={{ color: 'var(--t3)', marginRight: '2px' }}>_</span>NETS
      <span style={{
        display: 'inline-block',
        width: '8px',
        height: '16px',
        background: 'var(--ac)',
        marginLeft: '3px',
        verticalAlign: 'middle',
        animation: 'blink 1s step-end infinite',
        opacity: 0.9,
      }} />
    </span>
  )
}
