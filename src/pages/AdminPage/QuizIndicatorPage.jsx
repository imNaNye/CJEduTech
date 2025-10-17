import IndicatorNextButton from "../../components/admin/indicatorNextButton";
import PageHeader from "../../components/common/PageHeader";
import '@/components/admin/quizIndicator/quizIndicator.css';

export default function QuizIndicatorPage(){
    return (
        <div className="quiz-indicator-page">
            <PageHeader/>
            <IndicatorNextButton/>
        </div>
    )
}