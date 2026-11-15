// Vercel Serverless Function & Vite dev middleware handler
// Model: gemini-3.5-flash-lite / gemini-flash-lite-latest (Verified & ultra-fast)

export default async function handler(req, res) {
  // CORS & OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY=your_key 를 입력해주세요.',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: '잘못된 JSON 요청입니다.' });
      }
    }

    const { gender = 'male', images = [], text = '' } = body || {};

    const targetGenderLabel = gender === 'male' ? '남자 (상남자 vs 하남자)' : '여자 (상여자 vs 하여자)';
    const typeLabelOptions = '상 또는 하';

    const systemPrompt = `당신은 카카오톡 대화 캡처 및 텍스트를 보고 상대방과의 연애 말투, 심리, 비언어적 패턴을 초정밀 분석하는 대한민국 최고의 밈 & 연애 분석 AI입니다.
분석 대상자 성별 및 포지션: ${targetGenderLabel}

[핵심 분석 기준]
1. 이미지 분석 시:
   - 카카오톡 UI 기준 **오른쪽 노란색 말풍선(사용자 본인/분석 대상자)**과 **왼쪽 흰색 말풍선(상대방)**을 엄격하게 구분하세요.
   - 상대방(왼쪽 흰색 말풍선)의 말은 상황 맥락 파악용으로만 참고하고, 평가 대상은 오직 오른쪽 노란 말풍선(본인)입니다.
   - 말풍선 길이 비율 (상대 장문에 단답인지, 나 혼자 벽보고 랩하는 장문인지)
   - 타임스탬프 기반 답장 속도 차이 (상대 3분 컷 vs 나 3초 컷 / 혹은 그 반대)
   - 읽씹(숫자 '1'이 안 사라지거나 사라진 후) 연달아 보낸 횟수 (질척거림 vs 쿨함)
   - 'ㅋㅋㅋ', 'ㅎㅎ', 'ㅠㅠ', 물음표(?) 개수, 이모티콘 습관 (과도한 굽신거림, 사과 남발, 철벽 등)
2. 텍스트 분석 시:
   - 텍스트 내 '나:', '본인:' 또는 첫 번째 화자의 말투, 사과 남발 여부, ㅋㅋㅋ 비율 등을 정밀 파악하세요.
3. 카톡 대화가 아닌 일반 풍경, 영수증, 기타 무관한 사진이나 장난 텍스트인 경우:
   - 반드시 "is_chat": false 로 반환해야 합니다.

[🚨 evidence_quote 절대 규칙 - 가장 중요 🚨]
- "evidence_quote"는 **반드시 오른쪽 노란색 말풍선(사용자 본인)이 직접 입력한 대사** 중에서만 100% 원문 그대로 1줄 추출해야 합니다.
- **절대로 왼쪽 상대방의 말풍선 대사나 상대방이 한 말을 evidence_quote에 넣지 마세요.**
- 사용자의 상남자/상여자 또는 하남자/하여자 성향이 가장 노골적으로 드러난 본인의 대사를 토씨 하나 안 바꾸고 그대로 인용하세요.

[출력 형식 및 스키마]
반드시 마크다운 코드블록(\`\`\`json) 없이 순수 JSON 객체 하나만 반환하세요.
{
  "is_chat": boolean, // 카톡/메신저 대화 내용이 명확하면 true, 아니면 false
  "score": number, // 0~100 사이 정수 (상/하 지수 중 우세한 쪽의 강도 퍼센트, 보통 60~95 사이로 위트있게 책정)
  "type_label": "${typeLabelOptions}", // 오직 "상" 또는 "하" 한 글자만
  "meme_title": string, // 인스타/트위터에서 터질 법한 찰떡 밈 별명 (예: "읽씹도 당당한 철벽 장인", "새벽 2시에 물음표 폭격기")
  "evidence_quote": string, // [주의: 오직 오른쪽 노란 말풍선 본인 대사만 100% 원문 인용] (예: "ㅇㅇ 알겠어. 나 바빠서 나중에.")
  "fact_bomb": [string, string, string], // 뼈 때리는 팩폭 코멘트 정확히 3줄 배열 (위트 있고 도파민 터지는 말투)
  "recommended_reply": string // 이 연애 지수를 뒤집거나 살릴 수 있는 촌철살인 추천 답장 멘트 1줄
}`;

    // Contents 구성
    const parts = [];

    // 1) System Instructions
    parts.push({
      text: systemPrompt,
    });

    // 2) 이미지들 (base64 Data URL or pure base64)
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (!img || typeof img !== 'string') continue;
        let mimeType = 'image/jpeg';
        let base64Data = img;
        if (img.startsWith('data:')) {
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        }
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }
    }

    // 3) 텍스트 대화 내용
    if (text && typeof text === 'string' && text.trim().length > 0) {
      parts.push({
        text: `[카카오톡 텍스트 대화 내용]\n${text.trim()}`,
      });
    }

    if (parts.length === 1) {
      return res.status(400).json({ error: '분석할 이미지나 텍스트가 전달되지 않았습니다.' });
    }

    // 검증된 초고속 안정 Flash 모델 목록 (gemini-3.5-flash-lite 1초 내외 응답)
    const modelCandidates = [
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
    ];
    let lastError = null;
    let resultJson = null;
    let isRateLimited = false;

    for (const modelName of modelCandidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 모델당 최대 25초 타임아웃

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          isRateLimited = true;
          break;
        }

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`[API Warning] Model ${modelName} returned status ${response.status}:`, errBody.slice(0, 200));
          if (
            response.status === 429 ||
            errBody.includes('RESOURCE_EXHAUSTED') ||
            errBody.includes('Quota') ||
            errBody.includes('quota')
          ) {
            isRateLimited = true;
            break;
          }
          lastError = new Error(`Gemini API [${modelName}] 실패: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error('AI 모델 응답 내용이 비어있습니다.');
        }

        // 안전한 마크다운 코드블록 제거 및 JSON 추출
        let cleaned = candidateText.trim();
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        
        // 추가 방어: 텍스트 중간에 포함된 첫 번째 { ... } JSON 추출
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        }

        resultJson = JSON.parse(cleaned);
        console.log(`[API Success] Successfully analyzed with ${modelName}`);
        break; // 성공
      } catch (err) {
        console.warn(`[API Retry] ${modelName} error:`, err.message);
        lastError = err;
      }
    }

    if (isRateLimited) {
      return res.status(429).json({
        code: 429,
        error: 'RESOURCE_EXHAUSTED',
        message: '지금 사람들이 너무 많이 몰려 AI 판독기 오늘 무료 한도가 잠시 소진되었습니다! 😅 잠시 후(1분 뒤) 다시 시도하거나 내일 다시 찾아와 주세요.',
      });
    }

    if (!resultJson) {
      throw lastError || new Error('모든 제미나이 AI 모델 호출에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }

    return res.status(200).json(resultJson);
  } catch (error) {
    console.error('Analyze API Error:', error);
    const errText = error?.message || '';
    if (
      error?.status === 429 ||
      errText.includes('429') ||
      errText.includes('RESOURCE_EXHAUSTED') ||
      errText.includes('Quota') ||
      errText.includes('quota')
    ) {
      return res.status(429).json({
        code: 429,
        error: 'RESOURCE_EXHAUSTED',
        message: '지금 사람들이 너무 많이 몰려 AI 판독기 오늘 무료 한도가 잠시 소진되었습니다! 😅 잠시 후(1분 뒤) 다시 시도하거나 내일 다시 찾아와 주세요.',
      });
    }
    return res.status(500).json({
      error: error.message || '분석 중 오류가 발생했습니다.',
    });
  }
}
