import ChatTimer from "./ChatTimer";
import SubjectOverview from "./SubjectOverview";

export default function ChatOverView(){
    return(
        <div className="chat-overview">
            <div className="overview-top">
                <ChatTimer/>
                <SubjectOverview/>
            </div>
  <section className="principle-icons">
    <div className="principle-icon">
      {/* cakes for 정직 */}
      {/* <img className="cake-img" src={"../../../assets/images/discussion/cake_justice.png"} alt="정직 케이크"/> */}
      <img className="badge-img" src={"/src/assets/images/discussion/badge_1.png"} alt="정직"/>
    </div>
    <div className="principle-icon">
      {/* <img className="cake-img" src={"../../../assets/images/discussion/cake_passion.png"} alt="열정 케이크"/> */}
      <img className="badge-img" src={"/src/assets/images/discussion/badge_2.png"} alt="열정"/>
    </div>
    <div className="principle-icon">
      {/* <img className="cake-img" src={"../../../assets/images/discussion/cake_creed.png"} alt="창의 케이크"/> */}
      <img className="badge-img" src={"/src/assets/images/discussion/badge_3.png"} alt="창의"/>
    </div>
    <div className="principle-icon">
      {/* <img className="cake-img" src={"../../../assets/images/discussion/cake_respect.png"} alt="존중 케이크"/> */}
      <img className="cake-img" src={"/src/assets/images/discussion/cake_1.png"} alt="존중 케이크"/>
      <img className="badge-img" src={"/src/assets/images/discussion/badge_4.png"} alt="존중"/>
    </div>
  </section>
        </div>
    );
}