import { useState, useEffect, useRef } from 'react'
import type { ApiCall, BillingUser, BitrixUser, UserLink, NavCounts, PageId } from '../types'
import { SChip } from './shared'
import { ISearch } from '../components/icons'

// ── Local types ─────────────────────────────────────────────────────

interface GraphNode {
  id: string
  type: 'root' | 'billing' | 'bitrix'
  label: string
  sub?: string
  billingId?: string | number
  bitrixId?: string | number
  x: number; y: number; r: number; vx: number; vy: number
  page: PageId | null
  raw?: BillingUser | BitrixUser
}

interface GraphEdge {
  from: string; to: string; color: string; width: number
  link?: UserLink; weak?: boolean
  cp?: { x: number; y: number; vx: number; vy: number }
}

interface ScanState {
  target: GraphNode | null; phase: 'idle' | 'scanning' | 'showing'
  progress: number; timer: number; nextScan: number
}

interface HoverGlitch {
  active: boolean; phase: number; timer: number; node: GraphNode | null
}

interface TrailParticle {
  x: number; y: number; text: string; alpha: number
  life: number; vx: number; vy: number; size: number
}

// ── Component ───────────────────────────────────────────────────────

interface Props {
  api: ApiCall
  setCnts: (c: Partial<NavCounts>) => void
  base: string
  setBase: (v: string) => void
  onNavigate: (page: PageId) => void
}

