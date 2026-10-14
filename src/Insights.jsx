import { useEffect, useState } from 'react'
import { MountainLake, ForestMist, Glacier, Spring } from './NatureArt.jsx'

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Demo readings that drift slowly, like a live water-quality sensor.
export function useReadings() {
  const [r, setR] = useState({ temp: 14.2, purity: 99.2, ph: 7.4, tds: 42 })
  useEffect(() => {
    const t = setInterval(() => {
      setR((p) => ({
        temp: +clamp(p.temp + (Math.random() - 0.5) * 0.3, 13.6, 14.9).toFixed(1),
        purity: +clamp(p.purity + (Math.random() - 0.5) * 0.12, 99, 99.6).toFixed(1),
        ph: +clamp(p.ph + (Math.random() - 0.5) * 0.1, 7.2, 7.6).toFixed(1),
        tds: Math.round(clamp(p.tds + (Math.random() - 0.5) * 3, 38, 46)),
      }))
    }, 3000)
    return () => clearInterval(t)
  }, [])
  return r
}

export function Hero({ r }) {
  return (
    <section className="hero">
      <MountainLake className="hero-art" />
      <div className="hero-copy">
        <h1>Purified Drinking Water</h1>
        <p>Fill a can, tell us how much you need, and we bring it over.</p>
      </div>
      <div className="hero-stats">
        <div className="glass stat">
          <span>Source temperature</span>
          <strong>
            {r.temp}
            <small>°C</small>
          </strong>
        </div>
        <div className="glass stat">
          <span>Purity</span>
          <strong>
            {r.purity}
            <small>%</small>
          </strong>
        </div>
        <div className="glass stat">
          <span>pH level</span>
          <strong>{r.ph}</strong>
        </div>
        <div className="glass stat">
          <span>Dissolved solids</span>
          <strong>
            {r.tds}
            <small> ppm</small>
          </strong>
        </div>
      </div>
    </section>
  )
}

function Photo({ Scene, title, value, note }) {
  return (
    <div className="tile photo-tile">
      <Scene className="photo-art" />
      <div className="photo-cap glass">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  )
}

const smooth = (pts) =>
  pts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`
      const [px, py] = pts[i - 1]
      const mx = (px + x) / 2
      return `C ${mx} ${py}, ${mx} ${y}, ${x} ${y}`
    })
    .join(' ')

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const SUPPLY = [120, 180, 150, 220, 170, 260, 200]
const STAGES = ['Sediment filter', 'Activated carbon', 'RO membrane', 'UV sterilisation']

export function Insights({ r }) {
  const C = 2 * Math.PI * 52
  const series = [98.9, 99.1, 99.0, 99.3, 99.2, 99.4, r.purity]
  const pts = series.map((v, i) => [20 + i * 60, 120 - ((v - 98.8) / 0.8) * 95])
  const line = smooth(pts)
  const area = `${line} L ${pts[pts.length - 1][0]} 130 L ${pts[0][0]} 130 Z`
  const maxSupply = Math.max(...SUPPLY)

  return (
    <section className="insights" aria-label="Water quality">
      <Photo Scene={Glacier} title="Glacier source" value="6.1°C" note="Meltwater intake" />

      <div className="tile ring-tile">
        <h3>Purity today</h3>
        <svg viewBox="0 0 140 140" className="ring" role="img" aria-label={`Purity ${r.purity} percent`}>
          <circle cx="70" cy="70" r="52" fill="none" stroke="#DCE6E1" strokeWidth="14" />
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            stroke="#5E9C88"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(r.purity / 100) * C} ${C}`}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dasharray .8s ease' }}
          />
          <text x="70" y="68" textAnchor="middle" className="ring-num">
            {r.purity}%
          </text>
          <text x="70" y="88" textAnchor="middle" className="ring-sub">
            pure
          </text>
        </svg>
        <div className="pill-row">
          <span className="pill">pH {r.ph}</span>
          <span className="pill">{r.tds} ppm</span>
        </div>
      </div>

      <div className="tile trend-tile">
        <h3>Purity this week</h3>
        <svg viewBox="0 0 400 150" className="trend" role="img" aria-label="Purity over the last seven days">
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5E9C88" stopOpacity=".35" />
              <stop offset="1" stopColor="#5E9C88" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[30, 70, 110].map((y) => (
            <line key={y} x1="10" x2="390" y1={y} y2={y} stroke="#D5DDD8" strokeDasharray="4 6" />
          ))}
          <path d={area} fill="url(#trend-fill)" />
          <path d={line} fill="none" stroke="#2F6F62" strokeWidth="3" strokeLinecap="round" />
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3} fill="#fff" stroke="#2F6F62" strokeWidth="2.5" />
          ))}
          {DAYS.map((d, i) => (
            <text key={i} x={20 + i * 60} y="146" textAnchor="middle" className="axis">
              {d}
            </text>
          ))}
        </svg>
      </div>

      <Photo Scene={ForestMist} title="Pine forest spring" value="99.4%" note="Best purity this week" />

      <div className="tile stages-tile">
        <h3>Purification stages</h3>
        <ul className="stages">
          {STAGES.map((s) => (
            <li key={s}>
              <span className="tick" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5 10 17.5 19 7" />
                </svg>
              </span>
              <span>{s}</span>
              <small>Passed</small>
            </li>
          ))}
        </ul>
      </div>

      <div className="tile bars-tile">
        <h3>Litres supplied this week</h3>
        <div className="bars" role="img" aria-label="Litres supplied each day">
          {SUPPLY.map((v, i) => (
            <div key={i} className="bar-col">
              <div className="bar" style={{ height: `${(v / maxSupply) * 82}%` }} title={`${v} L`} />
              <span>{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <Photo Scene={Spring} title="Highland spring" value="42 ppm" note="Dissolved solids" />
    </section>
  )
}
