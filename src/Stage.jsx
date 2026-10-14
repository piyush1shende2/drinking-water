import { useEffect, useRef, useState } from 'react'

const INK = '#0B2B3C'
const COPPER = '#B9722F'
const COPPER_DARK = '#8A5220'

// Cans (w / h are drawing sizes in SVG units)
const CANS = [
  { id: 2, liters: 2, w: 58, h: 84 },
  { id: 5, liters: 5, w: 78, h: 114 },
  { id: 10, liters: 10, w: 100, h: 146 },
]

const TANK = { x: 40, y: 50, w: 300, h: 180 }
const PODIUM = { x: 470, y: 520 } // bottom-centre of a can sitting on the podium
const SHELF = { x: 175, y: 684 } // bottom-centre of the can shown on the shelf
const SPOUT_Y = 362
const FLOW_LPS = 2.5 // litres per second out of the tap
const TANK_LITERS = 300
const SNAP_DISTANCE = 85

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const fmtL = (v) => {
  const r = Math.round(v * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}
const WAVE = 'M 10 0 q 12.5 -9 25 0' + ' t 25 0'.repeat(15) + ' V 60 H 10 Z'

function CanShape({ can, fill, filling }) {
  const { w, h, liters, id } = can
  const hw = w / 2
  const level = fill / liters
  const clipId = `can-clip-${id}`
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={-hw} y={-h} width={w} height={h} rx="14" />
        </clipPath>
      </defs>
      {/* side handle */}
      <path
        d={`M ${hw - 2} ${-h + 16} h 14 q 8 0 8 8 v 18 q 0 8 -8 8 h -14`}
        fill="none"
        stroke={INK}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* neck + opening */}
      <rect x="-14" y={-h - 12} width="28" height="16" rx="4" fill="#D8E9F0" stroke={INK} strokeWidth="3" />
      <ellipse cx="0" cy={-h - 12} rx="14" ry="4" fill="#0F3A50" stroke={INK} strokeWidth="2" />
      {/* body */}
      <rect x={-hw} y={-h} width={w} height={h} rx="14" fill="#EAF7FD" fillOpacity="0.9" />
      <g clipPath={`url(#${clipId})`}>
        <rect
          className="can-water"
          x={-hw}
          y={-h}
          width={w}
          height={h}
          fill="url(#water-grad)"
          style={{
            transform: `scaleY(${level})`,
            transition: filling ? 'transform .12s linear' : 'transform .8s ease',
          }}
        />
      </g>
      <rect x={-hw} y={-h} width={w} height={h} rx="14" fill="none" stroke={INK} strokeWidth="4" />
      <rect x={-hw + 9} y={-h + 16} width="7" height={h - 44} rx="3.5" fill="#fff" opacity="0.55" />
      <text x="0" y={-h / 2 + 7} textAnchor="middle" className="can-label">
        {liters} L
      </text>
    </g>
  )
}

