//mock 데이터 전달하여 미리보기 가능하도록 구성

import { useNavigate } from "react-router-dom";
import QuizScoreBox from "../../components/user/quizResult/quizScoreBox";
import QuizAnswerScroll from "../../components/user/quizResult/quizAnswerScroll";
import PageHeader from "../../components/common/PageHeader";
import '../../components/user/quizResult/quizResult.css'

export default function QuizResultPage() {
    const navigate = useNavigate();

    const mockAnswers = [
        { isCorrect: true, userAnswer: 'A', correctAnswer: 'A' },
        { isCorrect: false, userAnswer: 'B', correctAnswer: 'C' }
    ];

    return (
        <div className="quiz-result-page">
            <PageHeader title="CJ 인재상 퀴즈 결과"/>
            <div className="quiz-result-main">
                <div>
                    <QuizScoreBox correctCount={2} characterName="홍길동" score={80} />
                </div>
                <div>
                    <QuizAnswerScroll answers={mockAnswers} />
                </div>
            </div>
            <div className="quiz-result-footer">
                <button className="next-step-button" onClick={() => navigate('/user/AIDiscussion')}>
                    다음
                </button>
            </div>
        </div>
    );
}