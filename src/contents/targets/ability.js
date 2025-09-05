import abilityA from '@/assets/images/slide/abilityA.png';
import abilityB from '@/assets/images/slide/abilityB.png';
import abilityC from '@/assets/images/slide/abilityC.png';

export const abilityTargets = {
    'ability.a': {
        title: '인성',
        image: abilityA,
        postText: '개인의 내면적인 성품과 관련된 능력으로 자신과 타인, 사회와의 관계 속에서 바람직한 가치관과 태도를 가지고 행동하는 능력',
        cooldownMs: 4000
    },

    'ability.b': {
        title: '태도',
        image: abilityB,
        postText: '업무나 과제, 상황에 대한 개인의 마음가짐이나 자세와 관련된 능력',
        cooldownMs: 3000
    },

    'ability.c': {
        title: '기능',
        image: abilityC,
        postText: '특정한 직무나 과업을 효과적으로 수행하기 위해 요구되는 구체적인 지식, 기술, 능력',
        cooldownMs: 3000
    }

}