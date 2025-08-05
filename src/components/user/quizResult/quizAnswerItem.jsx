

export default function QuizAnswerItem({questionNumber, isCorrect, userAnswer, correctAnswer}){
    return(
        <div className={`quiz-answer-item ${isCorrect ? 'correct':'wrong'}`}>
            <div className="question-number">문제 {questionNumber}</div>
            <div className="answer-info">
                <p>내 답안: {userAnswer}</p>
                {!isCorrect && <p>정답: {correctAnswer}</p>}
            </div>
        </div>
    );

}