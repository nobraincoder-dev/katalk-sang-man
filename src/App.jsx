import { useState, useEffect, useRef } from 'react'
import {
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
  X,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Share2,
  Copy,
  Flame,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import ResultCard from './ResultCard.jsx'
import { MOCK_RESULTS, SAMPLE_CHAT } from './mockData.js'
import { processImageFile } from './imageOptimizer.js'
import {
  getRemainingCount,
  getTotalAllowedCount,
  consumeAnalysisCount,
  addBonusCount,
} from './usageManager.js'

function Bubble({ me, children }) {
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'} pop`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
          me ? 'bg-[#FEE500] text-[#3C1E1E] rounded-tr-sm' : 'bg-white text-gray-900 rounded-tl-sm'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [gender, setGender] = useState('male')
  const [files, setFiles] = useState([])
  const [phase, setPhase] = useState('input') // input | loading | result
  const [result, setResult] = useState(null)
  const [errorModal, setErrorModal] = useState(null) // { title, message }
  const [loadingStep, setLoadingStep] = useState('카톡 대화 판독 준비 중...')

  // 토스트 메시지
  const [toastMessage, setToastMessage] = useState(null)

  // 사용량 카운트 상태
  const [remainingCount, setRemainingCount] = useState(3)
  const [totalAllowed, setTotalAllowed] = useState(3)

  // 결과 카드 PNG 이미지 생성 관련
  const [cardImageUrl, setCardImageUrl] = useState(null)
  const cardDomRef = useRef(null)

  // 초기 사용량 로드
  useEffect(() => {
    refreshUsage()
  }, [])

  const refreshUsage = () => {
    setRemainingCount(getRemainingCount())
    setTotalAllowed(getTotalAllowedCount())
  }

  const showToast = (msg, duration = 1500) => {
    setToastMessage(msg)
    window.__currentToast = msg
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur))
    }, duration)
  }

  const addFiles = (list) => {
    const arr = Array.from(list)
    setFiles((prev) => [...prev, ...arr].slice(0, 3))
  }

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  // 1초 맛보기 데모
  const runDemo = () => {
    setCardImageUrl(null)
    setPhase('loading')
    setLoadingStep('예시 카톡 상·하 성향 판독 중...')
    setTimeout(() => {
      setResult(MOCK_RESULTS[gender === 'male' ? 'alpha' : 'beta'])
      setPhase('result')
    }, 2000)
  }

  // 실제 제미나이 AI 분석 실행
  const handleAnalyze = async () => {
    // 1. 일일 무료 횟수 체크
    const remaining = getRemainingCount()
    if (remaining <= 0) {
      setErrorModal({
        title: '오늘의 무료 분석 횟수를 모두 소진했어요! 😭',
        message:
          '하단의 [친구/연인에게 결과 공유하기]나 [링크 복사]를 누르면 즉시 보너스 2회가 추가 충전되어 계속 분석할 수 있습니다!',
      })
      return
    }

    setCardImageUrl(null)
    setPhase('loading')
    setLoadingStep('브라우저 Canvas로 이미지 최적화 및 압축 중...')

    // 40초 안전 타임아웃 컨트롤러 (무한 로딩 절대 방지)
    const timeoutController = new AbortController()
    const safeTimer = setTimeout(() => {
      timeoutController.abort()
    }, 40000)

    try {
      let optimizedImages = []

      // 1. 이미지 최적화 (가로 720px, JPEG 65%, 2.5배 긴 캡처 자동 분할)
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          setLoadingStep(`이미지 최적화 처리 중... (${i + 1}/${files.length})`)
          const processed = await processImageFile(files[i])
          optimizedImages.push(...processed)
        }
      }

      setLoadingStep(`AI가 ${gender === 'male' ? '상남자·하남자' : '상여자·하여자'} 전투력 판독 중...`)

      // 2. 서버리스 프록시 (/api/analyze) 호출
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          images: optimizedImages,
        }),
        signal: timeoutController.signal,
      })

      clearTimeout(safeTimer)

      let data
      try {
        data = await response.json()
      } catch (jsonErr) {
        throw new Error('서버 응답을 해석할 수 없습니다. (JSON 파싱 에러)')
      }

      // 429 한도 초과 에러 처리
      if (response.status === 429 || data?.code === 429) {
        setPhase('input')
        setErrorModal({
          title: 'AI 서버 과열 안내 ☕',
          message:
            data?.message ||
            '지금 전국의 하남자/상남자들이 한꺼번에 몰려 AI가 팩폭을 쉬고 있습니다. 1분 뒤 다시 시도해 주세요!',
        })
        return
      }

      if (!response.ok) {
        throw new Error(data?.error || `분석 요청에 실패했습니다. (코드: ${response.status})`)
      }

      // 3. 메신저 대화 여부 확인 (예외 처리)
      if (data?.is_chat === false) {
        setPhase('input')
        setErrorModal({
          title: '어허, 카톡 대화 캡처가 아닌 것 같은데요? 🧐',
          message: '썸남/썸녀랑 나눈 실제 카톡 대화 캡처나 텍스트를 올려주세요!',
        })
        return
      }

      // 정상 분석 성공 시 횟수 1회 차감
      consumeAnalysisCount()
      refreshUsage()

      setResult(data)
      setPhase('result')
    } catch (err) {
      clearTimeout(safeTimer)
      console.error('[Analyze Error]', err)
      setPhase('input')
      
      let errorMsg = err.message || '알 수 없는 오류가 발생했습니다.'
      if (err.name === 'AbortError') {
        errorMsg = 'AI 분석 응답 시간이 초과되었습니다. 이미지 개수를 줄이거나 잠시 후 다시 시도해주세요.'
      } else if (errorMsg.includes('GEMINI_API_KEY')) {
        errorMsg = 'GEMINI_API_KEY가 등록되지 않았습니다. .env.local 파일에 키를 입력해주세요.'
      }

      setErrorModal({
        title: '분석 중 문제가 발생했습니다 😢',
        message: errorMsg,
      })
    }
  }

  // 결과 화면 전환 시 고화질 PNG 이미지로 자동 변환 (인앱 브라우저 꾹 눌러 저장 지원)
  useEffect(() => {
    if (phase === 'result' && result) {
      const timer = setTimeout(async () => {
        try {
          const domNode = cardDomRef.current
          if (domNode) {
            const dataUrl = await toPng(domNode, {
              pixelRatio: 2,
              cacheBust: true,
              skipFonts: true, // 웹폰트 cross-origin 차단 방지
            })
            if (dataUrl && dataUrl.length > 500) {
              setCardImageUrl(dataUrl)
            }
          }
        } catch (e) {
          console.warn('Image conversion warning:', e)
        }
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [phase, result])

  // 바이럴 충전 트리거 (공유나 링크 복사 시 횟수 부족 상태면 보너스 2회 자동 충전)
  const triggerBonusRecharge = () => {
    const cur = getRemainingCount()
    if (cur === 0) {
      addBonusCount(2)
      refreshUsage()
      return true
    }
    return false
  }

  // 워들(Wordle) 스타일 이모지 판독 결과표 텍스트 생성
  const generateWordleSummary = () => {
    if (!result) return ''
    const isMale = gender === 'male'
    const isAlpha = result.type_label === '상'
    const appTitle = isMale ? '카톡 상남자·하남자 판독기' : '카톡 상여자·하여자 판독기'
    const emoji = isAlpha ? '😎' : '😭'
    const trait = (isAlpha ? '상' : '하') + (isMale ? '남자' : '여자') + '력'
    const score = Math.min(Math.max(Number(result.score) || 0, 0), 100)
    const filledCount = Math.min(10, Math.max(0, Math.round(score / 10)))
    const emptyCount = 10 - filledCount
    const blockEmoji = isAlpha ? '🟥' : '🟦'
    const gauge = blockEmoji.repeat(filledCount) + '⬛'.repeat(emptyCount)

    return `💥 [${appTitle}]
${emoji} ${trait} ${score}% | "${result.meme_title}"
${gauge} (${score}/100)

🔍 결정적 증거 박제:
"${result.evidence_quote || ''}"

나도 카톡 캡처 올리고 판독받기 👉 https://katalk-sang-man.vercel.app/`
  }

  // 1. 친구/연인에게 결과 공유하기 (워들 스타일 이모지 텍스트 클립보드 즉시 복사)
  const handleShareResult = async () => {
    triggerBonusRecharge()
    const summaryText = generateWordleSummary()

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(summaryText)
      } else {
        fallbackCopyText(summaryText)
      }
    } catch {
      fallbackCopyText(summaryText)
    }

    showToast('판독 결과가 복사되었어요 📋')
  }

  // 2. 주변 하남자/하여자 저격하기 (링크 복사)
  const handleTargetLinkCopy = () => {
    triggerBonusRecharge()
    const targetUrl = 'https://katalk-sang-man.vercel.app/'
    copyToClipboard(targetUrl)
  }

  const copyToClipboard = (textToCopy) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).catch(() => {
          fallbackCopyText(textToCopy)
        })
      } else {
        fallbackCopyText(textToCopy)
      }
    } catch (e) {
      fallbackCopyText(textToCopy)
    }

    showToast('링크가 복사되었어요 🔗')
  }

  const fallbackCopyText = (text) => {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    } catch (err) {
      console.warn('Fallback copy failed', err)
    }
  }

  const labels = gender === 'male' ? ['상남자', '하남자'] : ['상여자', '하여자']
  const appTitle = gender === 'male' ? '카톡 상남자·하남자 판독기' : '카톡 상여자·하여자 판독기'
  const targetTerm = gender === 'male' ? '하남자' : '하여자'
  const canSubmit = files.length > 0

  return (
    <div className="min-h-screen bg-[#BACEE0] max-w-[480px] mx-auto flex flex-col font-sans relative">
      {/* 카톡 상단바 */}
      <header className="bg-[#BACEE0] px-4 pt-4 pb-2 flex items-center justify-between text-gray-800">
        <div className="flex items-center gap-2">
          {phase === 'result' && (
            <button
              onClick={() => setPhase('input')}
              aria-label="뒤로가기"
              className="p-1 hover:bg-black/5 rounded-full cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="font-bold text-base">{appTitle}</h1>
        </div>
        {phase === 'result' && (
          <button
            onClick={() => setPhase('input')}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white/80 hover:bg-white rounded-full shadow-xs cursor-pointer transition"
          >
            <RotateCcw size={12} /> 다시하기
          </button>
        )}
      </header>

      {/* 안심 배지 & 남은 무료 분석 횟수 표시 */}
      <div className="mx-4 mb-2 flex items-center justify-between gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] text-gray-700 shadow-xs">
        <div className="flex items-center gap-1.5 truncate">
          <ShieldCheck size={14} className="text-green-600 shrink-0" />
          <span className="truncate">대화 내용은 저장되지 않고 분석 즉시 휘발됩니다</span>
        </div>
        <div className="shrink-0 flex items-center gap-1 font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full text-[10px]">
          <Flame size={11} className="fill-amber-600 text-amber-600" />
          <span>오늘 무료: {remainingCount}/{totalAllowed}회</span>
        </div>
      </div>

      <main className="flex-1 px-4 pb-8 space-y-3">
        {phase === 'input' && (
          <>
            <Bubble>
              야, 너 카톡 보니까 {targetTerm} 냄새가 솔솔 나는데? 👃
              <br />
              먼저 본인 성별부터 골라봐!
            </Bubble>

            <div className="flex justify-end gap-2 pop">
              {[
                ['male', '남자', '상남자 / 하남자'],
                ['female', '여자', '상여자 / 하여자'],
              ].map(([k, n, s]) => (
                <button
                  key={k}
                  onClick={() => setGender(k)}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition cursor-pointer ${
                    gender === k
                      ? 'bg-[#FEE500] text-[#3C1E1E] ring-2 ring-[#3C1E1E]/40 shadow-sm'
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  {n}
                  <span className="block text-[10px] font-normal opacity-70">{s}</span>
                </button>
              ))}
            </div>

            <Bubble>
              {labels[0]}일까, 숨길 수 없는 {labels[1]}일까? ⚡
              <br />
              나눈 카톡 캡처 올려봐. AI가 바로 판독해줌!
            </Bubble>

            {/* 메인 캡처 업로드 카드 */}
            <div className="bg-white rounded-3xl p-4 shadow-sm pop space-y-3">
              <label className="block border-2 border-dashed border-gray-300 hover:border-[#FEE500] bg-gray-50/70 hover:bg-yellow-50/30 rounded-2xl py-10 px-4 text-center cursor-pointer transition group">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-500 group-hover:scale-105 group-hover:text-[#3C1E1E] transition">
                  <ImageIcon size={28} />
                </div>
                <div className="font-bold text-gray-800 text-sm mb-1">
                  카톡 대화 캡처 올리기
                </div>
                <div className="text-xs text-gray-500">
                  최대 3장 선택 가능 <span className="text-gray-400">· 긴 스크롤 자동 2분할 지원</span>
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 shadow-2xs">
                  <Plus size={13} className="text-[#3C1E1E]" />
                  <span>사진 추가 ({files.length}/3)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>

              {files.length > 0 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5">
                  {files.map((file, i) => {
                    const url = URL.createObjectURL(file)
                    return (
                      <div key={i} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-xs">
                        <img
                          src={url}
                          alt={`캡처 미리보기 ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFile(i)}
                          aria-label="삭제"
                          className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white rounded-full p-1 cursor-pointer transition shadow-sm"
                        >
                          <X size={12} />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                          {i + 1}번 캡처
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                disabled={!canSubmit}
                onClick={handleAnalyze}
                className="w-full py-3.5 rounded-2xl bg-[#3C1E1E] text-[#FEE500] font-bold text-sm disabled:opacity-40 transition cursor-pointer hover:bg-[#2c1515] active:scale-[0.99] shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>내 {labels[0]}력 판독하기 ⚡</span>
              </button>
            </div>

            {/* 1초 맛보기 버튼 */}
            <button
              onClick={runDemo}
              className="w-full py-3 rounded-xl bg-[#FEE500] text-[#3C1E1E] font-bold text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#ebd300] transition pop"
            >
              <Sparkles size={16} /> 예시 카톡으로 3초 만에 결과 미리보기
            </button>
          </>
        )}

        {/* 로딩 화면 */}
        {phase === 'loading' && (
          <div className="space-y-3 pt-4">
            {SAMPLE_CHAT.map((m, i) => (
              <Bubble key={i} me={m.me}>
                {m.text}
              </Bubble>
            ))}
            <Bubble>
              <span className="font-semibold">{loadingStep}</span>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="dot ml-0.5"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  ●
                </span>
              ))}
            </Bubble>
          </div>
        )}

        {/* 결과 카드 화면 */}
        {phase === 'result' && result && (
          <div className="space-y-3">
            {/* 실제 <img> 태그 또는 DOM 카드 렌더링 (인앱 브라우저 롱프레스 저장 완벽 지원) */}
            <div className="relative mx-auto max-w-[360px]">
              {/* 원본 DOM 노드는 항상 렌더링하되, 이미지가 완성되면 이미지로 레이어 덮어 꾹 눌러 저장 지원 */}
              <div ref={cardDomRef}>
                <ResultCard result={result} gender={gender} />
              </div>

              {cardImageUrl && (
                <img
                  src={cardImageUrl}
                  alt={`${appTitle} 밈 카드`}
                  className="absolute inset-0 w-full h-full rounded-3xl opacity-100 z-10 cursor-pointer select-auto"
                  style={{ WebkitTouchCallout: 'default' }}
                />
              )}
            </div>

            {/* 인앱 브라우저 다운로드 먹통 방지 안내 문구 */}
            <div className="text-center py-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-[11px] font-medium shadow-sm animate-pulse">
                📸 이미지를 꾹 눌러 갤러리에 저장하세요
              </span>
            </div>

            {/* 원클릭 공유 및 친구 저격 루프 버튼 2종 */}
            <div className="flex flex-col gap-2 max-w-[360px] mx-auto pt-1">
              <button
                onClick={handleShareResult}
                className="w-full py-3.5 rounded-2xl bg-[#FEE500] text-[#3C1E1E] font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer hover:bg-[#ebd300] active:scale-[0.99] transition"
              >
                <Share2 size={18} />
                <span>친구/연인에게 판독 결과 공유하기</span>
              </button>

              <button
                onClick={handleTargetLinkCopy}
                className="w-full py-3 rounded-2xl bg-white/90 hover:bg-white text-gray-800 font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 border border-gray-200/80 cursor-pointer active:scale-[0.99] transition"
              >
                <Copy size={15} />
                <span>주변 {targetTerm} 저격하기 (링크 복사)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 하단 심플 토스트 알림 (1.5초) */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg z-50 pop flex items-center justify-center border border-white/10 pointer-events-none whitespace-nowrap">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 안내 & 예외 처리 모달 */}
      {errorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 pop">
          <div className="bg-white rounded-2xl max-w-[320px] w-full p-5 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-2">{errorModal.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {errorModal.message}
            </p>
            <button
              onClick={() => setErrorModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#FEE500] text-[#3C1E1E] font-bold text-xs cursor-pointer hover:bg-[#ebd300]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