export function DashPage({ api, setCnts, base, setBase, onNavigate }: Props) {
  const [billing, setBilling]   = useState<BillingUser[]>([])
  const [bitrix, setBitrix]     = useState<BitrixUser[]>([])
  const [links, setLinks]       = useState<UserLink[]>([])
  const [loading, setLoading]   = useState(true)
  const [hovered, setHovered]   = useState<GraphNode | null>(null)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef<number | null>(null)
  const nodesRef     = useRef<GraphNode[]>([])
  const mouseRef     = useRef({ x: -999, y: -999 })
  const trailRef     = useRef<TrailParticle[]>([])
  const scanRef      = useRef<ScanState>({ target: null, phase: 'idle', progress: 0, timer: 0, nextScan: 3000 })
  const hoverGlitchRef = useRef<HoverGlitch>({ active: false, phase: 0, timer: 0, node: null })

  useEffect(() => {
    Promise.all([
      api('/api/billinguser').catch(() => ({ data: [] })),
      api('/api/bitrixuser').catch(() => ({ data: [] })),
      api('/api/userlink').catch(() => ({ data: [] })),
      api('/api/switch').catch(() => ({ data: [] })),
    ]).then(([b, bx, l, sw]) => {
      const ba  = Array.isArray(b.data)  ? (b.data  as BillingUser[]) : []
      const bxa = Array.isArray(bx.data) ? (bx.data as BitrixUser[])  : []
      const la  = Array.isArray(l.data)  ? (l.data  as UserLink[])    : []
      const swa = Array.isArray(sw.data) ? (sw.data as unknown[])     : []
      setBilling(ba); setBitrix(bxa); setLinks(la)
      setCnts({ billing: ba.length, bitrix: bxa.length, links: la.length, sw: swa.length })
      setLoading(false)
    })
  }, [api, setCnts])

  // ── Build graph once data is ready ───────────────────────────────
  useEffect(() => {
    if (loading) return
    const cv = canvasRef.current
    if (!cv) return
    const W = cv.offsetWidth, H = cv.offsetHeight
    cv.width  = W * (window.devicePixelRatio || 1)
    cv.height = H * (window.devicePixelRatio || 1)
    const ctx = cv.getContext('2d')!
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)

    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    nodes.push({ id: 'root', type: 'root', label: 'SYSTEM', x: W/2, y: H/2, r: 26, vx: 0, vy: 0, page: null })

    const maxB = Math.min(billing.length, 22)
    billing.slice(0, maxB).forEach((u, i) => {
      const ang = (-Math.PI * 0.7) + (Math.PI * 1.4) * (i / (Math.max(maxB - 1, 1)))
      const rad = 200 + Math.random() * 80
      nodes.push({
        id: 'b' + u.id, type: 'billing',
        label: u.name ?? ('B#' + u.id), sub: 'billing:' + u.billingId,
        billingId: u.billingId,
        x: W/2 + Math.cos(ang) * rad, y: H/2 + Math.sin(ang) * rad,
        r: 11, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
        page: 'billing', raw: u,
      })
      edges.push({ from: 'root', to: 'b' + u.id, color: 'rgba(234,62,42,0.25)', width: 1 })
    })

    const maxBx = Math.min(bitrix.length, 22)
    bitrix.slice(0, maxBx).forEach((u, i) => {
      const ang = (-Math.PI * 0.3) + (Math.PI * 0.6) * (i / (Math.max(maxBx - 1, 1))) + Math.PI * 0.5
      const rad = 220 + Math.random() * 80
      nodes.push({
        id: 'bx' + u.id, type: 'bitrix',
        label: u.name ?? ('BX#' + u.id), sub: 'bitrix:' + u.bitrixId,
        bitrixId: u.bitrixId,
        x: W/2 + Math.cos(ang) * rad, y: H/2 + Math.sin(ang) * rad,
        r: 11, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
        page: 'bitrix', raw: u,
      })
      edges.push({ from: 'root', to: 'bx' + u.id, color: 'rgba(234,62,42,0.15)', width: 1 })
    })

    links.forEach(l => {
      const bNode  = nodes.find(n => n.type === 'billing' && n.raw && (
        String((n.raw as BillingUser).billingId) === String(l.billingId) ||
        String(n.raw.id) === String(l.billingUserId) ||
        ((n.raw as BillingUser).name === l.billingUserName)
      ))
      const bxNode = nodes.find(n => n.type === 'bitrix' && n.raw && (
        String((n.raw as BitrixUser).bitrixId) === String(l.bitrixId) ||
        String(n.raw.id) === String(l.bitrixUserId) ||
        ((n.raw as BitrixUser).name === l.bitrixUserName)
      ))
      if (bNode && bxNode) {
        const dup = edges.find(e => e.link && ((e.from === bNode.id && e.to === bxNode.id) || (e.from === bxNode.id && e.to === bNode.id)))
        if (!dup) edges.push({
          from: bNode.id, to: bxNode.id,
          color: l.status === 'Active' ? 'rgba(0,204,85,0.65)' : 'rgba(120,120,120,0.35)',
          width: l.status === 'Active' ? 2 : 1, link: l,
        })
      }
    })

    const bNodes  = nodes.filter(n => n.type === 'billing')
    const bxNodes = nodes.filter(n => n.type === 'bitrix')
    bNodes.forEach((a, i) => bNodes.forEach((b, j) => {
      if (j <= i) return
      edges.push({ from: a.id, to: b.id, color: 'rgba(234,62,42,0.07)', width: 0.4, weak: true })
    }))
    bxNodes.forEach((a, i) => bxNodes.forEach((b, j) => {
      if (j <= i) return
      edges.push({ from: a.id, to: b.id, color: 'rgba(234,62,42,0.05)', width: 0.4, weak: true })
    }))
    bNodes.forEach(a => bxNodes.forEach(b => {
      const hasLink = edges.find(e => e.link && e.from === a.id && e.to === b.id)
      if (!hasLink) edges.push({ from: a.id, to: b.id, color: 'rgba(234,62,42,0.04)', width: 0.3, weak: true })
    }))

    nodesRef.current = nodes

    const byId: Record<string, GraphNode> = {}
    nodes.forEach(n => { byId[n.id] = n })

    function tick() {
      const mx = mouseRef.current.x, my = mouseRef.current.y
      nodes.forEach(n => {
        if (n.type === 'root') return
        nodes.forEach(m => {
          if (m.id === n.id) return
          const dx = n.x - m.x, dy = n.y - m.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist < 60) {
            const f = (60 - dist) / dist * 0.4
            n.vx += dx * f * 0.05; n.vy += dy * f * 0.05
          }
        })
        const root = byId['root']
        const dx = root.x - n.x, dy = root.y - n.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const targetDist = n.type === 'billing' ? 210 : 230
        const f = (dist - targetDist) / dist * 0.012
        n.vx += dx * f; n.vy += dy * f
        const mdx = mx - n.x, mdy = my - n.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy) || 1
        if (md < 80) { n.vx += mdx / md * 0.3; n.vy += mdy / md * 0.3 }
        n.vx *= 0.88; n.vy *= 0.88
        n.x += n.vx; n.y += n.vy
        n.x = Math.max(20, Math.min(W - 20, n.x))
        n.y = Math.max(20, Math.min(H - 20, n.y))
      })
    }

    const AC = '#EA3E2A', GR = '#00cc55'
    edges.forEach(e => {
      if (!e.cp) {
        const a = byId[e.from], b = byId[e.to]
        if (!a || !b) return
        e.cp = {
          x: (a.x + b.x) / 2 + (Math.random() - .5) * 180,
          y: (a.y + b.y) / 2 + (Math.random() - .5) * 180,
          vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
        }
      }
    })

    function draw() {
      ctx.fillStyle = 'rgba(0,0,0,0.22)'
      ctx.fillRect(0, 0, W, H)
      const t = Date.now()

      edges.forEach(e => {
        if (!e.cp) return
        const a = byId[e.from], b = byId[e.to]
        if (!a || !b) return
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        e.cp.vx += (mx - e.cp.x) * 0.003 + (Math.random() - .5) * 0.6
        e.cp.vy += (my - e.cp.y) * 0.003 + (Math.random() - .5) * 0.6
        e.cp.vx *= 0.95; e.cp.vy *= 0.95
        e.cp.x += e.cp.vx; e.cp.y += e.cp.vy
      })

      edges.forEach(e => {
        const a = byId[e.from], b = byId[e.to]
        if (!a || !b || !e.cp) return
        ctx.save()
        if (e.link) {
          const p = 0.4 + Math.sin(t / 600 + (e.link.id || 0) * 1.7) * 0.35
          if (e.link.status === 'Active') {
            ctx.strokeStyle = `rgba(0,${Math.floor(180 + p * 60)},${Math.floor(p * 60)},${0.55 + p * 0.3})`
            ctx.shadowColor = GR; ctx.shadowBlur = 5 + p * 4
          } else {
            ctx.strokeStyle = `rgba(90,90,90,${0.2 + p * 0.12})`
          }
          ctx.lineWidth = 0.8 + p
        } else {
          const p = 0.12 + Math.sin(t / 1400 + a.x * 0.008) * 0.08
          ctx.strokeStyle = `rgba(234,62,42,${p})`
          ctx.lineWidth = 0.4 + Math.random() * 0.3
        }
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(e.cp.x, e.cp.y, b.x, b.y)
        ctx.stroke()
        ctx.restore()
      })

      const trail = trailRef.current
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i]
        p.life -= 0.018; p.x += p.vx; p.y += p.vy
        if (p.life <= 0) { trail.splice(i, 1); continue }
        ctx.save()
        ctx.globalAlpha = p.life * p.alpha
        ctx.fillStyle = (p.text === 'GOD' || p.text === 'IS' || p.text === 'HERE') ? '#EA3E2A' : 'rgba(234,62,42,0.6)'
        ctx.shadowColor = '#EA3E2A'; ctx.shadowBlur = p.text.length < 5 ? 8 : 3
        ctx.font = `${p.size}px 'Share Tech Mono',monospace`
        ctx.textAlign = 'left'
        ctx.fillText(p.text, p.x, p.y)
        ctx.restore()
      }

      nodes.forEach(n => {
        const dx = mouseRef.current.x - n.x, dy = mouseRef.current.y - n.y
        const hot = Math.sqrt(dx * dx + dy * dy) < n.r + 22
        const p = Math.sin(t / 800 + n.x * 0.02 + n.y * 0.015)
        ctx.save()
        if (n.type === 'root') {
          const s = n.r + p * 3
          ctx.shadowColor = AC; ctx.shadowBlur = 12 + p * 6
          ctx.strokeStyle = AC; ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(n.x - s, n.y); ctx.lineTo(n.x + s, n.y)
          ctx.moveTo(n.x, n.y - s); ctx.lineTo(n.x, n.y + s)
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(n.x, n.y, s * 0.55, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(234,62,42,${0.35 + p * 0.2})`
          ctx.lineWidth = 0.8; ctx.stroke()
          ctx.beginPath()
          ctx.arc(n.x, n.y, s * 1.6 + p * 5, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(234,62,42,${0.06 + Math.abs(p) * 0.06})`
          ctx.lineWidth = 0.4; ctx.stroke()
        } else {
          const segs = 8
          ctx.beginPath()
          for (let i = 0; i <= segs; i++) {
            const ang = (i / segs) * Math.PI * 2
            const nr = n.r * (0.65 + Math.sin(ang * 2.7 + t / 900 + n.x * 0.04) * 0.35 + (hot ? 0.4 : 0))
            const px = n.x + Math.cos(ang) * nr, py = n.y + Math.sin(ang) * nr
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.shadowColor = hot ? AC : 'transparent'; ctx.shadowBlur = hot ? 18 : 0
          ctx.strokeStyle = hot ? AC : `rgba(234,62,42,${0.3 + p * 0.2})`
          ctx.lineWidth = hot ? 1.2 : 0.6
          ctx.fillStyle = hot ? 'rgba(234,62,42,0.12)' : 'transparent'
          ctx.fill(); ctx.stroke()
          ctx.beginPath()
          ctx.arc(n.x, n.y, hot ? 2.5 : 1.2, 0, Math.PI * 2)
          ctx.fillStyle = hot ? AC : `rgba(234,62,42,${0.45 + p * 0.3})`
          ctx.shadowColor = hot ? AC : 'transparent'; ctx.shadowBlur = hot ? 8 : 0
          ctx.fill()
        }
        if (hot || n.type === 'root') {
          ctx.shadowColor = AC; ctx.shadowBlur = 6
          ctx.fillStyle = AC
          ctx.font = '11px "Share Tech Mono",monospace'
          ctx.textAlign = 'center'; ctx.textBaseline = 'top'
          const lbl = n.label.length > 16 ? n.label.slice(0, 15) + '…' : n.label
          ctx.fillText(lbl, n.x, n.y + n.r + 10)
          if (n.sub) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '9px "Share Tech Mono",monospace'
            ctx.shadowBlur = 0
            ctx.fillText(n.sub, n.x, n.y + n.r + 24)
          }
        }
        ctx.restore()
      })

      // Scan
      const sc = scanRef.current
      if (sc.target && (sc.phase === 'scanning' || sc.phase === 'showing')) {
        const root = byId['root'], tgt = sc.target
        if (root && tgt) {
          const prog = sc.phase === 'showing' ? 1 : sc.progress
          const ex = root.x + (tgt.x - root.x) * prog
          const ey = root.y + (tgt.y - root.y) * prog
          ctx.save()
          ctx.strokeStyle = `rgba(234,62,42,${0.55 * prog})`
          ctx.lineWidth = 1; ctx.shadowColor = AC; ctx.shadowBlur = 8
          ctx.setLineDash([3, 5]); ctx.lineDashOffset = -(t / 55) % 8
          ctx.beginPath(); ctx.moveTo(root.x, root.y); ctx.lineTo(ex, ey); ctx.stroke()
          ctx.setLineDash([])
          ctx.restore()
          if (sc.phase === 'showing') {
            const fadeIn  = Math.min(1, (3500 + 2000 - sc.timer) / 280)
            const fadeOut = sc.timer < 500 ? sc.timer / 500 : 1
            const al = Math.min(fadeIn, fadeOut) * 0.93
            const glitching = fadeIn < 1
            const gox = glitching ? (Math.random() - .5) * 7 : 0
            const goy = glitching ? (Math.random() - .5) * 3 : 0
            const pw = 210, ph = 96
            let px = tgt.x + tgt.r + 20 + gox, py = tgt.y - ph / 2 + goy
            if (px + pw > W - 8) px = tgt.x - tgt.r - pw - 20 + gox
            if (py < 8) py = 8
            if (py + ph > H - 8) py = H - ph - 8
            ctx.save(); ctx.globalAlpha = al
            if (glitching) { ctx.fillStyle = 'rgba(234,62,42,0.18)'; ctx.fillRect(px + 4, py + 2, pw, ph) }
            ctx.fillStyle = 'rgba(1,1,1,0.92)'; ctx.fillRect(px, py, pw, ph)
            ctx.fillStyle = AC; ctx.fillRect(px, py, pw, 2)
            if (glitching) {
              for (let gi = 0; gi < 4; gi++) {
                ctx.fillStyle = `rgba(234,62,42,${Math.random() * 0.3})`
                ctx.fillRect(px, py + Math.random() * ph, pw, 1 + Math.random() * 2)
              }
            }
            ctx.textAlign = 'left'; ctx.textBaseline = 'top'
            ctx.fillStyle = AC; ctx.font = 'bold 9px "Silkscreen",monospace'
            ctx.shadowColor = AC; ctx.shadowBlur = 5
            ctx.fillText(tgt.type === 'billing' ? '■ BILLING_USER' : '■ BITRIX_USER', px + 10, py + 10)
            ctx.shadowBlur = 0
            ctx.fillStyle = '#f5f5f5'; ctx.font = '12px "Share Tech Mono",monospace'
            const lbl = tgt.label.length > 24 ? tgt.label.slice(0, 23) + '…' : tgt.label
            ctx.fillText(lbl, px + 10, py + 28)
            ctx.fillStyle = 'rgba(234,62,42,0.55)'; ctx.font = '9px "Share Tech Mono",monospace'
            ctx.fillText(tgt.sub ?? '', px + 10, py + 46)
            ctx.strokeStyle = 'rgba(234,62,42,0.18)'; ctx.lineWidth = 0.5
            ctx.beginPath(); ctx.moveTo(px + 10, py + 60); ctx.lineTo(px + pw - 10, py + 60); ctx.stroke()
            if (Math.sin(t / 280) > 0) { ctx.fillStyle = AC; ctx.fillRect(px + 10, py + 66, 6, 11) }
            ctx.fillStyle = 'rgba(234,62,42,0.38)'; ctx.font = '8px "Silkscreen",monospace'
            ctx.fillText('SCAN_OK //' + (tgt.page || '').toUpperCase(), px + 10, py + 80)
            ctx.restore()
          }
        }
      }

      // Hover glitch panel
      const hg = hoverGlitchRef.current
      if (hg.active && hg.node && hg.phase >= 1) {
        const n = hg.node
        const glitch = hg.timer < 180
        const al = Math.min(1, (hg.timer - 120) / 70)
        const gx = glitch ? (Math.random() - .5) * 9 : 0
        const gy = glitch ? (Math.random() - .5) * 4 : 0
        const pw = 218, ph = 102
        let px = n.x + n.r + 22 + gx, py = n.y - ph / 2 + gy
        if (px + pw > W - 8) px = n.x - n.r - pw - 22 + gx
        if (py < 8) py = 8
        if (py + ph > H - 8) py = H - ph - 8
        ctx.save(); ctx.globalAlpha = al
        if (glitch) {
          ctx.fillStyle = 'rgba(234,62,42,0.2)'; ctx.fillRect(px + 5, py - 2, pw, ph)
          ctx.fillStyle = 'rgba(0,200,255,0.1)'; ctx.fillRect(px - 3, py + 2, pw, ph)
        }
        ctx.fillStyle = 'rgba(2,2,2,0.95)'; ctx.fillRect(px, py, pw, ph)
        ctx.fillStyle = AC; ctx.fillRect(px, py, pw, 2); ctx.fillRect(px, py, 2, ph)
        if (glitch) {
          for (let gi = 0; gi < 5; gi++) {
            ctx.fillStyle = `rgba(234,62,42,${Math.random() * 0.35})`
            ctx.fillRect(px, py + Math.random() * ph, pw, 1 + Math.random() * 3)
          }
        }
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'
        ctx.fillStyle = AC; ctx.font = 'bold 9px "Silkscreen",monospace'
        ctx.shadowColor = AC; ctx.shadowBlur = 5
        ctx.fillText(n.type === 'billing' ? '■ BILLING_NODE' : '■ BITRIX_NODE', px + 10, py + 10)
        ctx.shadowBlur = 0
        ctx.fillStyle = '#ffffff'; ctx.font = '12px "Share Tech Mono",monospace'
        ctx.fillText(n.label.length > 26 ? n.label.slice(0, 25) + '…' : n.label, px + 10, py + 28)
        ctx.fillStyle = 'rgba(234,62,42,0.65)'; ctx.font = '9px "Share Tech Mono",monospace'
        ctx.fillText(n.sub ?? '', px + 10, py + 48)
        ctx.strokeStyle = 'rgba(234,62,42,0.2)'; ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(px + 10, py + 62); ctx.lineTo(px + pw - 10, py + 62); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '9px "Share Tech Mono",monospace'
        ctx.fillText('CLICK → ' + (n.page || '').toUpperCase(), px + 10, py + 70)
        ctx.fillStyle = 'rgba(234,62,42,0.3)'; ctx.font = '7px "Silkscreen",monospace'
        ctx.fillText('id:' + (n.raw?.id ?? '?') + ' type:' + n.type.toUpperCase(), px + 10, py + 86)
        ctx.restore()
      }
    }

    function updateScan(dt: number) {
      const sc = scanRef.current
      sc.nextScan -= dt
      if (sc.phase === 'idle' && sc.nextScan <= 0) {
        const candidates = nodes.filter(n => n.type !== 'root')
        if (candidates.length === 0) return
        sc.target = candidates[Math.floor(Math.random() * candidates.length)]
        sc.phase = 'scanning'; sc.progress = 0
      }
      if (sc.phase === 'scanning') {
        sc.progress += dt / 800
        if (sc.progress >= 1) { sc.progress = 1; sc.phase = 'showing'; sc.timer = 3500 + Math.random() * 2000 }
      }
      if (sc.phase === 'showing') {
        sc.timer -= dt
        if (sc.timer <= 0) { sc.phase = 'idle'; sc.target = null; sc.nextScan = 4000 + Math.random() * 6000 }
      }
    }

    function updateHoverGlitch(dt: number) {
      const hg = hoverGlitchRef.current
      const mx = mouseRef.current.x, my = mouseRef.current.y
      const hit = nodes.find(n => {
        if (n.type === 'root') return false
        const dx = mx - n.x, dy = my - n.y
        return Math.sqrt(dx * dx + dy * dy) < n.r + 22
      })
      if (hit && (!hg.active || hg.node !== hit)) {
        hg.active = true; hg.node = hit; hg.phase = 0; hg.timer = 0
      }
      if (!hit && hg.active) { hg.active = false; hg.node = null }
      if (hg.active) {
        hg.timer += dt
        if (hg.phase === 0 && hg.timer > 120) hg.phase = 1
        if (hg.phase === 1 && hg.timer > 4000) hg.phase = 0
      }
    }

    let prevT = performance.now()
    function loop() {
      const now = performance.now()
      const dt = now - prevT; prevT = now
      updateScan(dt); updateHoverGlitch(dt)
      tick(); draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [loading, billing, bitrix, links])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const cv = canvasRef.current; if (!cv) return
    const rect = cv.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const hit = nodesRef.current.find(n => {
      const dx = x - n.x, dy = y - n.y
      return Math.sqrt(dx * dx + dy * dy) < n.r + 14 && n.page
    })
    if (hit?.page) onNavigate(hit.page)
  }

  function handleMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const cv = canvasRef.current; if (!cv) return
    const rect = cv.getBoundingClientRect()
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const hit = nodesRef.current.find(n => {
      const dx = mouseRef.current.x - n.x, dy = mouseRef.current.y - n.y
      return Math.sqrt(dx * dx + dy * dy) < n.r + 14 && n.page
    })
    cv.style.cursor = hit ? 'crosshair' : 'default'
    setHovered(hit ?? null)
    const mx2 = mouseRef.current.x, my2 = mouseRef.current.y
    const nearNode = nodesRef.current.some(n => {
      const dx = mx2 - n.x, dy = my2 - n.y
      return Math.sqrt(dx * dx + dy * dy) < n.r + 55
    })
    if (!hit && !nearNode) {
      const words = ['GOD', 'IS', 'HERE']
      const word = words[Math.floor(Math.random() * 3)]
      const bin = word.split('').map(ch => ch.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
      trailRef.current.push({
        x: mouseRef.current.x + (Math.random() - .5) * 30,
        y: mouseRef.current.y + (Math.random() - .5) * 20,
        text: Math.random() < 0.3 ? word : bin,
        alpha: 0.7 + Math.random() * 0.3, life: 1.0,
        vx: (Math.random() - .5) * 0.4, vy: -0.3 - Math.random() * 0.5,
        size: Math.random() < 0.3 ? 12 : 9,
      })
      if (trailRef.current.length > 60) trailRef.current.shift()
    }
  }

  return (
    <>
      <div className="sys-card sys-urlbar">
        <span className="sys-urlbar-lbl">ENDPOINT</span>
        <input className="sys-urlbar-inp" value={base} onChange={e => setBase(e.target.value)} placeholder="http://10.251.4.199:5000" />
      </div>

      <div className="sys-stats">
        {([
          { lbl: 'Биллинг',  v: loading ? '—' : billing.length, sub: 'пользователей', c: 'var(--ac)', pg: 'billing' as PageId },
          { lbl: 'Битрикс',  v: loading ? '—' : bitrix.length,  sub: 'пользователей', c: 'var(--ac)', pg: 'bitrix'  as PageId },
          { lbl: 'Связи',    v: loading ? '—' : links.length,   sub: 'активных',      c: 'var(--gr)', pg: 'links'   as PageId },
        ]).map(s => (
          <div key={s.lbl} className="sys-stat sys-card" style={{ cursor: 'crosshair' }} onClick={() => onNavigate(s.pg)}>
            <div className="sys-stat-lbl">{s.lbl}</div>
            <div className="sys-stat-v" style={{ color: s.c }}>{s.v}</div>
            <div className="sys-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="sys-card" style={{ position: 'relative', marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 10, left: 14, fontFamily: "'Silkscreen',monospace", fontSize: '9px', color: 'var(--t3)', letterSpacing: '2px', textTransform: 'uppercase', zIndex: 2 }}>
          ENTITY_NETWORK // {loading ? 'LOADING...' : `${billing.length} BILLING · ${bitrix.length} BITRIX · ${links.length} LINKS`}
        </div>
        {hovered && (
          <div style={{ position: 'absolute', bottom: 10, right: 14, zIndex: 2, fontFamily: "'Share Tech Mono',monospace", fontSize: '11px', color: 'var(--ac)', background: 'rgba(0,0,0,0.85)', border: '1px solid currentColor', padding: '4px 10px', letterSpacing: '1px' }}>
            {hovered.label} <span style={{ color: 'var(--t3)' }}>→ {hovered.page}</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '580px', cursor: 'default' }}
          onClick={handleClick}
          onMouseMove={handleMove}
          onMouseLeave={() => { mouseRef.current = { x: -999, y: -999 }; setHovered(null) }}
        />
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Share Tech Mono',monospace", fontSize: '14px', color: 'var(--t3)', letterSpacing: '3px' }}>
            LOADING NODES...
          </div>
        )}
      </div>
    </>
  )
}

