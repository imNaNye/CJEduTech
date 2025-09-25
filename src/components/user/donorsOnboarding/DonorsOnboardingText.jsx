export default function DonorsOnboardingText({heading="heading", p="p"}){
    return(
        <div className="donors-onboarding-text">
            <h3>{heading}</h3>
            <p>{p}</p>
        </div>
    )
}