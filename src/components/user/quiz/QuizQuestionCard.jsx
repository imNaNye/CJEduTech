// src/components/user/quiz/QuizQuestionCard.jsx
//퀴즈 문제와 답변 선택 버튼들

// questionNumber : 현재 퀴즈 번호
// questionText : 문제 텍스트
// options : 보기 배열 ex.["정직", "열정", ..]
// onSelect(index) : 보기 클릭 시 실행할 함수. 선택된 인덱스를 넘김

export default function QuizQuestionCard({ questionNumber, questionText, options, onSelect }) {
  return (
    <div className="quiz-question-card">
      <h3 className="question-number">Q.{questionNumber}</h3>
      <p className="question-text">{questionText}</p>

      <div className="quiz-option-list">
        {options.map((option, index) => (
          <button
            key={index}
            className="quiz-option-button"
            onClick={() => onSelect(index)}
          >
            {index + 1}. {option}
          </button>
        ))}
      </div>
    </div>
  );
}