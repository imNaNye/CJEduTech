import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRoundStep } from '../../contexts/RoundStepContext';
import { quizQuestions } from '../../components/user/quiz/quizQuestions';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '@/api/quiz';
import '@/components/user/quiz/quiz.css'

const QUESTIONS_PER_ROUND = 3;
const SECONDS_PER_QUESTION = 20;
const FEEDBACK_MS = 8000; // 정답/오답 피드백 유지 시간 (ms)
const REVEAL_MS = 600;    // 선택 → 공개 대기
const RESULT_MS = 600;    // 공개 → 결과 대기
const PREVIEW_MS = 3000;  // 최초 3초간 카드 앞면 미리보기(선택 불가)

// phase: 'preview' | 'select' | 'choices' | 'result'
export default function QuizPage() {
  const { round, step, setStep } = useRoundStep();
  const navigate = useNavigate();
  const questions = quizQuestions[round] ?? [];

  const [idx, setIdx] = useState(0);                   // 현재 문제 인덱스
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [running, setRunning] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);    // null | boolean
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState('preview');
  const [picked, setPicked] = useState(null);

  const tickRef = useRef(null);
  const optionRefs = useRef([]);
  const feedbackTimeoutRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const feedbackRef = useRef(null);

  // helper: option을 객체 형태로 통일 (문자열 -> { label })
  const toOpt = (opt) => (typeof opt === 'string' ? { label: opt } : opt || {});

  // 라운드/스텝 진입 시 초기화 (step===1에서만 이 페이지가 렌더된다고 가정)
  useEffect(() => {
    setIdx(0);
    setCorrectCount(0);
    setPicked(null);
    setPhase('preview');
    setSecondsLeft(SECONDS_PER_QUESTION);
    setAnswered(false);
    setIsCorrect(null);
    setRunning(false);

    // 최초 미리보기 → 선택 단계로 전환 후 타이머 시작
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => {
      setPhase('select');
      resetAndStart();
    }, PREVIEW_MS);

    return () => {
      clearInterval(tickRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      feedbackTimeoutRef.current = null;
      previewTimeoutRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, step]);

  const resetAndStart = () => {
    clearInterval(tickRef.current);
    setSecondsLeft(SECONDS_PER_QUESTION);
    setAnswered(false);
    setIsCorrect(null);
    setRunning(true);
    setPicked(null);

    tickRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // 타임아웃 → 오답 처리 후 다음 문제로 이동
          clearInterval(tickRef.current);
          setRunning(false);
          setAnswered(true);
          setIsCorrect(false);
          // 공개 단계를 잠깐 스킵하고 결과로 바로 이동(디자인에 맞게 조절 가능)
          setPhase('result');
          if (feedbackRef.current) feedbackRef.current.focus();
          if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
          const delay = (questions[idx]?.delayMs ?? FEEDBACK_MS);
          feedbackTimeoutRef.current = setTimeout(() => {
            goNextQuestion();
          }, delay);
          return SECONDS_PER_QUESTION;
        }
        return prev - 1;
      });
    }, 1000);

    // 첫 카드에 포커스(선택 단계일 때만 의미)
    setTimeout(() => {
      if (optionRefs.current && optionRefs.current[0]) {
        optionRefs.current[0].focus();
      }
    }, 0);
  };

  const stopTimer = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRunning(false);
  };

  const judge = useMemo(() => {
    return (selectedIdx) => {
      const q = questions[idx];
      if (!q) return false;
      return q.answer === selectedIdx;
    };
  }, [questions, idx]);

  // 카드 클릭: 선택 → 공개 → 결과 → 자동 다음
  const onPickCard = (selectedIdx) => {
    if (phase !== 'select' || answered) return;
    stopTimer();
    setPicked(selectedIdx);
    setPhase('choices');

    setTimeout(() => {
      const ok = judge(selectedIdx);
      setIsCorrect(ok);
      if (ok) setCorrectCount((c) => c + 1);
      setAnswered(true);
      setPhase('result');

      if (feedbackRef.current) feedbackRef.current.focus();
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      const delay = (questions[idx]?.delayMs ?? FEEDBACK_MS);
      feedbackTimeoutRef.current = setTimeout(() => {
        goNextQuestion();
      }, delay);
    }, REVEAL_MS + RESULT_MS);
  };

  const goNextQuestion = async () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (idx < QUESTIONS_PER_ROUND - 1) {
      setIdx(i => i + 1);
      // 다음 문제: 다시 미리보기 → 선택 → 타이머 시작
      setPhase('preview');
      setPicked(null);
      setAnswered(false);
      setIsCorrect(null);
      setRunning(false);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = setTimeout(() => {
        setPhase('select');
        resetAndStart();
      }, PREVIEW_MS);
    } else {
      // 퀴즈(스텝1) 종료 → 서버에 점수 저장 후 스텝2로 전환
      stopTimer();
      try {
        await quizApi.submitRoundScore({
          round,
          correct: correctCount,
          total: QUESTIONS_PER_ROUND,
        });
      } catch (e) {
        console.error('점수 저장 실패:', e);
      }
      setStep(2);
      navigate('/user/roundIndicator', { replace: true });
    }
  };

  const current = questions[idx];
  if (!current) return <div>이 라운드의 퀴즈 데이터가 없습니다.</div>;

  return (
    <section>
      <header>
        <div>Round {round}</div>
        <div>Question {idx + 1} / {QUESTIONS_PER_ROUND}</div>
        <div>Timer {secondsLeft}s</div>
      </header>

      <div>
        <h3>{current.q}</h3>
        {current.desc && (
          <p className="quiz-desc">{current.desc}</p>
        )}

        {/* PREVIEW: 앞면 3초 공개 (선택 불가) */}
        {phase === 'preview' && (
          <ul className="quiz-cards open" aria-label="카드 미리보기">
            {current.options.map((opt, i) => {
              const item = toOpt(opt);
              return (
                <li key={i}>
                  <div className="card-front preview" aria-hidden>
                    {item.img && (
                      <img className="opt-img" src={item.img} alt={item.alt || item.label || `옵션 ${i+1}`} />
                    )}
                    {item.label && <div className="opt-label">{item.label}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* SELECT: 등뒤 카드 3개, 선택 가능 */}
        {phase === 'select' && (
          <ul className="quiz-cards" aria-label="선택할 카드">
            {[0,1,2].map((i) => (
              <li key={i}>
                <button
                  ref={(el) => (optionRefs.current[i] = el)}
                  className="card-back"
                  disabled={!running}
                  aria-disabled={!running}
                  onClick={() => onPickCard(i)}
                >
                  {(() => {
                    const item = toOpt(current.options[i]);
                    if (item.backImg) {
                      return <img className="opt-back-img" src={item.backImg} alt={item.alt || `옵션 ${i+1} 뒷면`} />;
                    }
                    return null;
                  })()}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* CHOICES: 앞면 모두 공개, 선택한 카드 강조 */}
        {phase === 'choices' && (
          <ul className="quiz-cards open" aria-label="선택 결과 공개">
            {current.options.map((opt, i) => {
              const item = toOpt(opt);
              return (
                <li key={i}>
                  <div className={`card-front ${picked === i ? 'picked' : ''}`}>
                    {item.img && (
                      <img className="opt-img" src={item.img} alt={item.alt || item.label || `옵션 ${i+1}`} />
                    )}
                    {item.label && <div className="opt-label">{item.label}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* RESULT: 큰 O/X + 해설 */}
      {phase === 'result' && (
        <div
          ref={feedbackRef}
          role="status"
          aria-live="polite"
          tabIndex={-1}
          className="quiz-result"
        >
          <div className={`big-mark ${isCorrect ? 'ok' : 'no'}`}>
            {isCorrect ? 'O' : 'X'}
          </div>
          {(() => {
            const q = current;
            const text = isCorrect
              ? (q?.explainCorrect ?? q?.explanation)
              : (q?.explainWrong ?? q?.explanation);
            return text ? <p className="quiz-explain">{text}</p> : null;
          })()}
        </div>
      )}

      <div>
        <button onClick={goNextQuestion} disabled={phase !== 'result'}>다음 문제</button>
      </div>
    </section>
  );
}