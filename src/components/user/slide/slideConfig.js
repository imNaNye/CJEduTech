import { abilityTargets, attitudeTargets, characterTargets, skillTargets, standardTargets } from '../../../contents/targets';

export const SlideConfig = [
    {
        id: 'ability',
        timeoutSec: 2,
        requiredTargets: ['ability.a', 'ability.b', 'ability.c'],
        targets: abilityTargets,
        data: {title: 'CJ人의 핵심 역량', text: 'CJ人으로써 다양한 직무 관련 문제를 해결하는 데 필요한 “인성과 태도, 기능(기술적) 요소”'}
    },
    {
        id: 'character',
        timeoutSec: 2,
        requiredTargets: ['character.a', 'character.b', 'character.c', 'character.d',
            'character.e', 'character.f', 'character.g', 'character.h'
        ],
        targets: characterTargets,
        data: {title: 'CJ人의 인성적 요소'}
    },
    {
        id: 'attitude',
        timeoutSec: 2,
        requiredTargets: ['attitude.a', 'attitude.b','attitude.c','attitude.d','attitude.e'],
        targets: attitudeTargets,
        data: {title: 'CJ人의 태도적 요소'}
    },
    {
        id: 'skill',
        timeoutSec: 2,
        requiredTargets: ['skill.a', 'skill.b','skill.c','skill.d','skill.e','skill.f'],
        targets: skillTargets,
        data: {title: 'CJ人의 기능적 요소'}
    },
    {
        id: 'standard',
        timeoutSec: 2,
        requiredTargets: ['standard.a', 'standard.b', 'standard.c', 'standard.d'],
        targets: standardTargets,
        data: {title: 'CJ 인재상의 4대 기준', text: 'CJ 임직원 누구나 반드시 지켜야 할 원칙이며, 인재육성의 기준'} 
    }
]