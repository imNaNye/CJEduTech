// 퀴즈 데이터 스키마 (이미지 대응)
// - q: 문제 텍스트
// - desc: 문제 아래 사전 설명(선택)
// - options: 보기 배열
//    • 문자열: 'A' (단순 레이블)
//    • 객체: { label: 'A', img: '/quiz/round1/q1_a.png', alt: '사과 이미지' }
// - answer: 정답 인덱스(0-based)
// - explanation / explainCorrect / explainWrong: 해설
// - delayMs: 결과 화면 유지 시간(선택)
//
// ※ 이미지 경로는 Vite의 public 디렉토리 기준(/quiz/...)을 권장합니다.
//    예) 프로젝트 루트에 `public/quiz/round1/q1_a.png` 파일이 있으면
//       img: '/quiz/round1/q1_a.png' 로 참조할 수 있습니다.

//import문들
// Round 1
import r1q1A from '@/assets/images/quiz/r1q1A.png';
import r1q1B from '@/assets/images/quiz/r1q1B.png';
import r1q1C from '@/assets/images/quiz/r1q1C.png';
import r1q1Answer from '@/assets/images/quiz/r1q1Answer.png';

import r1q2A from '@/assets/images/quiz/r1q2A.png';
import r1q2B from '@/assets/images/quiz/r1q2B.png';
import r1q2C from '@/assets/images/quiz/r1q2C.png';
import r1q2D from '@/assets/images/quiz/r1q2D.png';
import r1q2Answer from '@/assets/images/quiz/r1q2Answer.png';

import r1q3X from '@/assets/images/quiz/r1q3A.png';
import r1q3Y from '@/assets/images/quiz/r1q3B.png';
import r1q3Z from '@/assets/images/quiz/r1q3C.png';
import r1q3Answer from '@/assets/images/quiz/r1q3Answer.png';

// Round 2
import r2q1A1 from '@/assets/images/quiz/r2q1A.png';
import r2q1B1 from '@/assets/images/quiz/r2q1B.png';
import r2q1C1 from '@/assets/images/quiz/r2q1C.png';
import r2q1Answer from '@/assets/images/quiz/r2q1Answer.png';

import r2q2A2 from '@/assets/images/quiz/r2q2A.png';
import r2q2B2 from '@/assets/images/quiz/r2q2B.png';
import r2q2C2 from '@/assets/images/quiz/r2q2C.png';
import r2q2Answer from '@/assets/images/quiz/r2q2Answer.png';

import r2q3A3 from '@/assets/images/quiz/r2q3A.png';
import r2q3B3 from '@/assets/images/quiz/r2q3B.png';
import r2q3C3 from '@/assets/images/quiz/r2q3C.png';
import r2q3Answer from '@/assets/images/quiz/r2q3Answer.png';

// Round 3
import r3q1A1 from '@/assets/images/quiz/r3q1A.png';
import r3q1B1 from '@/assets/images/quiz/r3q1B.png';
import r3q1C1 from '@/assets/images/quiz/r3q1C.png';
import r3q1Answer from '@/assets/images/quiz/r3q1Answer.png';

import r3q2A2 from '@/assets/images/quiz/r3q2A.png';
import r3q2B2 from '@/assets/images/quiz/r3q2B.png';
import r3q2C2 from '@/assets/images/quiz/r3q2C.png';
import r3q2Answer from '@/assets/images/quiz/r3q2Answer.png';

import r3q3A3 from '@/assets/images/quiz/r3q3A.png';
import r3q3B3 from '@/assets/images/quiz/r3q3B.png';
import r3q3C3 from '@/assets/images/quiz/r3q3C.png';
import r3q3Answer from '@/assets/images/quiz/r3q3Answer.png';

import verticalBack from '@/assets/images/quiz/verticalBack.png'
import horizontalBack from '@/assets/images/quiz/horizontalBack.png'


