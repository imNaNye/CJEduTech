import ChatTimer from "./ChatTimer";
import SubjectOverview from "./SubjectOverview";

export default function ChatOverView(){
    return(
        <div className="chat-overview">
            <ChatTimer/>
            <SubjectOverview/>
        </div>
    );
}