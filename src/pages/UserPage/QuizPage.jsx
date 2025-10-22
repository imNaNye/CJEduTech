import React, { useEffect, useMemo, useRef, useState } from 'react';
const TOTAL_QUIZ_TIME = 150; // 2분 30초
import correctSound from '@/assets/sounds/correct.wav';
import wrongSound from '@/assets/sounds/wrong.wav';
import selectSound from '@/assets/sounds/click.wav';
import { useRoundStep } from '../../contexts/RoundStepContext';
import { quizQuestions } from '../../components/user/quiz/quizQuestions';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '@/api/quiz';
import '@/components/user/quiz/quiz.css'
import PageHeader from '@/components/common/PageHeader.jsx';

const QUESTIONS_PER_ROUND = 9;
const FEEDBACK_MS = 10000; // 정답/오답 피드백 유지 시간 (ms)
const REVEAL_MS = 600;    // 선택 → 공개 대기
const RESULT_MS = 600;    // 공개 → 결과 대기
const PREVIEW_MS = 4000;  // 최초 4초간 카드 앞면 미리보기(선택 불가)

// phase: 'preview' | 'select' | 'choices' | 'result'
export default function QuizPage() {
  const { round, step, setStep } = useRoundStep();
  const navigate = useNavigate();
  const questions = quizQuestions[round] ?? [];

  const [idx, setIdx] = useState(0);                   // 현재 문제 인덱스
  const [running, setRunning] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);    // null | boolean
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState('preview');
  const [picked, setPicked] = useState(null);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(TOTAL_QUIZ_TIME);

  const optionRefs = useRef([]);
  const feedbackTimeoutRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const totalTimerRef = useRef(null);
  const feedbackRef = useRef(null);

  // --- Safari-friendly audio handling: lazy init after first user gesture, reuse single element per sound
  const audioUnlockedRef = useRef(false);
  const audioElsRef = useRef({ correct: null, wrong: null, select: null });

  const ensureAudioUnlocked = () => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    // create audio elements lazily
    ['correct','wrong','select'].forEach((k) => {
      let src = selectSound;
      if (k === 'correct') src = correctSound;
      if (k === 'wrong') src = wrongSound;
      const a = new Audio(src);
      a.preload = 'auto';
      a.load?.();
      audioElsRef.current[k] = a;
    });
  };

  const playSound = (type) => {
    try {
      ensureAudioUnlocked();
      const a = audioElsRef.current[type];
      if (!a) return;
      // rewind and play; Safari prefers pause->seek->play
      try { a.pause(); } catch {}
      try { a.currentTime = 0; } catch {}
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {}
  };

  // helper: option을 객체 형태로 통일 (문자열 -> { label })
  const toOpt = (opt) => (typeof opt === 'string' ? { label: opt } : opt || {});

  // 라운드/스텝 진입 시 초기화 (step===1에서만 이 페이지가 렌더된다고 가정)
  useEffect(() => {
    setIdx(0);
    setCorrectCount(0);
    setPicked(null);
    setPhase('preview');
    setAnswered(false);
    setIsCorrect(null);
    setRunning(false);
    setTotalSecondsLeft(TOTAL_QUIZ_TIME);
    setStep(3);

    // 최초 미리보기 → 선택 단계로 전환
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => {
      setPhase('select');
      setAnswered(false);
      setIsCorrect(null);
      setRunning(true);
      setPicked(null);
      // 첫 카드에 포커스(선택 단계일 때만 의미)
      setTimeout(() => {
        if (optionRefs.current && optionRefs.current[0]) {
          optionRefs.current[0].focus();
        }
      }, 0);
    }, PREVIEW_MS);

    // total countdown timer (store ref for robust cleanup)
    totalTimerRef.current = setInterval(() => {
      setTotalSecondsLeft(prev => {
        if (prev <= 1) {
          if (totalTimerRef.current) clearInterval(totalTimerRef.current);
          setRunning(false);
          navigate('/user/roundIndicator', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      if (totalTimerRef.current) { clearInterval(totalTimerRef.current); totalTimerRef.current = null; }
      feedbackTimeoutRef.current = null;
      previewTimeoutRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, step]);

  // Removed resetAndStart and stopTimer (no longer needed)

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
    setRunning(false);
    setPicked(selectedIdx);
    playSound('select');
    setPhase('choices');

    setTimeout(() => {
      const ok = judge(selectedIdx);
      setIsCorrect(ok);
      if (ok) playSound('correct'); else playSound('wrong');
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
        setAnswered(false);
        setIsCorrect(null);
        setRunning(true);
        setPicked(null);
        setTimeout(() => {
          if (optionRefs.current && optionRefs.current[0]) {
            optionRefs.current[0].focus();
          }
        }, 0);
      }, PREVIEW_MS);
    } else {
      // 퀴즈(스텝1) 종료 → 서버에 점수 저장 후 스텝2로 전환
      setRunning(false);
      try {
        await quizApi.submitRoundScore({
          round,
          correct: correctCount,
          total: QUESTIONS_PER_ROUND,
        });
      } catch (e) {
        console.error('점수 저장 실패:', e);
      }
      setStep(3);
      navigate('/user/roundIndicator', { replace: true });
    }
  };

  const current = questions[idx];

  // --- Preload images for current and next question (Safari decoding relief)
  useEffect(() => {
    const preload = (url) => {
      if (!url) return;
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
    };
    if (current && Array.isArray(current.options)) {
      current.options.forEach(opt => {
        const item = toOpt(opt);
        if (item.img) preload(item.img);
        if (item.backImg) preload(item.backImg);
      });
    }
    const nextQ = questions[idx + 1];
    if (nextQ && Array.isArray(nextQ.options)) {
      nextQ.options.forEach(opt => {
        const item = toOpt(opt);
        if (item.img) preload(item.img);
        if (item.backImg) preload(item.backImg);
      });
    }
    return () => {};
  }, [idx, current, questions]);

  // helper: Render text with line breaks as <br />
  const withLineBreaks = (text) => {
    return text.split('\n').map((line, idx) => (
      <React.Fragment key={idx}>
        {line}
        <br />
      </React.Fragment>
    ));
  };
  if (!current) {
    setStep(3);
    navigate('/user/roundIndicator', { replace: true });
    return <div>이 라운드의 퀴즈 데이터가 없습니다.</div>;
  }

  return (
    <div className="quiz">
    <PageHeader title='CJ 인재상 퀴즈'></PageHeader>
    <div className="quiz-section">
      <div className="timer-pill">
        {Math.floor(totalSecondsLeft / 60)}:{String(totalSecondsLeft % 60).padStart(2, '0')}
    </div>
      <div className='quiz-page'>
        {phase !== 'result' && (
          <>
            <h3 className='timer-h3'>Q{idx + 1}. {current.q}</h3>
            {current.desc && (
              <p className="quiz-desc">{withLineBreaks(current.desc)}</p>
            )}
          </>
        )}
        
        {/* PREVIEW: 등뒤 카드 3개 (선택 불가) */}
        {phase === 'preview' && (
          <ul className="quiz-cards" aria-label="카드 미리보기 (뒷면)">
            {current.options.map((opt, i) => {
              const item = toOpt(opt);
              return (
                <li key={i}>
                  <button
                    className="card-back preview"
                    aria-hidden
                    disabled
                  >
                    {item.backImg && (
                      <img loading="lazy" decoding="async" className="opt-back-img" src={item.backImg} alt={item.alt || `옵션 ${i+1} 뒷면`} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* SELECT: 앞면 카드 3개, 선택 가능 */}
        {phase === 'select' && (
          <ul className="quiz-cards open" aria-label="선택할 카드 (앞면)">
            {current.options.map((opt, i) => {
              const item = toOpt(opt);
              return (
                <li key={i}>
                  <button
                    ref={(el) => (optionRefs.current[i] = el)}
                    className={`card-front ${picked === i ? 'picked' : ''}`}
                    disabled={!running}
                    aria-disabled={!running}
                    onClick={() => onPickCard(i)}
                  >
                    {item.img && (
                      <img loading="lazy" decoding="async" className="opt-img" src={item.img} alt={item.alt || item.label || `옵션 ${i+1}`} />
                    )}
                    {item.label && <div className="opt-label">{item.label}</div>}
                  </button>
                  {item.caption && <div className="opt-caption">{item.caption}</div>}
                </li>
              );
            })}
          </ul>
        )}

        {/* CHOICES: 앞면 모두 공개, 선택한 카드 강조 */}
        {phase === 'choices' && (
          <ul className="quiz-cards open" aria-label="선택 결과 공개">
            {current.options.map((opt, i) => {
              const item = toOpt(opt);
              return (
                <li key={i}>
                  <div className="card-container">
                    <div className={`card-front ${picked === i ? 'picked' : ''}`}>
                      {item.img && (
                        <img loading="lazy" decoding="async" className="opt-img" src={item.img} alt={item.alt || item.label || `옵션 ${i+1}`} />
                      )}
                      {item.label && <div className="opt-label">{item.label}</div>}
                    </div>
                    {item.caption && <div className="opt-caption">{item.caption}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* RESULT: 정답 카드 + O/X + 해설 */}
        {phase === 'result' && (
          <div
            ref={feedbackRef}
            role="status"
            aria-live="polite"
            tabIndex={-1}
            className="quiz-result"
          >
            {/* Left: correct option card front */}
            <div className="result-left">
              {(() => {
                const correctIdx = current?.answer;
                const correctOpt = current?.options ? toOpt(current.options[correctIdx]) : null;
                if (!correctOpt) return null;
                return (
                  <div className="card-container">
                    <div className="card-front result-card">
                      {correctOpt.img && (
                        <img
                          loading="lazy"
                          decoding="async"
                          className="opt-img"
                          src={correctOpt.img}
                          alt={correctOpt.alt || correctOpt.label || '정답 카드'}
                        />
                      )}
                      {correctOpt.label && <div className="opt-label">{correctOpt.label}</div>}
                    </div>
                    {correctOpt.caption && <div className="opt-caption">{correctOpt.caption}</div>}
                  </div>
                );
              })()}
            </div>

            {/* Right: O/X + title + explanation */}
            <div className="result-right">
              <div className={`big-mark ${isCorrect ? 'ok' : 'no'}`}>{isCorrect ? 'O' : 'X'}</div>
              <div className={`result-title ${isCorrect ? 'ok' : 'no'}`}>
                {isCorrect ? '정답이에요!' : '오답이에요!'}
              </div>
              {(() => {
                const text = isCorrect
                  ? (current?.explainCorrect ?? current?.explanation)
                  : (current?.explainWrong ?? current?.explanation);
                return text ? <p className="quiz-explain">{withLineBreaks(text)}</p> : null;
              })()}
            </div>
          </div>
        )}
      </div> {/* end of .quiz-page */}

      <div>
        <button onClick={goNextQuestion} disabled={phase !== 'result'}>다음 문제</button>
      </div>
    </div>
    </div>
  );
}