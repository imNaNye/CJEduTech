import ChatOverview from "./ChatOverview";
import ChatContainer from "./ChatContainer";
import "./aiDiscussion.css";

export default function AiDiscussionMain() {
  return (
    <div className="ai-discussion-main">
      <ChatOverview />
      <ChatContainer />
    </div>
  );
}