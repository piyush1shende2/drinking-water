// Nature scenes drawn in SVG, so the app needs no image files or internet.
// To use real photos later, replace a scene with <img src={yourImage} alt="" />.

function Pines({ xs, base, h, fill, op = 1 }) {
  return (
    <g fill={fill} opacity={op}>
      {xs.map((x, i) => {
        const hh = h * (0.8 + ((i * 37) % 5) / 10)
        return <path key={i} d={`M ${x - 7} ${base} L ${x} ${base - hh} L ${x + 7} ${base} Z`} />
      })}
    </g>
  )
}

function Scene({ className, children }) {
  return (
    <svg className={className} viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {children}
    </svg>
  )
}

export function MountainLake({ className }) {
  return (
    <Scene className={className}>
      <defs>
        <linearGradient id="ml-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7D3DF" />
          <stop offset="1" stopColor="#F0F3EE" />
        </linearGradient>
        <linearGradient id="ml-rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A9D95" />
          <stop offset="1" stopColor="#4F6B5F" />
        </linearGradient>
        <linearGradient id="ml-lake" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3FB0BD" />
          <stop offset="1" stopColor="#1D7E94" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#ml-sky)" />
      <circle cx="90" cy="70" r="46" fill="#fff" opacity=".35" />
      <path d="M0 125 L40 98 L82 116 L122 88 L172 120 L400 120 L400 160 L0 160 Z" fill="#AFC4CE" />
      <path d="M160 165 L248 42 L274 64 L302 26 L334 72 L400 52 L400 165 Z" fill="url(#ml-rock)" />
      <path d="M302 26 L318 54 L306 49 L297 62 L286 47 Z" fill="#fff" opacity=".92" />
      <path d="M248 42 L262 60 L252 56 L244 66 Z" fill="#fff" opacity=".9" />
      <path d="M0 152 Q 120 142 200 162 T 400 152 V240 H0 Z" fill="url(#ml-lake)" />
      <path d="M170 160 Q 235 178 300 204 Q 345 220 400 214 V240 H262 Q 200 202 170 160 Z" fill="#DCD5BF" />
      <path d="M176 164 Q 238 182 296 206" fill="none" stroke="#fff" strokeWidth="4" opacity=".7" />
      <path d="M300 240 Q 322 192 360 172 Q 388 160 400 150 V240 Z" fill="#3E6B50" />
      <Pines xs={[318, 336, 354, 372, 390]} base={214} h={34} fill="#2E5740" />
      <path d="M0 196 Q 34 176 74 198 L 94 240 H0 Z" fill="#4F7B5E" />
      <Pines xs={[12, 30, 50, 70]} base={226} h={30} fill="#35604A" />
      <ellipse cx="200" cy="152" rx="230" ry="12" fill="#fff" opacity=".35" />
    </Scene>
  )
}

export function ForestMist({ className }) {
  return (
    <Scene className={className}>
      <defs>
        <linearGradient id="fm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3E4CC" />
          <stop offset="1" stopColor="#E8D6BC" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#fm-sky)" />
      <circle cx="270" cy="70" r="60" fill="#FFF3D6" opacity=".6" />
      <path d="M0 140 Q 80 96 160 130 T 320 118 T 400 134 V240 H0 Z" fill="#CDBB9E" />
      <Pines xs={[20, 60, 110, 170, 230, 290, 350]} base={150} h={34} fill="#A99E80" op=".7" />
      <ellipse cx="200" cy="150" rx="240" ry="16" fill="#fff" opacity=".4" />
      <path d="M0 172 Q 100 132 200 166 T 400 150 V240 H0 Z" fill="#9AA27F" />
      <Pines xs={[10, 44, 90, 140, 200, 260, 320, 380]} base={186} h={46} fill="#6F7F5C" />
      <ellipse cx="220" cy="190" rx="240" ry="14" fill="#fff" opacity=".35" />
      <path d="M0 212 Q 100 190 200 214 T 400 204 V240 H0 Z" fill="#3F5A46" />
      <Pines xs={[16, 52, 98, 150, 210, 270, 330, 384]} base={236} h={56} fill="#2C4636" />
    </Scene>
  )
}

export function Glacier({ className }) {
  return (
    <Scene className={className}>
      <defs>
        <linearGradient id="gl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE4EF" />
          <stop offset="1" stopColor="#F4F9FA" />
        </linearGradient>
        <linearGradient id="gl-ice" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86CADB" />
          <stop offset="1" stopColor="#3B90AC" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#gl-sky)" />
      <path d="M0 172 L70 72 L112 112 L160 40 L232 132 L292 82 L400 172 V240 H0 Z" fill="#8FA7B8" />
      <path d="M160 40 L184 80 L168 72 L160 88 L148 70 Z" fill="#fff" />
      <path d="M70 72 L88 98 L75 93 L66 106 L56 92 Z" fill="#fff" />
      <path d="M292 82 L310 110 L296 104 L288 116 L276 102 Z" fill="#fff" />
      <path d="M0 172 H400 V240 H0 Z" fill="url(#gl-ice)" />
      <path d="M40 190 H120 M190 204 H300 M80 218 H180 M250 226 H350" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <path d="M160 172 L200 214 L240 172 Z" fill="#fff" opacity=".18" />
    </Scene>
  )
}

export function Spring({ className }) {
  return (
    <Scene className={className}>
      <defs>
        <linearGradient id="sp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C8D8D2" />
          <stop offset="1" stopColor="#E6EEE9" />
        </linearGradient>
        <linearGradient id="sp-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BFE6F2" />
          <stop offset="1" stopColor="#5FB4CF" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#sp-sky)" />
      <Pines xs={[20, 60, 100, 140, 260, 300, 340, 380]} base={130} h={60} fill="#5F7F6A" op=".75" />
      <path d="M0 120 Q 120 90 200 120 T 400 112 V240 H0 Z" fill="#7C9A7E" />
      <path d="M186 96 C 166 140 218 160 196 204 S 180 232 190 240 L 232 240 C 226 226 250 196 244 160 S 218 124 228 96 Z" fill="url(#sp-water)" />
      <path d="M204 120 C 196 150 222 168 210 200" fill="none" stroke="#fff" strokeWidth="3" opacity=".7" strokeLinecap="round" />
      <ellipse cx="90" cy="198" rx="86" ry="38" fill="#5E7568" />
      <ellipse cx="86" cy="190" rx="70" ry="24" fill="#7C9A7E" />
      <ellipse cx="320" cy="204" rx="92" ry="36" fill="#55695F" />
      <ellipse cx="324" cy="196" rx="72" ry="22" fill="#78947A" />
      <circle cx="170" cy="222" r="9" fill="#8A9A94" />
      <circle cx="254" cy="226" r="7" fill="#8A9A94" />
    </Scene>
  )
}