// ── Normal dashboard ────────────────────────────────────────────────

interface NDashProps {
  api: ApiCall
  setCnts: (c: Partial<NavCounts>) => void
  base: string
  setBase: (v: string) => void
}

export function NDashPage({ api, setCnts, base, setBase }: NDashProps) {
  const [billing, setBilling] = useState<BillingUser[]>([])
  const [links, setLinks]     = useState<UserLink[]>([])
  const [srchB, setSrchB]     = useState('')
  const [srchL, setSrchL]     = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api('/api/billinguser').catch(() => ({ data: [] })),
      api('/api/bitrixuser').catch(() => ({ data: [] })),
      api('/api/userlink').catch(() => ({ data: [] })),
      api('/api/switch').catch(() => ({ data: [] })),
    ]).then(([b, bx, l, sw]) => {
      const ba  = Array.isArray(b.data)  ? (b.data  as BillingUser[]) : []
      const bxa = Array.isArray(bx.data) ? (bx.data as BitrixUser[])  : []
      const la  = Array.isArray(l.data)  ? (l.data  as UserLink[])    : []
      const swa = Array.isArray(sw.data) ? (sw.data as unknown[])     : []
      setBilling(ba); setLinks(la)
      setCnts({ billing: ba.length, bitrix: bxa.length, links: la.length, sw: swa.length })
      setLoading(false)
    })
  }, [api, setCnts])

  const fb = billing.filter(u => (u.name ?? '').toLowerCase().includes(srchB.toLowerCase()) || String(u.billingId ?? '').includes(srchB) || String(u.id ?? '').includes(srchB))
  const fl = links.filter(l => (l.billingUserName ?? '').toLowerCase().includes(srchL.toLowerCase()) || (l.bitrixUserName ?? '').toLowerCase().includes(srchL.toLowerCase()) || String(l.billingId ?? '').includes(srchL) || String(l.bitrixId ?? '').includes(srchL))

  return (
    <>
      <div className="card url-bar">
        <span className="url-lbl">Адрес API</span>
        <input className="url-inp" value={base} onChange={e => setBase(e.target.value)} placeholder="http://10.251.4.199:5000" />
      </div>
      <div className="stats-grid">
        {([
          { lbl: 'Пользователи Биллинга', v: loading ? '—' : billing.length, sub: 'записей',  c: 'var(--ac)' },
          { lbl: 'Связи пользователей',   v: loading ? '—' : links.length,   sub: 'активных', c: 'var(--gr)' },
          { lbl: 'Всего сущностей',       v: loading ? '—' : billing.length + links.length, sub: 'итого', c: '#6366f1' },
        ]).map(s => (
          <div key={s.lbl} className="stat-card card">
            <div className="stat-blob" />
            <div className="stat-lbl">{s.lbl}</div>
            <div className="stat-v" style={{ color: s.c }}>{s.v}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div>
          <div className="sec-head">
            <div><div className="sec-title">Пользователи Биллинга</div><div className="sec-sub">GET /api/billinguser</div></div>
            <div className="sw"><span className="si"><ISearch /></span><input className="sinp" placeholder="Поиск..." value={srchB} onChange={e => setSrchB(e.target.value)} /></div>
          </div>
          <div className="tw card"><div className="ts"><table>
            <thead><tr><th>ID</th><th>Billing ID</th><th>Имя</th></tr></thead>
            <tbody>
              {fb.slice(0, 8).map(u => (
                <tr key={u.id}>
                  <td className="mono" style={{ color: 'var(--t3)' }}>#{u.id}</td>
                  <td className="mono" style={{ color: 'var(--ac)' }}>{u.billingId ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>{u.name ?? '—'}</td>
                </tr>
              ))}
              {!loading && fb.length === 0 && <tr><td colSpan={3}><div className="empty"><div className="empty-title">Нет данных</div></div></td></tr>}
            </tbody>
          </table></div></div>
        </div>
        <div>
          <div className="sec-head">
            <div><div className="sec-title">Связи пользователей</div><div className="sec-sub">GET /api/userlink</div></div>
            <div className="sw"><span className="si"><ISearch /></span><input className="sinp" placeholder="Поиск..." value={srchL} onChange={e => setSrchL(e.target.value)} /></div>
          </div>
          <div className="tw card"><div className="ts"><table>
            <thead><tr><th>Биллинг</th><th>Битрикс</th><th>Статус</th></tr></thead>
            <tbody>
              {fl.slice(0, 8).map(l => (
                <tr key={l.id}>
                  <td><div className="un">{l.billingUserName ?? '—'}</div><div className="us">id: {l.billingId ?? '—'}</div></td>
                  <td><div className="un">{l.bitrixUserName ?? '—'}</div><div className="us">id: {l.bitrixId ?? '—'}</div></td>
                  <td><SChip s={l.status} /></td>
                </tr>
              ))}
              {!loading && fl.length === 0 && <tr><td colSpan={3}><div className="empty"><div className="empty-title">Нет данных</div></div></td></tr>}
            </tbody>
          </table></div></div>
        </div>
      </div>
    </>
  )
}
