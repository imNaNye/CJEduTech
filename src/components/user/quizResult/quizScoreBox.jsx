//correctCount = 퀴즈 맞춘 문제 개수

export default function QuizScoreBox({correctCount, characterName, score}){ 
    return(
        <div className="quiz-score-box">
            <div className="quiz-result-summary">  {/*퀴즈에서 맞춘 문제 갯수 알려주는 부분 */}
                <p>총 {correctCount}문제 맞췄어요!</p>
            </div>
            <div className="character-score-wrapper"> {/* 캐릭터 이미지, 아래쪽 점수 묶어주는 컨테이너*/}
                <div className="character-image-circle">
                </div>
                <div className="characterNameScore">
                    <p>{characterName}</p>
                    <p>{score}점</p>
                </div>
            </div>
        </div>
    );
}