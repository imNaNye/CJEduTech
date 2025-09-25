import DonorsOnboardingText from "./DonorsOnboardingText"
import donorsLogo from '@/assets/images/common/donorsLogo.png';

export default function DonorsOnboardingImgText(){
    return(
        <div className="donors-onboarding-img-text">
            <img className="donors-logo" src={donorsLogo}></img>
            <DonorsOnboardingText heading={"<strong>CJ 도너스캠프 아카데미</strong>란?"} p={"건강한 사회인으로 성장을 꿈꾸는 청년들에게 요리, \n베이커리, 서비스 분야의 전문적인 직업 교육과 더불어 \n인성교육을 지원하여, CJ계열사 및 동종업계 취업연계를 \n통해 성공적인 자립을 돕는 ‘취업연계 교육 프로그램’입니다."}></DonorsOnboardingText>
        </div>
    )
}