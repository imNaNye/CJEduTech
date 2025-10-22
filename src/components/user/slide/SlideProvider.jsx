// src/slides/SlideProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRoundStep } from '@/contexts/RoundStepContext';
import { useNavigate } from 'react-router-dom';

const SlideCtx = createContext(null);

export function SlideProvider({ children, config, defaultCooldownMs = 0, blockPolicy = 'global' }) {
  /**
   * blockPolicy:
   * - 'global': 어떤 타겟을 누른 뒤 해당 타겟의 cooldown 동안 "모든" 타겟 클릭 금지
   * - 'none': 쿨다운 무시(기본 로직만) — 필요시 확장
   * (원하시면 'perTarget' 등 다른 정책도 추가 가능)
   */

  const [pageIndex, setPageIndex] = useState(0);
  const [clickedSet, setClickedSet] = useState(() => new Set());
  const timerRef = useRef(null);
  const autoTimerRef = useRef(null);
  const autoDeadlineRef = useRef(0);
  const audioRef = useRef(null);
  const currentCardIdxRef = useRef(-1);
  const flipTimersRef = useRef([]);

  // 전역 잠금: 다음 클릭 가능 시각(Unix ms). now < nextAllowedAt 이면 잠김
  const [nextAllowedAt, setNextAllowedAt] = useState(0);

  const [flipping, setFlipping] = useState(false);
  const [paused, setPaused] = useState(false);

  const { setStep } = useRoundStep();
  const navigate = useNavigate();

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleClick);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const page = config[pageIndex] ?? null;
  const required = page?.requiredTargets ?? [];
  const requiredCount = required.length;
  // Force a hardcoded 10-second timeout after all targets are clicked
  const timeoutMs = 7000;

  useEffect(() => {
    setClickedSet(new Set());
    setNextAllowedAt(0);
    setFlipping(false); // reset flip status
    setPaused(false); // reset pause on page change
    currentCardIdxRef.current = -1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    autoDeadlineRef.current = 0;
    // stop and release previous audio
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current = null;
    }
  }, [pageIndex]);

  useEffect(() => {
    if (!page) return;
    if (process.env.NODE_ENV !== 'production') {
      const missing = required.filter(id => !(page.targets && page.targets[id]));
      if (missing.length > 0) {
        console.warn('[SlideProvider] missing target content for ids:', missing, 'in page', page.id);
      }
    }
  }, [page, required]);

  const isBlocked = useMemo(() => {
    const nowTs = Date.now();
    return blockPolicy === 'global' && nowTs < nextAllowedAt;
  }, [blockPolicy, nextAllowedAt]);
  const msRemaining = Math.max(0, nextAllowedAt - Date.now());

  const getCooldownMs = (id) => {
    const cd = page?.targets?.[id]?.cooldownMs;
    return typeof cd === 'number' ? cd : defaultCooldownMs;
  };

  const markClicked = () => ({ ok: false, reason: 'disabled' });

  const allDone = requiredCount > 0 && clickedSet.size >= requiredCount;

  useEffect(() => {
    if (!page || !hasInteracted) return;

    // Play slide audio on mount only if user has interacted
    if (page?.id) {
      const audio = new Audio(`/sounds/narration/merged${page.id}.mp3`);
      audio.playbackRate = 1.1;
      audioRef.current = audio;
      audio.play().catch(err => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Audio playback failed:', err);
        }
      });
    }

    flipTimersRef.current = [];
    if (Array.isArray(page.flipTimings)) {
      const totalCards = page.flipTimings.length;
      page.flipTimings.forEach((sec, index) => {
        const timer = setTimeout(() => {
          // 시간 기반 플립 시에도 단 하나만 펼쳐지도록 다른 카드는 모두 접기
          for (let i = 0; i < totalCards; i++) {
            if (i !== index) window.dispatchEvent(new CustomEvent(`unflipTarget-${i}`));
          }
          window.dispatchEvent(new CustomEvent(`flipTarget-${index}`));
          window.dispatchEvent(new CustomEvent(`highlightTarget-${index}`));
          if (index > 0) {
            window.dispatchEvent(new CustomEvent(`unhighlightTarget-${index - 1}`));
          }
          currentCardIdxRef.current = index;
        }, sec * 1000);
        flipTimersRef.current.push(timer);
      });
    }

    // set next deadline & timer (respect pause)
    const now = Date.now();
    autoDeadlineRef.current = now + ((page.timeoutSec ?? 7) * 1000);
    if (!paused) {
      const remain = Math.max(0, autoDeadlineRef.current - Date.now());
      autoTimerRef.current = setTimeout(() => {
        const isLastPage = pageIndex >= config.length - 1;
        if (isLastPage) {
          setStep(2);
          navigate('/admin/afterSlide');
        } else {
          setPageIndex(i => i + 1);
        }
      }, remain);
    }

    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      flipTimersRef.current.forEach(clearTimeout);
      flipTimersRef.current = [];
      // stop audio on unmount of page
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
        audioRef.current = null;
      }
    };
  }, [pageIndex, page, hasInteracted]);

  // when paused toggles, re-arm or clear the auto-advance timer
  useEffect(() => {
    if (!page) return;
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (!paused && autoDeadlineRef.current > 0) {
      const remain = Math.max(0, autoDeadlineRef.current - Date.now());
      autoTimerRef.current = setTimeout(() => {
        const isLastPage = pageIndex >= config.length - 1;
        if (isLastPage) {
          setStep(2);
          navigate('/admin/afterSlide');
        } else {
          setPageIndex(i => i + 1);
        }
      }, remain);
    }
    // control audio pause/resume
    const a = audioRef.current;
    if (a) {
      try {
        if (paused) a.pause();
        else a.play().catch(()=>{});
      } catch {}
    }

    // handle flip timers on pause/resume
    if (paused) {
      // clear all flip timers
      flipTimersRef.current.forEach(clearTimeout);
      flipTimersRef.current = [];
    } else {
      // restart flip timers for remaining flips
      if (Array.isArray(page.flipTimings)) {
        const now = Date.now();
        const elapsedSec = (page.timeoutSec ?? 7) - Math.max(0, (autoDeadlineRef.current - now) / 1000);
        // start timers for flips not yet fired
        for (let i = currentCardIdxRef.current + 1; i < page.flipTimings.length; i++) {
          const flipSec = page.flipTimings[i];
          const delayMs = (flipSec - elapsedSec) * 1000;
          if (delayMs > 0) {
            const timer = setTimeout(() => {
              const flipEvent = new CustomEvent(`flipTarget-${i}`);
              window.dispatchEvent(flipEvent);
              const highlightEvent = new CustomEvent(`highlightTarget-${i}`);
              window.dispatchEvent(highlightEvent);
              if (i > 0) {
                const unhighlightEvent = new CustomEvent(`unhighlightTarget-${i - 1}`);
                window.dispatchEvent(unhighlightEvent);
              }
              currentCardIdxRef.current = i;
            }, delayMs);
            flipTimersRef.current.push(timer);
          } else {
            // If delay is <= 0, that flip should have already happened, so skip
          }
        }
      }
    }
  }, [paused]);

  // keyboard controls: ArrowLeft/Right for card flip, Space to pause
  useEffect(() => {
    const onKey = (e) => {
      if (!page) return;
      const totalCards = Array.isArray(page.flipTimings)
        ? page.flipTimings.length
        : (Array.isArray(page.requiredTargets) ? page.requiredTargets.length : 0);
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        // 이미 마지막 카드가 펼쳐진 상태에서 한 번 더 누르면 다음 슬라이드로 이동
        if (totalCards > 0 && currentCardIdxRef.current >= totalCards - 1) {
          const isLastPage = pageIndex >= config.length - 1;
          if (isLastPage) {
            setStep(2);
            navigate('/admin/afterSlide');
          } else {
            setPageIndex(i => i + 1);
          }
          return;
        }
        // 다음 카드로 플립
        const next = Math.min(totalCards - 1, currentCardIdxRef.current + 1);
        if (next >= 0 && next !== currentCardIdxRef.current) {
          window.dispatchEvent(new CustomEvent(`flipTarget-${next}`));
          window.dispatchEvent(new CustomEvent(`highlightTarget-${next}`));
          if (next > 0) window.dispatchEvent(new CustomEvent(`unhighlightTarget-${next - 1}`));
          // Unflip all other cards except the one just flipped
          for (let i = 0; i < totalCards; i++) {
            if (i !== next) window.dispatchEvent(new CustomEvent(`unflipTarget-${i}`));
          }
          currentCardIdxRef.current = next;
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (currentCardIdxRef.current <= 0) {
          const isFirstPage = pageIndex <= 0;
          if (!isFirstPage) {
            setPageIndex(i => i - 1);
          }
          return;
        }
        const prev = Math.max(0, currentCardIdxRef.current - 1);
        if (prev !== currentCardIdxRef.current) {
          // unhighlight current, highlight prev
          if (currentCardIdxRef.current >= 0) {
            window.dispatchEvent(new CustomEvent(`unhighlightTarget-${currentCardIdxRef.current}`));
          }
          window.dispatchEvent(new CustomEvent(`flipTarget-${prev}`));
          window.dispatchEvent(new CustomEvent(`highlightTarget-${prev}`));
          // Unflip all other cards except the one just flipped
          for (let i = 0; i < totalCards; i++) {
            if (i !== prev) window.dispatchEvent(new CustomEvent(`unflipTarget-${i}`));
          }
          currentCardIdxRef.current = prev;
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page]);

  const value = useMemo(
    () => ({
      pageIndex,
      setPageIndex,
      page,
      config,
      required,
      requiredCount,
      clickedSet,
      markClicked,
      allDone,
      // 쿨다운 관련 노출
      isBlocked,
      msRemaining,
      nextAllowedAt,
      flipping,
      paused,
      setPaused,
    }),
    [pageIndex, page, config, required, requiredCount, clickedSet, allDone, isBlocked, msRemaining, nextAllowedAt, flipping, paused]
  );

  return <SlideCtx.Provider value={value}>{children}</SlideCtx.Provider>;
}

export function useSlides() {
  const ctx = useContext(SlideCtx);
  if (!ctx) throw new Error('useSlides must be used within SlideProvider');
  return ctx;
}