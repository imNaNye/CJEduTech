import QuizAnswerItem from "./quizAnswerItem";

export default function QuizAnswerScroll({answers}){
    return(
        <div className = "quiz-answer-scroll">
            {answers.map((answer, index) => (
                <QuizAnswerItem
                    key = {index}
                    questionNumber={index + 1}
                    isCorrect={answer.isCorrect}
                    userAnswer={answer.userAnswer}
                    correctAnswer={answer.correctAnswer}
                />
            ))}
        </div>
    );
}

//answers 전달형태
// const answers = [
//   { isCorrect: true, userAnswer: 'A', correctAnswer: 'A' },
//   { isCorrect: false, userAnswer: 'B', correctAnswer: 'C' },
//   ...
// ];