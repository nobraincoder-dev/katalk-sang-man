// 1단계: API 연결 전 테스트용 가상 결과 (2단계 JSON 스키마와 동일)
export const MOCK_RESULTS = {
  alpha: {
    is_chat: true,
    score: 78,
    type_label: '상',
    meme_title: '읽씹도 당당한 철벽 장인',
    evidence_quote: '"ㅇㅇ 알겠어. 나 바빠서 나중에."',
    fact_bomb: [
      '답장 속도는 느린데 자신감은 광속임',
      '단답 비율 82%, 말풍선이 다이어트 중',
      '그래도 묘하게 끌리는 게 함정',
    ],
    recommended_reply: '"바쁜 거 알지, 근데 오늘 저녁은 내가 쏠게."',
  },
  beta: {
    is_chat: true,
    score: 71,
    type_label: '하',
    meme_title: '읽씹 당하고 새벽에 울먹이는 사람',
    evidence_quote: '"혹시 바쁘면 답장 안 해도 돼… 미안ㅠㅠ"',
    fact_bomb: [
      '읽씹 후 연달아 보낸 카톡 5연타',
      'ㅋㅋㅋ와 ㅠㅠ 비율이 1:9',
      '사과가 인사말보다 많음',
    ],
    recommended_reply: '"나 오늘 좀 서운했어. 그래도 얘기하고 싶어서 연락했어."',
  },
}

export const SAMPLE_CHAT = [
  { me: false, text: '오늘 뭐해?' },
  { me: true, text: 'ㅇㅇ' },
  { me: false, text: '저녁에 시간 돼?' },
  { me: true, text: '글쎄 ㅋㅋ' },
]