export const quizQuestions = {
  1: [
    {
      q: '다음 중 아래 설명에 부합하는 카드는?',
      desc: '개인의 내면적인 성품과 관련된 능력으로 자신과 타인, 사회와의 관계 속에서 바람직한 가치관과 태도를 가지고 행동하는 능력',
      options: [
        { label: '인성', img: r1q1A, alt: '인성',  backImage: verticalBack },
        { label: '태도', img: r1q1B, alt: '태도', backImage: verticalBack },
        { label: '기능', img: r1q1C, alt: '기능', backImage: verticalBack },
      ],
      answer: 0,
      explanation: 'OO의 정의와 대표 사례를 기억하세요.',
      explainCorrect: '인성은 개인의 내면적인 성품과 관련된 능력으로 자신과 타인, 사회와의 관계 속에서 바람직한 가치관과 태도를 가지고 행동하는 능력을 말해요.',
      explainWrong: '인성은 개인의 내면적인 성품과 관련된 능력으로 자신과 타인, 사회와의 관계 속에서 바람직한 가치관과 태도를 가지고 행동하는 능력을 말해요.',
      delayMs: 4000,
    },
    {
      q: '다음 중 아래 설명에 부합하는 카드는?',
      options: [
        { label: '시간관리능력', img: r1q2A, alt: '가 이미지', backImage: verticalBack },
        { label: '팀워크능력', img: r1q2B, alt: '나 이미지', backImage: verticalBack },
        { label: '위기관리능력', img: r1q2C, alt: '다 이미지', backImage: verticalBack },
        { label: '창의성', img: r1q2D, alt: '창의성', backImage: verticalBack}
      ],
      answer: 0,
      explanation: '핵심 키워드는 X, Y 입니다.',
      explainCorrect: '좋아요! 시간 관리 능력은 제한된 시간 안에 효율적으로 일처리를 조율하는 능력을 말해요.',
      explainWrong: '아쉬워요. 시간 관리 능력은 제한된 시간 안에 효율적으로 일처리를 조율하는 능력을 말해요.',
    },
    {
      q: '제시상황에 적절한 응대를 찾아 연결하세요.',
      options: [
        { label: 'X', img: r1q3X, alt: 'X 이미지', backImage: horizontalBack },
        { label: 'Y', img: r1q3Y, alt: 'Y 이미지', backImage: horizontalBack },
        { label: 'Z', img: r1q3Z, alt: 'Z 이미지', backImage: horizontalBack },
      ],
      answer: 2,
      explanation: '아동 동반 고객이 방문할 경우, 아동용 의자가 있는 좌석 쪽으로 안내하거나 아동용 의자를 제공해드려야해요.',
    },
  ],
  2: [
    {
      q: '2라운드 Q1?',
      options: [
        { label: 'A1', img: r2q1A1, alt: 'A1 이미지', backImage: verticalBack },
        { label: 'B1', img: r2q1B1, alt: 'B1 이미지', backImage: verticalBack },
        { label: 'C1', img: r2q1C1, alt: 'C1 이미지', backImage: verticalBack },
      ],
      answer: 2,
      explanation: '이 보기의 차이를 비교해 보세요.',
    },
    {
      q: '2라운드 Q2?',
      options: [
        { label: 'A2', img: r2q2A2, alt: 'A2 이미지', backImage: verticalBack },
        { label: 'B2', img: r2q2B2, alt: 'B2 이미지', backImage: verticalBack },
        { label: 'C2', img: r2q2C2, alt: 'C2 이미지', backImage: verticalBack },
      ],
      answer: 0,
      explanation: '정의와 예시를 함께 외우면 좋아요.',
      delayMs: 2500,
    },
    {
      q: '2라운드 Q3?',
      options: [
        { label: 'A3', img: r2q3A3, alt: 'A3 이미지', backImage: horizontalBack },
        { label: 'B3', img: r2q3B3, alt: 'B3 이미지', backImage: horizontalBack },
        { label: 'C3', img: r2q3C3, alt: 'C3 이미지', backImage: horizontalBack },
      ],
      answer: 1,
      explanation: '오답일 때는 근거를 다시 확인하세요.',
    },
  ],
  3: [
    {
      q: '3라운드 Q1?',
      options: [
        { label: 'A1', img: r3q1A1, alt: 'A1 이미지', backImage: verticalBack },
        { label: 'B1', img: r3q1B1, alt: 'B1 이미지', backImage: verticalBack },
        { label: 'C1', img: r3q1C1, alt: 'C1 이미지', backImage: verticalBack },
      ],
      answer: 0,
      explanation: '기본 개념을 묻는 문제입니다.',
    },
    {
      q: '3라운드 Q2?',
      options: [
        { label: 'A2', img: r3q2A2, alt: 'A2 이미지', backImage: verticalBack },
        { label: 'B2', img: r3q2B2, alt: 'B2 이미지', backImage: verticalBack },
        { label: 'C2', img: r3q2C2, alt: 'C2 이미지', backImage: verticalBack },
      ],
      answer: 1,
      explanation: '비슷한 용어와 혼동하지 않도록 주의!',
    },
    {
      q: '3라운드 Q3?',
      options: [
        { label: 'A3', img: r3q3A3, alt: 'A3 이미지', backImage: horizontalBack },
        { label: 'B3', img: r3q3B3, alt: 'B3 이미지', backImage: horizontalBack },
        { label: 'C3', img: r3q3C3, alt: 'C3 이미지', backImage: horizontalBack },
      ],
      answer: 2,
      explanation: '응용 문제: 근거를 떠올리며 선택하세요.',
      explainCorrect: '정답입니다! 선택한 보기의 근거가 적절했어요.',
      explainWrong: '오답이에요. 정답 근거를 다시 읽어보세요.',
    },
  ],
};