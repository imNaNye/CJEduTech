import MyComment from "./MyComment";
import MyBadge from "./MyBadge";
import TalentDistribution from "./TalentDistribution";


export default function ResultSummary(){
    return (
        <div className="result-summary">
            <MyComment/>
            <MyBadge/>
            <TalentDistribution/>
        </div>
    );
}