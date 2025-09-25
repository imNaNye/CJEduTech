export default function DonorsOnboardingText({heading="heading", p="p"}){
    return(
        <div className="donors-onboarding-text">
            <h3 dangerouslySetInnerHTML={{ __html: heading }} />
            <p>{p}</p>
        </div>
    )
}