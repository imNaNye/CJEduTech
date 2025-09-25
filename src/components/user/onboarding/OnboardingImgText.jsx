import OnboardingText from "./OnboardingText"
import logoRobot from '@/assets/images/common/logoRobot.png';

export default function OnboardingImgText(){
    return(
        <div className="onboarding-img-text">
            <img className="logo-robot" src={logoRobot}></img>
            <OnboardingText heading="오늘 교육은?" p={"오늘 교육은 대한민국 미래세대인 아동 청소년의\n건강한 성장을 지원하기 위해 CJ그룹의 나눔재단에서 설립,\n운영하는 사회공헌플랫폼을 활용해 이수할 예정입니다."}></OnboardingText>
        </div>
    )
}