// onFill(text): called while a can fills, so the litres box can follow it.
// releaseKey: when it changes, the can on the podium goes back to the shelf, empty.
export default function Stage({ onFill, releaseKey = 0 }) {
  const svgRef = useRef(null)
  const valveRef = useRef(false)
  const resumeRef = useRef(false) // tap was running when the can was lifted
  const dockedRef = useRef(null)
  const fillsRef = useRef({ 2: 0, 5: 0, 10: 0 })
  const tankRef = useRef(1)
  const refillingRef = useRef(false)
  const endYRef = useRef(PODIUM.y - 2)
  const hintTimer = useRef(null)
  const onFillRef = useRef(onFill)
  onFillRef.current = onFill
  const lastReported = useRef('')
  const firstRelease = useRef(true)

  const [fills, setFills] = useState(fillsRef.current)
  const [tank, setTank] = useState(1)
  const [refilling, setRefilling] = useState(false)
  const [valveOpen, setValveOpen] = useState(false)
  const [dockedId, setDockedId] = useState(null)
  const [selIndex, setSelIndex] = useState(0)
  const [drag, setDrag] = useState(null) // { id, x, y, near }
  const [swipeDx, setSwipeDx] = useState(0)
  const [spinKey, setSpinKey] = useState(0)
  const [spinDir, setSpinDir] = useState(1)
  const [hint, setHint] = useState('')

  const setValve = (v) => {
    valveRef.current = v
    setValveOpen(v)
  }

  const flash = (msg) => {
    setHint(msg)
    clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(''), 2600)
  }

  useEffect(() => () => clearTimeout(hintTimer.current), [])

  // The litres number was edited by the user: tap off, can back to the shelf, emptied.
  useEffect(() => {
    if (firstRelease.current) {
      firstRelease.current = false
      return
    }
    const id = dockedRef.current
    if (id === null) return
    resumeRef.current = false
    setValve(false)
    dockedRef.current = null
    setDockedId(null)
    lastReported.current = ''
    fillsRef.current = { ...fillsRef.current, [id]: 0 }
    setFills(fillsRef.current)
    setSelIndex(CANS.findIndex((c) => c.id === id))
  }, [releaseKey])

  // ---- water flow simulation -------------------------------------------
  useEffect(() => {
    if (!valveOpen && !refilling) return undefined
    let raf
    let last = performance.now()

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      if (refillingRef.current) {
        tankRef.current = Math.min(1, tankRef.current + dt * 0.25)
        setTank(tankRef.current)
        if (tankRef.current >= 1) {
          refillingRef.current = false
          setRefilling(false)
          return
        }
      } else if (valveRef.current) {
        const litres = FLOW_LPS * dt
        const id = dockedRef.current
        let used = litres
        if (id !== null) {
          const cap = CANS.find((c) => c.id === id).liters
          const cur = fillsRef.current[id]
          const next = Math.min(cap, cur + litres)
          used = next - cur
          fillsRef.current = { ...fillsRef.current, [id]: next }
          setFills(fillsRef.current)
          const txt = fmtL(next)
          if (txt !== '0' && txt !== lastReported.current) {
            lastReported.current = txt
            if (onFillRef.current) onFillRef.current(txt)
          }
          if (next >= cap) setValve(false) // can is full: tap closes itself
        }
        tankRef.current = Math.max(0, tankRef.current - used / TANK_LITERS)
        setTank(tankRef.current)
        if (tankRef.current <= 0) {
          setValve(false)
          refillingRef.current = true
          setRefilling(true)
        }
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [valveOpen, refilling])

  // ---- helpers -----------------------------------------------------------
  const docked = dockedId !== null ? CANS.find((c) => c.id === dockedId) : null
  const dockedFull = docked ? fills[docked.id] >= docked.liters - 0.001 : false
  const flowing = valveOpen && !refilling && tank > 0 && !dockedFull
  if (flowing) endYRef.current = docked ? PODIUM.y - docked.h - 12 : PODIUM.y - 2
  const endY = endYRef.current

  const toSvg = (e) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: p.x, y: p.y }
  }

  const nextFreeIndex = (from, dir, blockedId) => {
    for (let k = 1; k <= CANS.length; k++) {
      const idx = (from + dir * k + CANS.length * CANS.length) % CANS.length
      if (CANS[idx].id !== blockedId) return idx
    }
    return from
  }

  const rotateShelf = (dir) => {
    setSelIndex((cur) => nextFreeIndex(cur, dir, dockedRef.current))
    setSpinDir(dir)
    setSpinKey((k) => k + 1)
  }

  const poseOf = (can, i) => {
    if (drag && drag.id === can.id) return { x: drag.x, y: drag.y, r: 0, s: 1.05, o: 1 }
    if (dockedId === can.id) return { x: PODIUM.x, y: PODIUM.y, r: 0, s: 1, o: 1 }
    const off = (i - selIndex + CANS.length) % CANS.length
    if (off === 0) return { x: SHELF.x + swipeDx, y: SHELF.y, r: swipeDx * 0.15, s: 1, o: 1 }
    return off === 1
      ? { x: SHELF.x + 200, y: SHELF.y - 14, r: 38, s: 0.7, o: 0 }
      : { x: SHELF.x - 200, y: SHELF.y - 14, r: -38, s: 0.7, o: 0 }
  }

  // ---- tap ---------------------------------------------------------------
  const toggleValve = () => {
    resumeRef.current = false
    setValve(!valveRef.current)
  }

  // ---- dragging a can ----------------------------------------------------
  const startCanDrag = (e, can, index) => {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    const start = toSvg(e)
    const base = poseOf(can, index)
    const offX = start.x - base.x
    const offY = start.y - base.y

    // lifting the can off the podium: switch the tap off, like in real life
    if (dockedRef.current === can.id) {
      resumeRef.current = valveRef.current
      setValve(false)
      dockedRef.current = null
      setDockedId(null)
      lastReported.current = ''
    }

    setDrag({ id: can.id, x: base.x, y: base.y, near: false })

    const spot = (ev) => {
      const p = toSvg(ev)
      const x = p.x - offX
      const y = p.y - offY
      return { x, y, near: Math.hypot(x - PODIUM.x, y - PODIUM.y) < SNAP_DISTANCE }
    }
    const move = (ev) => {
      const s = spot(ev)
      setDrag({ id: can.id, x: s.x, y: s.y, near: s.near })
    }
    const up = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      const s = spot(ev)
      setDrag(null)
      if (s.near && dockedRef.current === null) {
        dockedRef.current = can.id
        setDockedId(can.id)
        lastReported.current = ''
        setSelIndex((cur) => (CANS[cur].id === can.id ? nextFreeIndex(cur, 1, can.id) : cur))
        if (resumeRef.current) {
          resumeRef.current = false
          setValve(true) // tap carries on with the new can
        }
      } else {
        if (s.near) flash('The podium is taken. Lift the can on it first.')
        setSelIndex(index)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  // ---- swiping the shelf to pick another can ----------------------------
  const startSwipe = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    const x0 = toSvg(e).x
    const move = (ev) => setSwipeDx(clamp(toSvg(ev).x - x0, -120, 120))
    const up = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      const dx = toSvg(ev).x - x0
      setSwipeDx(0)
      if (dx < -45) rotateShelf(1)
      else if (dx > 45) rotateShelf(-1)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fn()
    }
  }

  // ---- caption -----------------------------------------------------------
  let caption = 'Drag the can onto the podium. Swipe the shelf to switch cans.'
  if (hint) caption = hint
  else if (drag) caption = drag.near ? 'Let go to place the can.' : 'Move it over the podium.'
  else if (refilling) caption = 'The tank ran dry. Refilling it now.'
  else if (valveOpen && !docked) caption = 'The tap is running with no can under it. Water is going to waste.'
  else if (docked && flowing) caption = 'Filling the can.'
  else if (docked && dockedFull) caption = 'The can is full. Swap it for another one.'
  else if (docked) caption = 'Can in place. Click the tap wheel to start filling.'

  const order = CANS.map((can, i) => ({ can, i })).sort(
    (a, b) => (drag?.id === a.can.id) - (drag?.id === b.can.id),
  )

  return (
    <div className="stage">
      <svg
        ref={svgRef}
        className="stage-svg"
        viewBox="0 0 640 760"
        role="group"
        aria-label="Water tank, tap, podium and water cans"
      >
        <defs>
          <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6FD0F7" />
            <stop offset="1" stopColor="#1F83C8" />
          </linearGradient>
          <clipPath id="tank-clip">
            <rect x={TANK.x} y={TANK.y} width={TANK.w} height={TANK.h} rx="18" />
          </clipPath>
        </defs>

        {/* ---------- tank ---------- */}
        <text x={TANK.x} y={TANK.y - 14} className="svg-label">
          Water tank · {Math.round(tank * 100)}%{refilling ? ' · refilling' : ''}
        </text>
        <rect x={TANK.x} y={TANK.y} width={TANK.w} height={TANK.h} rx="18" fill="#F4FBFF" />
        <g clipPath="url(#tank-clip)">
          <g className="tank-water" style={{ transform: `translateY(${(1 - tank) * TANK.h + 10}px)` }}>
            <rect x={TANK.x} y={TANK.y} width={TANK.w} height={TANK.h + 20} fill="url(#water-grad)" />
            <g transform={`translate(${TANK.x - 10} ${TANK.y})`}>
              <path className="wave" d={WAVE} fill="#8EDBFA" />
            </g>
          </g>
          {[1, 2, 3].map((i) => (
            <line
              key={i}
              x1={TANK.x + i * 75}
              x2={TANK.x + i * 75}
              y1={TANK.y}
              y2={TANK.y + TANK.h}
              stroke="#fff"
              strokeOpacity="0.28"
              strokeWidth="3"
            />
          ))}
        </g>
        <rect x={TANK.x} y={TANK.y} width={TANK.w} height={TANK.h} rx="18" fill="none" stroke={INK} strokeWidth="4" />

        {/* ---------- pipe ---------- */}
        <path d="M110 228 V300 H470 V350" fill="none" stroke={COPPER} strokeWidth="20" strokeLinejoin="round" />
        <path
          d="M110 228 V262"
          fill="none"
          stroke="#8EDBFA"
          strokeWidth="9"
          style={{ opacity: tank > 0 ? 1 : 0, transition: 'opacity .3s' }}
        />
        <path
          className="pipe-flow"
          d="M110 262 V300 H470 V352"
          strokeDasharray="14 10"
          strokeLinejoin="round"
          style={{ opacity: flowing ? 1 : 0 }}
        />
        <rect x="452" y="346" width="36" height="16" rx="4" fill={INK} />

        {/* ---------- tap (valve) ---------- */}
        <rect x="92" y="252" width="36" height="32" rx="6" fill={COPPER_DARK} />
        <g
          className="valve"
          role="button"
          tabIndex={0}
          aria-pressed={valveOpen}
          aria-label={valveOpen ? 'Tap is open. Click to close.' : 'Tap is closed. Click to open.'}
          onClick={toggleValve}
          onKeyDown={onKey(toggleValve)}
        >
          <circle className="valve-hit" cx="110" cy="268" r="32" fill="transparent" />
          <g className="wheel" style={{ transform: `rotate(${valveOpen ? 270 : 0}deg)`, transformOrigin: '110px 268px' }}>
            <circle
              cx="110"
              cy="268"
              r="24"
              fill="#fff"
              fillOpacity="0.94"
              stroke={valveOpen ? '#1E9E6A' : '#D6483C'}
              strokeWidth="5"
              style={{ transition: 'stroke .3s' }}
            />
            {[0, 45, 90, 135].map((a) => (
              <line
                key={a}
                x1="110"
                y1="245"
                x2="110"
                y2="291"
                stroke={INK}
                strokeWidth="5"
                strokeLinecap="round"
                transform={`rotate(${a} 110 268)`}
              />
            ))}
            <circle cx="110" cy="268" r="6" fill={INK} />
          </g>
        </g>
        <text x="152" y="266" className="svg-label">
          Tap {valveOpen ? 'open' : 'closed'}
        </text>
        <text x="152" y="284" className="svg-sub">
          click the wheel to turn it
        </text>

        {/* ---------- stream ---------- */}
        <line
          x1="470"
          x2="470"
          y1={SPOUT_Y}
          y2={endY}
          stroke="#6FD0F7"
          strokeWidth="9"
          strokeLinecap="round"
          style={{
            transform: `scaleY(${flowing ? 1 : 0})`,
            transformOrigin: flowing ? `470px ${SPOUT_Y}px` : `470px ${endY}px`,
            transition: 'transform .25s ease-in',
          }}
        />
        <g style={{ opacity: flowing ? 1 : 0, transition: 'opacity .2s' }}>
          <line
            className="stream-sheen"
            x1="470"
            x2="470"
            y1={SPOUT_Y}
            y2={endY}
            stroke="#fff"
            strokeOpacity="0.75"
            strokeWidth="2.5"
            strokeDasharray="8 12"
          />
          <ellipse className="ripple" cx="470" cy={endY} rx="14" ry="4" fill="none" stroke="#fff" strokeWidth="2" />
        </g>

        {/* ---------- podium ---------- */}
        <ellipse
          className={`drop-zone ${drag ? 'show' : ''} ${drag?.near ? 'near' : ''}`}
          cx={PODIUM.x}
          cy={PODIUM.y - 4}
          rx="72"
          ry="12"
        />
        <rect x={PODIUM.x - 75} y={PODIUM.y} width="150" height="16" rx="5" fill={INK} />
        <path d={`M ${PODIUM.x - 52} ${PODIUM.y + 16} h 104 l 14 56 h -132 z`} fill="#17465E" />
        <rect x={PODIUM.x - 66} y={PODIUM.y + 72} width="132" height="9" rx="3" fill={INK} />
        <text x={PODIUM.x} y={PODIUM.y + 108} textAnchor="middle" className="svg-label">
          {docked
            ? `${docked.liters} L can · ${fills[docked.id].toFixed(1)} / ${docked.liters} L`
            : 'Podium'}
        </text>

        {/* ---------- shelf ---------- */}
        <rect className="shelf-zone" x="30" y="596" width="290" height="140" rx="22" onPointerDown={startSwipe} style={{ touchAction: 'none' }} />
        <ellipse cx={SHELF.x} cy={SHELF.y + 12} rx="112" ry="22" fill="#0F3A50" pointerEvents="none" />
        <ellipse cx={SHELF.x} cy={SHELF.y + 4} rx="108" ry="18" fill="#1F5F7F" pointerEvents="none" />
        <ellipse
          key={spinKey}
          className={`turntable-ring ${spinKey ? (spinDir > 0 ? 'spin-l' : 'spin-r') : ''}`}
          cx={SHELF.x}
          cy={SHELF.y + 4}
          rx="92"
          ry="13"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.5"
          strokeWidth="3"
          strokeDasharray="16 14"
          pointerEvents="none"
        />
        <g
          className="arrow"
          role="button"
          tabIndex={0}
          aria-label="Previous can"
          onClick={() => rotateShelf(-1)}
          onKeyDown={onKey(() => rotateShelf(-1))}
        >
          <circle cx="50" cy="690" r="17" />
          <path d="M54 682 L46 690 L54 698" />
        </g>
        <g
          className="arrow"
          role="button"
          tabIndex={0}
          aria-label="Next can"
          onClick={() => rotateShelf(1)}
          onKeyDown={onKey(() => rotateShelf(1))}
        >
          <circle cx="300" cy="690" r="17" />
          <path d="M296 682 L304 690 L296 698" />
        </g>

        {/* ---------- cans ---------- */}
        {order.map(({ can, i }) => {
          const p = poseOf(can, i)
          const isDragging = drag?.id === can.id
          return (
            <g
              key={can.id}
              className={`can ${isDragging ? 'dragging' : ''}`}
              style={{
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) scale(${p.s})`,
                opacity: p.o,
                pointerEvents: p.o ? 'auto' : 'none',
                touchAction: 'none',
              }}
              onPointerDown={(e) => startCanDrag(e, can, i)}
            >
              <CanShape can={can} fill={fills[can.id]} filling={flowing && dockedId === can.id} />
            </g>
          )
        })}
      </svg>
      <p className="stage-caption" aria-live="polite">
        {caption}
      </p>
    </div>
  )
}