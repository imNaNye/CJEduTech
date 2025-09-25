import PageHeader from "../../components/common/PageHeader";
import DonorsOnboardingMain from "../../components/user/donorsOnboarding/DonorsOnboardingMain";
import '../../components/user/donorsOnboarding/donorsOnboarding.css'

export default function DonorsOnboardingPage(){
    return(
        <div className="donors-onboarding-page">
            <PageHeader title="Onboarding"/>
            <DonorsOnboardingMain/>
        </div>
    )
}