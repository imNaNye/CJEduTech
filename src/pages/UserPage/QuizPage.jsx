import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRoundStep } from '../../contexts/RoundStepContext';
import { quizQuestions } from '../../components/user/quiz/quizQuestions';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '@/api/quiz';

const QUESTIONS_PER_ROUND = 3;
const SECONDS_PER_QUESTION = 20;
const FEEDBACK_MS = 1500; // 정답/오답 피드백 유지 시간 (ms)

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
  const tickRef = useRef(null);
  const optionRefs = useRef([]);
  const feedbackTimeoutRef = useRef(null);
  const feedbackRef = useRef(null);

  // 라운드/스텝 진입 시 초기화 (step===1에서만 이 페이지가 렌더된다고 가정)
  useEffect(() => {
    setIdx(0);
    setCorrectCount(0);
    resetAndStart();
    // cleanup on unmount
    return () => {
      clearInterval(tickRef.current);
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, step]);

  const resetAndStart = () => {
    clearInterval(tickRef.current);
    setSecondsLeft(SECONDS_PER_QUESTION);
    setAnswered(false);
    setIsCorrect(null);
    setRunning(true);
    tickRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // 타임아웃 → 오답 처리 후 다음 문제로 이동
          clearInterval(tickRef.current);
          setRunning(false);
          setAnswered(true);
          setIsCorrect(false);
          // 피드백을 잠시 보여주고 자동 다음 문제
          setTimeout(() => {
            if (feedbackRef.current) feedbackRef.current.focus();
            if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = setTimeout(() => {
              goNextQuestion();
            }, FEEDBACK_MS);
          }, 0);
          return SECONDS_PER_QUESTION;
        }
        return prev - 1;
      });
    }, 1000);
    // 첫 보기로 포커스 이동 (접근성)
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

  const submitAnswer = (selectedIdx) => {
    if (answered) return;
    stopTimer();
    const ok = judge(selectedIdx);
    setIsCorrect(ok);
    if (ok) setCorrectCount((c) => c + 1);
    setAnswered(true);
    if (feedbackRef.current) feedbackRef.current.focus();
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      goNextQuestion();
    }, FEEDBACK_MS);
  };

  const goNextQuestion = async () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (idx < QUESTIONS_PER_ROUND - 1) {
      setIdx(i => i + 1);
      resetAndStart();
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
        <ul>
          {current.options.map((opt, i) => (
            <li key={i}>
              <button
                ref={(el) => (optionRefs.current[i] = el)}
                disabled={answered || !running}
                aria-disabled={answered || !running}
                onClick={() => submitAnswer(i)}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {answered && (
        <div
          ref={feedbackRef}
          role="status"
          aria-live="polite"
          tabIndex={-1}
        >
          {isCorrect ? '정답!' : '오답!'}
        </div>
      )}

      <div>
        <button onClick={goNextQuestion} disabled={!answered}>다음 문제</button>
      </div>
    </section>
  );
}