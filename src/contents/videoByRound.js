// src/contents/videoByRound.js
import r1_1 from '/videos/round1_1.mov';
import r1_2 from '/videos/round1_2.mov';
import r1_3 from '/videos/round1_3.mov';
import r2_1 from '/videos/round2_1.mov';
import r2_2 from '/videos/round2_2.mov';
import r2_3 from '/videos/round2_3.mp4';
import r3_1 from '/videos/round3_1.mov';
import r3_2 from '/videos/round3_2.mov';
import r3_3 from '/videos/round3_3.mov';
import r3_4 from '/videos/round3_4.mov';
 
export const videoByRound = {
  1: [
    { title: 'ep1 - 갓 구운 빵의 비밀', src: r1_1 },
    { title: 'ep2 - T-day 할인율의 미로', src: r1_2 },
    { title: 'ep3 - 마감할인 그 이상의 가치', src: r1_3 },
    { title: 'ep4 - 예약 시스템 오류와 고객의 분노', src: r2_1 },
    { title: 'ep5 - VIPS 단체 고객의 무리한 요구', src: r2_2 },
    { title: 'ep6 - SNS 대기불만폭주! 고객경험혁신', src: r2_3 },
    { title: 'ep7 - 시그니처 폭립의 화룡점정', src: r3_1 },
    { title: 'ep8 - VIPS 주방 내 갈등해결', src: r3_2 },
    { title: 'ep9 - VIPS 칼 같은 계량의 중요성', src: r3_3 },
    { title: 'ep10 - VIPS 주방 막내의 스마트한 식자재관리', src: r3_4 },
  ],
  2: [
    { title: 'Round 2 - 예약 시스템 오류와 고객의 분노', src: r2_1 },
    { title: 'Round 2 - VIPS 단체 고객의 무리한 요구', src: r2_2 },
    { title: 'Round 2 - SNS 대기불만폭주! 고객경험혁신', src: r2_3 },
  ],
  3: [
    { title: 'Round 3 - 시그니처 폭립의 화룡점정', src: r3_1 },
    { title: 'Round 3 - VIPS 주방 내 갈등해결', src: r3_2 },
    { title: 'Round 3 - VIPS 주방 막내의 스마트한 식자재관리', src: r3_3 },
  ],
};