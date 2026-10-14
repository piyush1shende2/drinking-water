import { useEffect, useState } from 'react'

const INK = '#0B2B3C'
const SKIN = '#E8B48A'
const UNIFORM = '#1B7FB8'

// Whole animation runs on a 10 second timeline (see App.css, "delivery scene").
export default function DeliveryScene({ onReorder }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 10200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="deliver-overlay" role="dialog" aria-modal="true" aria-label="Water delivery">
      <svg className="deliver-svg" viewBox="0 0 900 440">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#CDE9F5" />
            <stop offset="1" stopColor="#F4FAFB" />
          </linearGradient>
          <linearGradient id="scene-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6FD0F7" />
            <stop offset="1" stopColor="#1F83C8" />
          </linearGradient>
          <clipPath id="bucket-clip">
            <path d="M -32 -26 H 32 L 25 26 H -25 Z" />
          </clipPath>
        </defs>

        {/* backdrop */}
        <rect width="900" height="440" fill="url(#sky)" />
        <circle cx="110" cy="82" r="34" fill="#FFE29A" />
        <rect y="392" width="900" height="48" fill="#BFD8C9" />

        {/* ---------------- delivery person ---------------- */}
        <g className="guy-move">
          <g className="guy-fade">
            <ellipse cx="0" cy="394" rx="46" ry="6" fill="rgba(11,43,60,.18)" />

            {/* legs */}
            <g className="leg leg-a" style={{ transformOrigin: '-10px 276px' }}>
              <line x1="-10" y1="276" x2="-10" y2="386" stroke="#17465E" strokeWidth="15" strokeLinecap="round" />
              <ellipse cx="-4" cy="389" rx="15" ry="6" fill={INK} />
            </g>
            <g className="leg leg-b" style={{ transformOrigin: '10px 276px' }}>
              <line x1="10" y1="276" x2="10" y2="386" stroke="#17465E" strokeWidth="15" strokeLinecap="round" />
              <ellipse cx="16" cy="389" rx="15" ry="6" fill={INK} />
            </g>

            <g className="guy-upper">
              {/* far arm */}
              <line x1="-24" y1="196" x2="-30" y2="262" stroke={UNIFORM} strokeWidth="13" strokeLinecap="round" />
              <circle cx="-30" cy="266" r="7" fill={SKIN} />

              {/* torso */}
              <rect x="-25" y="188" width="50" height="94" rx="15" fill={UNIFORM} />
              <rect x="-25" y="236" width="50" height="8" fill="#fff" opacity=".35" />

              {/* head */}
              <circle cx="0" cy="160" r="24" fill={SKIN} />
              <circle cx="11" cy="157" r="2.8" fill={INK} />
              <path d="M 6 170 q 7 6 14 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M -25 156 a 25 25 0 0 1 50 0 z" fill={INK} />
              <rect x="10" y="150" width="30" height="7" rx="3.5" fill={INK} />

              {/* carrying arm + bucket */}
              <g className="arm-carry" style={{ transformOrigin: '24px 192px' }}>
                <line x1="24" y1="192" x2="24" y2="250" stroke={UNIFORM} strokeWidth="14" strokeLinecap="round" />
                <line x1="24" y1="248" x2="24" y2="310.4" stroke={SKIN} strokeWidth="11" strokeLinecap="round" />
                <g className="bucket">
                  <path d="M -32 -26 H 32 L 25 26 H -25 Z" fill="#E9F2F6" />
                  <g clipPath="url(#bucket-clip)">
                    <rect
                      className="bucket-water"
                      x="-32"
                      y="-26"
                      width="64"
                      height="52"
                      fill="url(#scene-water)"
                    />
                  </g>
                  <path
                    d="M -32 -26 H 32 L 25 26 H -25 Z"
                    fill="none"
                    stroke={INK}
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  <path d="M -32 -26 Q 0 -70 32 -26" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
                </g>
                <circle cx="24" cy="310.4" r="8" fill={SKIN} />
              </g>
            </g>
          </g>
        </g>

        {/* ---------------- the customer ---------------- */}
        <ellipse cx="720" cy="394" rx="96" ry="7" fill="rgba(11,43,60,.18)" />

        {/* legs: they swing outward as the tummy fills */}
        <g className="user-leg user-leg-l" style={{ transformOrigin: '708px 274px' }}>
          <line x1="708" y1="274" x2="708" y2="392" stroke="#2F3E63" strokeWidth="16" strokeLinecap="round" />
          <ellipse cx="703" cy="389" rx="18" ry="7" fill={INK} />
        </g>
        <g className="user-leg user-leg-r" style={{ transformOrigin: '732px 274px' }}>
          <line x1="732" y1="274" x2="732" y2="392" stroke="#2F3E63" strokeWidth="16" strokeLinecap="round" />
          <ellipse cx="727" cy="389" rx="18" ry="7" fill={INK} />
        </g>

        <rect x="696" y="182" width="48" height="100" rx="15" fill="#F2A33A" />
        <g className="belly">
          <ellipse cx="720" cy="232" rx="32" ry="36" fill="#F7B84E" stroke="#D98A1F" strokeWidth="2" />
          <path d="M 716 238 q 4 4 8 0" fill="none" stroke="#C97F14" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* arms: rest on the tummy, then both go up to cheer */}
        <g className="user-arm user-arm-l" style={{ transformOrigin: '696px 198px' }}>
          <g className="wiggle wiggle-l" style={{ transformOrigin: '696px 198px' }}>
            <line x1="696" y1="198" x2="690" y2="262" stroke="#F2A33A" strokeWidth="13" strokeLinecap="round" />
            <circle cx="690" cy="268" r="7.5" fill="#F1BE94" />
          </g>
        </g>
        <g className="user-arm user-arm-r" style={{ transformOrigin: '744px 198px' }}>
          <g className="wiggle wiggle-r" style={{ transformOrigin: '744px 198px' }}>
            <line x1="744" y1="198" x2="750" y2="262" stroke="#F2A33A" strokeWidth="13" strokeLinecap="round" />
            <circle cx="750" cy="268" r="7.5" fill="#F1BE94" />
          </g>
        </g>

        <rect x="711" y="176" width="18" height="12" rx="4" fill="#F1BE94" />
        <g className="user-head">
          <circle cx="720" cy="150" r="32" fill="#F1BE94" />
          <path d="M 690 146 A 32 32 0 0 1 752 148 Q 730 128 690 146 Z" fill="#2B1B14" />
          <path d="M 690 148 q -9 6 0 11" fill="#F1BE94" stroke="#D49A70" strokeWidth="1.5" />
          <line x1="700" y1="137" x2="713" y2="135" stroke="#2B1B14" strokeWidth="3" strokeLinecap="round" />
          <circle className="eye" cx="707" cy="146" r="3.4" fill={INK} />
          <path d="M 697 173 q 6 6 12 0" fill="none" stroke="#9A4B3A" strokeWidth="2.5" strokeLinecap="round" />
          <g className="mouth">
            <ellipse cx="700" cy="170" rx="9" ry="12" fill="#3B0F1E" />
            <ellipse cx="701" cy="176" rx="5" ry="3.5" fill="#D9626F" />
          </g>
        </g>

        {/* water stream from bucket to mouth */}
        <path
          className="pour-stream"
          d="M 648 135 Q 678 133 692 166"
          pathLength="1"
          fill="none"
          stroke="#5EC8F2"
          strokeWidth="9"
          strokeDasharray="1 1"
        />
      </svg>

      <div className={`deliver-popup ${done ? 'show' : ''}`} aria-live="polite">
        <p>Got the water, enjoy the water!</p>
        <button type="button" className="btn btn-go" onClick={onReorder} disabled={!done}>
          Reorder
        </button>
      </div>
    </div>
  )
}