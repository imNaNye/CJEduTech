import OnboardingText from "./OnboardingText"
import logoRobot from '@/assets/images/common/logoRobot.png';

export default function OnboardingImgText(){
    return(
        <div className="onboarding-img-text">
            <img className="logo-robot" src={logoRobot}></img>
            <OnboardingText heading="오늘 교육은?" p={"오늘 교육은 CJ도너스캠프 아카데미에서 준비한 \n다양한 시청각 교육 자료들을 바탕으로, \nCJ人 으로써의 기본 소양 및 직무 지식습득을 위한 \n여러 미디어리터러시 활동들을 수행해 볼 예정입니다  "}></OnboardingText>
        </div>
    )
}