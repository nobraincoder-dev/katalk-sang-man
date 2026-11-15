// 선글라스 쓴 힙한 캐릭터
export function CoolCharacter({ className = '' }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="선글라스 캐릭터">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <circle cx="100" cy="105" r="78" fill="#FFD9B8" stroke="#FF3B30" strokeWidth="4" filter="url(#glow)" />
      <path d="M30 85 Q100 -10 170 85 Q150 50 100 48 Q50 50 30 85Z" fill="#111" stroke="#FF3B30" strokeWidth="3" />
      <rect x="45" y="85" width="50" height="34" rx="10" fill="#000" stroke="#FF3B30" strokeWidth="3" />
      <rect x="105" y="85" width="50" height="34" rx="10" fill="#000" stroke="#FF3B30" strokeWidth="3" />
      <line x1="95" y1="98" x2="105" y2="98" stroke="#FF3B30" strokeWidth="4" />
      <path d="M52 92 L68 92" stroke="#fff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" />
      <path d="M112 92 L128 92" stroke="#fff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 148 Q105 160 128 140" stroke="#333" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// 눈물 흘리는 B급 감성 캐릭터
export function CryCharacter({ className = '' }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="눈물 캐릭터">
      <circle cx="100" cy="105" r="78" fill="#CBD5E1" stroke="#38BDF8" strokeWidth="4" />
      <path d="M40 80 Q60 40 100 42 Q145 40 162 80 Q130 62 100 66 Q70 62 40 80Z" fill="#475569" />
      <path d="M58 88 L88 80" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
      <path d="M142 88 L112 80" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="72" cy="104" rx="10" ry="12" fill="#1E293B" />
      <ellipse cx="128" cy="104" rx="10" ry="12" fill="#1E293B" />
      <circle cx="75" cy="100" r="3.5" fill="#fff" />
      <circle cx="131" cy="100" r="3.5" fill="#fff" />
      <path d="M68 118 Q62 140 68 160 Q76 160 76 150 Q74 134 76 118Z" fill="#38BDF8" />
      <path d="M132 118 Q138 140 132 160 Q124 160 124 150 Q126 134 124 118Z" fill="#38BDF8" />
      <path d="M80 152 Q100 136 120 152" stroke="#334155" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

