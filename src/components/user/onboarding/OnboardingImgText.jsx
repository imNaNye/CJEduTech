import OnboardingText from "./OnboardingText"
import logoRobot from '@/assets/images/common/logoRobot.png';

export default function OnboardingImgText(){
    return(
        <div className="onboarding-img-text">
            <img className="logo-robot" src={logoRobot}></img>
            <OnboardingText heading="오늘 이수할 교육은?" p="오늘 교육은 미래의 CJ 식음료 판매원들을 위한 이런이런 교육으로, ㅇㅇ, ㅇㅇㅇ, ㅇㅇㅇ, ㅇㅇ 총 4종류의 활동으로 이루어져있습니다. 총 m분동안 진행될 예정이며, 중간 쉬는시간 n분이 주어질 예정입니다. 바로 교육으로 넘어가볼까요?"></OnboardingText>
        </div>
    )
}