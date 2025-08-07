import FoodView from "./FoodView";
import SavePDFButton from "./SavePDFButton";
import NextSessionButton from "./NextSessionButton";
import ResultSummary from "./ResultSummary";
import "./discussionResult.css";

export default function DiscussionResultMain() {
  return (
    <div className="discussion-result-main">
      <div className="result-body">
        <FoodView />
        <ResultSummary/>
      </div>
      <div className="result-buttons">
        <SavePDFButton />
        <NextSessionButton />
      </div>
    </div>
  );
}