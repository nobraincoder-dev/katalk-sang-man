import { CoolCharacter, CryCharacter } from './Characters.jsx'

// 9:16 인스타 스토리 비율 결과 카드. score = 선택 성향(상/하) 지수
export default function ResultCard({ result, gender }) {
  const isAlpha = result.type_label === '상'
  const isMale = gender === 'male'
  const cardCategory = isMale ? '카톡 상남자·하남자 판독서' : '카톡 상여자·하여자 판독서'
  const label = (isAlpha ? '상' : '하') + (isMale ? '남자' : '여자')
  const watermarkName = isMale ? '카톡 상남자·하남자 판독기' : '카톡 상여자·하여자 판독기'
  const handleName = isMale ? '@sang-man-test' : '@sang-woman-test'

  const t = isAlpha
    ? { bg: 'bg-[#111111]', accent: '#FF3B30', text: 'text-[#FF3B30]', sub: 'text-white', box: 'bg-white/5 border-[#FF3B30]/40', glow: '0 0 24px #FF3B30aa' }
    : { bg: 'bg-[#64748B]', accent: '#38BDF8', text: 'text-[#38BDF8]', sub: 'text-white', box: 'bg-white/10 border-[#38BDF8]/40', glow: '0 0 16px #38BDF866' }

  return (
    <div
      id="result-card"
      className={`${t.bg} aspect-[9/16] w-full max-w-[360px] mx-auto rounded-3xl p-5 flex flex-col justify-between overflow-hidden shadow-2xl pop`}
    >
      <div className={`text-center text-xs font-bold tracking-widest ${t.text}`}>{cardCategory}</div>

      <div className="flex-none h-[23%] flex justify-center">
        {isAlpha ? <CoolCharacter className="h-full" /> : <CryCharacter className="h-full" />}
      </div>

      <div className="text-center">
        <div className={`font-meme text-5xl leading-none ${t.text}`} style={{ textShadow: t.glow }}>
          {result.score}%
        </div>
        <div className="text-white/80 text-sm mt-1 font-semibold">{label}력 판독 결과</div>
        <div className="h-2.5 rounded-full bg-white/15 mt-2 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(Math.max(result.score, 0), 100)}%`, background: t.accent, boxShadow: t.glow }} />
        </div>
      </div>

      <h2 className={`font-meme text-xl text-center leading-snug ${t.sub}`}>“{result.meme_title}”</h2>

      <div className={`rounded-xl border p-2.5 ${t.box}`}>
        <div className={`text-[10px] font-bold mb-0.5 ${t.text}`}>🔍 결정적 증거 박제</div>
        <p className="text-white text-xs font-medium leading-relaxed">{result.evidence_quote}</p>
      </div>

      <ul className="text-white/90 text-xs space-y-1">
        {result.fact_bomb?.map((f, i) => (
          <li key={i} className="flex gap-1.5 leading-tight"><span className={t.text}>💣</span><span>{f}</span></li>
        ))}
      </ul>

      <div className="rounded-xl bg-[#FEE500] text-[#3C1E1E] text-xs font-semibold p-2.5 leading-relaxed">
        <div className="text-[10px] opacity-70 mb-0.5 font-bold">💬 추천 답장</div>
        {result.recommended_reply}
      </div>

      {/* 인스타 스토리 공유 시 유입 경로를 위한 세련된 서비스 워터마크 */}
      <div className="pt-1 flex items-center justify-center gap-1.5 opacity-60 text-[10px] text-white tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FEE500]"></span>
        <span className="font-semibold">{watermarkName}</span>
        <span className="text-[9px] opacity-70">{handleName}</span>
      </div>
    </div>
  )
}
