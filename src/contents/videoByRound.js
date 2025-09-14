// src/contents/videoByRound.js
import r1_1 from '/videos/round1_1.mp4';
import r1_2 from '/videos/round1_2.mp4';
import r1_3 from '/videos/round1_3.mp4';

// 필요 시 라운드 2/3도 같은 방식으로 import 하세요.
// 현재는 예시로 라운드 1의 영상들을 재활용합니다.
export const videoByRound = {
  1: [
    { title: '1라운드 영상 1', src: r1_1 },
    { title: '1라운드 영상 2', src: r1_2 },
    { title: '1라운드 영상 3', src: r1_3 },
  ],
  2: [
    { title: '2라운드 영상 1', src: r1_1 },
    { title: '2라운드 영상 2', src: r1_2 },
  ],
  3: [
    { title: '3라운드 영상 1', src: r1_1 },
  ],
};