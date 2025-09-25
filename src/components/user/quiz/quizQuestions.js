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
import r2q1A from '@/assets/images/quiz/r2q1A.png';
import r2q1B from '@/assets/images/quiz/r2q1B.png';
import r2q1C from '@/assets/images/quiz/r2q1C.png';
import r2q1D from '@/assets/images/quiz/r2q1D.png';
import r2q1Answer from '@/assets/images/quiz/r2q1Answer.png';

import r2q2A from '@/assets/images/quiz/r2q2A.png';
import r2q2B from '@/assets/images/quiz/r2q2B.png';
import r2q2C from '@/assets/images/quiz/r2q2C.png';
import r2q2D from '@/assets/images/quiz/r2q2D.png';
import r2q2Answer from '@/assets/images/quiz/r2q2Answer.png';

import r2q3A from '@/assets/images/quiz/r2q3A.png';
import r2q3B from '@/assets/images/quiz/r2q3B.png';
import r2q3C from '@/assets/images/quiz/r2q3C.png';
import r2q3Answer from '@/assets/images/quiz/r2q3Answer.png';

// Round 3
import r3q1A from '@/assets/images/quiz/r3q1A.png';
import r3q1B from '@/assets/images/quiz/r3q1B.png';
import r3q1C from '@/assets/images/quiz/r3q1C.png';
import r3q1D from '@/assets/images/quiz/r3q1D.png';
import r3q1Answer from '@/assets/images/quiz/r3q1Answer.png';

