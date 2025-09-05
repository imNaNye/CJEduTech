// 퀴즈 데이터 스키마
// - q: 문제 텍스트
// - options: 보기(카드 앞면에 노출될 내용)
// - answer: 정답 인덱스(0-based)
// - explanation: 기본 해설(정/오답 공통 폴백)
// - explainCorrect: 정답일 때 노출할 해설(선택)
// - explainWrong: 오답일 때 노출할 해설(선택)
// - delayMs: 이 문제의 결과 화면 유지 시간(선택, 없으면 FEEDBACK_MS 사용)
export const quizQuestions = {
  1: [
    {
      q: '다음 중 OO에 해당하는 것은?',
      options: ['A', 'B', 'C'],
      answer: 1,
      explanation: 'OO의 정의와 대표 사례를 기억하세요.',
      explainCorrect: '정답! B가 OO에 해당합니다.',
      explainWrong: '오답! OO는 B가 정답이에요.',
      delayMs: 2000,
    },
    {
      q: 'OO를 설명하는 것은?',
      options: ['가', '나', '다'],
      answer: 0,
      explanation: '핵심 키워드는 X, Y 입니다.',
      explainCorrect: '좋아요! “가”가 올바른 설명입니다.',
      explainWrong: '아쉬워요. 올바른 설명은 “가” 입니다.',
    },
    {
      q: 'OO의 특징은?',
      options: ['X', 'Y', 'Z'],
      answer: 2,
      explanation: '특징 Z가 핵심 포인트입니다.',
    },
  ],
  2: [
    {
      q: '2라운드 Q1?',
      options: ['A1', 'B1', 'C1'],
      answer: 2,
      explanation: '이 보기의 차이를 비교해 보세요.',
    },
    {
      q: '2라운드 Q2?',
      options: ['A2', 'B2', 'C2'],
      answer: 0,
      explanation: '정의와 예시를 함께 외우면 좋아요.',
      delayMs: 2500,
    },
    {
      q: '2라운드 Q3?',
      options: ['A3', 'B3', 'C3'],
      answer: 1,
      explanation: '오답일 때는 근거를 다시 확인하세요.',
    },
  ],
  3: [
    {
      q: '3라운드 Q1?',
      options: ['A1', 'B1', 'C1'],
      answer: 0,
      explanation: '기본 개념을 묻는 문제입니다.',
    },
    {
      q: '3라운드 Q2?',
      options: ['A2', 'B2', 'C2'],
      answer: 1,
      explanation: '비슷한 용어와 혼동하지 않도록 주의!',
    },
    {
      q: '3라운드 Q3?',
      options: ['A3', 'B3', 'C3'],
      answer: 2,
      explanation: '응용 문제: 근거를 떠올리며 선택하세요.',
      explainCorrect: '정답입니다! 선택한 보기의 근거가 적절했어요.',
      explainWrong: '오답이에요. 정답 근거를 다시 읽어보세요.',
    },
  ],
};