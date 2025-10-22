import { abilityTargets, attitudeTargets, characterTargets, skillTargets, standardTargets } from '../../../contents/targets';

export const SlideConfig = [
    {
        id: 'ability',
        timeoutSec: 45,
        requiredTargets: ['ability.a', 'ability.b', 'ability.c'],
        targets: abilityTargets,
        flipTimings: [19,29,35],
        data: {
            title: '3가지 <span class="highlight">핵심 구성요소</span>',
            text: '<strong>건강한 사회인</strong>으로써 갖추어야 할 <strong>기본 역량</strong>'
        }
    },
    {
        id: 'character',
        timeoutSec: 75,
        requiredTargets: ['character.a', 'character.b', 'character.c', 'character.d',
            'character.e', 'character.f', 'character.g', 'character.h'
        ],
        flipTimings:[31,35,41,46,52,57,61,68],
        targets: characterTargets,
        data: {
            title: '8가지 <span class="highlight">주요 구성요소</span>',
            text: '<strong>CJ人</strong>으로써 갖추어야 할 <strong>인성역량</strong>'
        }
    },
    {
        id: 'attitude',
        timeoutSec: 56,
        flipTimings:[27,33,38,43,47],
        requiredTargets: ['attitude.a', 'attitude.b','attitude.c','attitude.d','attitude.e'],
        targets: attitudeTargets,
        data: {
            title: '5가지 <span class="highlight">주요 구성요소</span>',
            text: '<strong>CJ人</strong>으로써 갖추어야 할 <strong>태도역량</strong>'
        }
    },
    {
        id: 'skill',
        timeoutSec: 61,
        flipTimings:[28,33,38,43,48,54],
        requiredTargets: ['skill.a', 'skill.b','skill.c','skill.d','skill.e','skill.f'],
        targets: skillTargets,
        data: {
            title: '6가지 <span class="highlight">주요 구성요소</span>',
            text: '<strong>CJ人</strong>으로써 갖추어야 할 <strong>기능(기술)역량</strong>'
        }
    },
    {
        id: 'standard',
        timeoutSec: 65,
        flipTimings:[44,50,56,60],
        requiredTargets: ['standard.a', 'standard.b', 'standard.c', 'standard.d'],
        targets: standardTargets,
        data: {
            title: 'CJ 인재상의 <span class="highlight">4대 기준</span>',
            text: '<strong>CJ人</strong>이라면 지켜야 할 <strong>생각과 행동의 4가지 원칙</strong>'
        }
    }
]