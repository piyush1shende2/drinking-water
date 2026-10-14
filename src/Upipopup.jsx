import { useEffect } from 'react'

const INK = '#0B2B3C'
const N = 21 // QR grid size
const COLORS = ['#1E3640', '#2F6F62', '#1672B5']

// Fixed pseudo-random pattern: it only looks like a QR code, it is not a real one.
function makeCells() {
  let s = 20261012
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  const cells = []
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inFinder = (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)
      const inLogo = Math.abs(x - 10) <= 3 && Math.abs(y - 10) <= 3
      if (inFinder || inLogo) continue
      if (rnd() > 0.5) cells.push({ x, y })
    }
  }
  return cells
}
const CELLS = makeCells()

function Finder({ ox, oy }) {
  return (
    <g>
      <rect x={ox + 1.35} y={oy + 1.35} width="6.3" height="6.3" rx="1.7" fill="#fff" stroke={INK} strokeWidth=".7" />
      <rect x={ox + 3} y={oy + 3} width="3" height="3" rx="1" fill="#2AA1E0" stroke={INK} strokeWidth=".5" />
      <circle cx={ox + 4} cy={oy + 4.3} r=".42" fill="#fff" />
      <circle cx={ox + 5} cy={oy + 4.3} r=".42" fill="#fff" />
      <circle cx={ox + 4.05} cy={oy + 4.35} r=".2" fill={INK} />
      <circle cx={ox + 5.05} cy={oy + 4.35} r=".2" fill={INK} />
      <path d={`M ${ox + 4} ${oy + 5.2} q .5 .45 1 0`} fill="none" stroke={INK} strokeWidth=".25" strokeLinecap="round" />
    </g>
  )
}

export default function UpiPopup({ amount, onOk, onCancel }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="upi-backdrop" onClick={onCancel}>
      <div
        className="upi-card"
        role="dialog"
        aria-modal="true"
        aria-label="Pay with UPI"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Scan &amp; pay</h2>
        <p className="upi-amount">{amount}</p>

        <svg className="upi-qr" viewBox={`0 0 ${N + 2} ${N + 2}`} role="img" aria-label="Dummy QR code">
          <rect x=".2" y=".2" width={N + 1.6} height={N + 1.6} rx="2" fill="#fff" stroke={INK} strokeWidth=".45" />
          {CELLS.map(({ x, y }) => (
            <rect
              key={`${x}-${y}`}
              x={x + 1.06}
              y={y + 1.06}
              width=".88"
              height=".88"
              rx=".3"
              fill={COLORS[(x * 3 + y) % 3]}
            />
          ))}
          <Finder ox={0} oy={0} />
          <Finder ox={N - 7} oy={0} />
          <Finder ox={0} oy={N - 7} />
          <circle cx="11.5" cy="11.5" r="3" fill="#fff" stroke={INK} strokeWidth=".5" />
          <path
            d="M 11.5 9.5 C 12.9 11 13.4 11.8 13.4 12.6 a 1.9 1.9 0 0 1 -3.8 0 c 0 -.8 .5 -1.6 1.9 -3.1 z"
            fill="#2AA1E0"
            stroke={INK}
            strokeWidth=".4"
            strokeLinejoin="round"
          />
        </svg>

        <p className="upi-note">Demo QR only. Nothing is charged.</p>
        <button type="button" className="btn btn-go btn-wide" onClick={onOk} autoFocus>
          OK
        </button>
      </div>
    </div>
  )
}