import r3q2A from '@/assets/images/quiz/r3q2A.png';
import r3q2B from '@/assets/images/quiz/r3q2B.png';
import r3q2C from '@/assets/images/quiz/r3q2C.png';
import r3q2D from '@/assets/images/quiz/r3q2D.png';
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
        {  img: r1q1A, alt: '인성',  backImg: verticalBack },
        {  img: r1q1B, alt: '태도', backImg: verticalBack },
        {  img: r1q1C, alt: '기능', backImg: verticalBack },
      ],
      answer: 0,
      explainCorrect: '인성은 개인의 내면적인 성품과 관련된 능력으로 자신과 타인, 사회와의 관계 속에서 바람직한 가치관과 태도를 가지고 행동하는 능력을 말해요.',
      explainWrong: '인성은 개인의 내면적인 성품과 관련된 능력으로 자신과 타인, 사회와의 관계 속에서 바람직한 가치관과 태도를 가지고 행동하는 능력을 말해요.',
      delayMs: 4000,
    },
    {
      q: '다음 중 아래 설명에 부합하는 카드는?',
      desc: '제한된 시간 안에 효율적으로 일처리를 조율하는 능력',
      options: [
        {  img: r1q2A, alt: '가 이미지', backImg: verticalBack },
        {  img: r1q2B, alt: '나 이미지', backImg: verticalBack },
        {  img: r1q2C, alt: '다 이미지', backImg: verticalBack },
        {  img: r1q2D, alt: '창의성', backImg: verticalBack}
      ],
      answer: 0,
      explainCorrect: '정답이에요. 시간 관리 능력은 제한된 시간 안에 효율적으로 일처리를 조율하는 능력을 말해요.',
      explainWrong: '아쉬워요. 시간 관리 능력은 제한된 시간 안에 효율적으로 일처리를 조율하는 능력을 말해요.',
    },
    {
      q: '제시상황에 적절한 응대를 찾아 연결하세요.',

      desc: '아동 동반 고객이 방문할 경우',
      options: [
        { label: '', img: r1q3X, alt: 'X 이미지', backImg: horizontalBack, caption: "편견없이 일반 좌석으로 안내한다." },
        { label: '', img: r1q3Y, alt: 'Y 이미지', backImg: horizontalBack, caption: "소음에 대비해 출입문 근처 자리를 안내한다." },
        { label: '', img: r1q3Z, alt: 'Z 이미지', backImg: horizontalBack, caption:"아동용 의자가 있는 좌석으로 안내한다."
         },
      ],
      answer: 2,
      explainCorrect: '아동 동반 고객이 방문할 경우, 아동용 의자가 있는 좌석 쪽으로 안내하거나 아동용 의자를 제공해드려야해요.',
      explainWrong: '아동 동반 고객이 방문할 경우, 아동용 의자가 있는 좌석 쪽으로 안내하거나 아동용 의자를 제공해드려야해요.',
    },
  ],
  2: [
    {
      q: '다음 중 아래 설명에 부합하는 카드는?',
      desc: '고객, 동료 등의 입장을 헤아리고 먼저 생각하는 마음',
      options: [
        {  img: r2q1A, alt: 'A1 이미지', backImg: verticalBack },
        {  img: r2q1B, alt: 'B1 이미지', backImg: verticalBack },
        {  img: r2q1C, alt: 'C1 이미지', backImg: verticalBack },
        {  img: r2q1D, alt: 'D1 이미지', backImg: verticalBack },
      ],
      answer: 3,
      explainCorrect: '배려심은 고객, 동료 등의 입장을 헤아리고 먼저 생각하는 마음을 말해요.',
      explainWrong: '배려심은 고객, 동료 등의 입장을 헤아리고 먼저 생각하는 마음을 말해요.',
    },
    {
      q: '다음 중 CJ 인재상의 4대 기준에 해당하지 않는 것은?',
      options: [
        {  img: r2q2A, alt: 'A2 이미지', backImg: verticalBack },
        {  img: r2q2B, alt: 'B2 이미지', backImg: verticalBack },
        {  img: r2q2C, alt: 'C2 이미지', backImg: verticalBack },
        {  img: r2q2D, alt: 'D2 이미지', backImg: verticalBack },
      ],
      answer: 1,
      explainCorrect: 'CJ 인재상의 4대 기준은 임직원 누구나 지켜야할 원칙이며, 정직, 열정, 창의, 존중으로 이루어져있어요.',
      explainWrong: 'CJ 인재상의 4대 기준은 임직원 누구나 지켜야할 원칙이며, 정직, 열정, 창의, 존중으로 이루어져있어요.',
      delayMs: 2500,
    },
    {
      q: '제시상황에 적절한 응대를 찾아 연결하세요.',
      desc: '빵이 상했다는 컴플레인을 받은 상황',
      options: [
        { label: '', img: r2q3A, alt: 'A3 이미지', backImg: horizontalBack, caption:"사과 후 새로운 빵으로 교체해드린다." },
        { label: '', img: r2q3B, alt: 'B3 이미지', backImg: horizontalBack, caption:"원칙적으로 환불은 어렵다고 안내한다." },
        { label: '', img: r2q3C, alt: 'C3 이미지', backImg: horizontalBack, caption:"다른 토핑을 얹어 다시 제공한다." },
      ],
      answer: 0,
      explainCorrect: '제공된 음식에 문제가 있을 경우, 죄송한 마음을 표현 후 새로운 제품으로 교환해드리는 것이 적절한 응대입니다.',
      explainWrong: '제공된 음식에 문제가 있을 경우, 죄송한 마음을 표현 후 새로운 제품으로 교환해드리는 것이 적절한 응대입니다.',
    },
  ],
  3: [
    {
      q: '다음 중 아래 설명에 부합하는 카드는?',
      desc: '상황 변화나 고객, 팀 동료 특성을 빠르게 파악하는 능력',
      options: [
        {  img: r3q1A, alt: 'A1 이미지', backImg: verticalBack },
        {  img: r3q1B, alt: 'B1 이미지', backImg: verticalBack },
        {  img: r3q1C, alt: 'C1 이미지', backImg: verticalBack },
        {  img: r3q1D, alt: 'D1 이미지', backImg: verticalBack },
      ],
      answer: 0,
      explainCorrect: '관찰력은 상황 변화나 고객, 팀 동료 특성을  빠르게 파악하는 능력을 말해요.',
      explainWrong: '관찰력은 상황 변화나 고객, 팀 동료 특성을  빠르게 파악하는 능력을 말해요.',
    },
    {
      q: '다음 중 CJ人의 인성적 요소에 해당하지 않는 것은?',
      options: [
        {  img: r3q2A, alt: 'A2 이미지', backImg: verticalBack },
        {  img: r3q2B, alt: 'B2 이미지', backImg: verticalBack },
        {  img: r3q2C, alt: 'C2 이미지', backImg: verticalBack },
        {  img: r3q2D, alt: 'C2 이미지', backImg: verticalBack },
      ],
      answer: 1,
      explanation: 'CJ人의 인성적 요소는 정직함, 책임감, 절제력, 배려심, 이해심, 유머 감각, 끈기, 성실함으로 구성되어있어요.',
    },
    {
      q: '제시상황에 적절한 응대를 찾아 연결하세요.',
      desc: '예약 손님의 자리가 없는 상황',
      options: [
        { label: '', img: r3q3A3, alt: 'A3 이미지', backImg: horizontalBack, caption:"사과 후, 재방문을 요청드린다." },
        { label: '', img: r3q3B3, alt: 'B3 이미지', backImg: horizontalBack, caption:"대기 좌석 쪽으로 안내하고 사례를 제공한다." },
        { label: '', img: r3q3C3, alt: 'C3 이미지', backImg: horizontalBack, caption:"빠르게 임시좌석을 만들어 제공한다." },
      ],
      answer: 1,
      explanation: '예약 손님의 자리가 없는 경우, 대기 좌석 쪽으로 안내하고 사례를 제공하는 등 양해를 구하는 것이 적절한 응대입니다.',
      explainCorrect: '정답입니다. 예약 손님의 자리가 없는 경우, 대기 좌석 쪽으로 안내하고 사례를 제공하는 등 양해를 구하는 것이 적절한 응대입니다.',
      explainWrong: '오답이에요. 예약 손님의 자리가 없는 경우, 대기 좌석 쪽으로 안내하고 사례를 제공하는 등 양해를 구하는 것이 적절한 응대입니다.',
    },
  ],
};