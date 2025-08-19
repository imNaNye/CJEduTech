export default function OnboardingText({heading="heading", p="p"}){
    return(
        <div className="onboarding-text">
            <h3>{heading}</h3>
            <p>{p}</p>
        </div>
    )
}