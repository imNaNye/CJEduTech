// src/pages/UserPage/QuizPage.jsx
import '../../components/user/quiz/quiz.css';
import PageHeader from '../../components/common/PageHeader.jsx';
import QuizQuestionCard from '../../components/user/quiz/QuizQuestionCard.jsx';
import QuizTimer from '../../components/user/quiz/QuizTimer.jsx';
import ProgressBar from '../../components/user/quiz/ProgressBar.jsx';
import NextButton from '../../components/user/quiz/NextButton.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

const sampleQuiz = {
  questionNumber: 1,
  questionText: "다람쥐 헌 쳇바퀴에 올라타?",
  options: [
    "다람쥐 헌 쳇바퀴에 올라타.",
    "다람쥐 헌 쳇바퀴에 올라타.",
    "다람쥐 헌 쳇바퀴에 올라타.",
    "다람쥐 헌 쳇바퀴에 올라타."
  ]
};

export default function QuizPage() {
    const navigate = useNavigate();
    
  return (
    <div className="quiz-page">
      <PageHeader title="CJ 인재상 퀴즈" />
      <div className="quiz-body">
        <ProgressBar />
        <QuizTimer />
        <QuizQuestionCard
            questionNumber={sampleQuiz.questionNumber}
            questionText={sampleQuiz.questionText}
            options={sampleQuiz.options}
            onSelect={(selectedIndex) => {
                console.log('선택된 보기:', selectedIndex);
            }}
        />
        <NextButton />
        <button className="skip-button" onClick={() => navigate('/user/quizResult')}>
        SKIP
        </button>
      </div>
    </div>
  );
}