import DonorsOnboardingText from "./DonorsOnboardingText"
import donorsLogo from '@/assets/images/common/donorsLogo.png';

export default function DonorsOnboardingImgText(){
    return(
        <div className="donors-onboarding-img-text">
            <img className="donors-logo" src={donorsLogo}></img>
            <DonorsOnboardingText heading="오늘 교육은?" p={"오늘 교육은 대한민국 미래세대인 아동 청소년의\n건강한 성장을 지원하기 위해 CJ그룹의 나눔재단에서 설립,\n운영하는 사회공헌플랫폼을 활용해 이수할 예정입니다."}></DonorsOnboardingText>
        </div>
    )
}