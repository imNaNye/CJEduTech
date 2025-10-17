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

  // 전역 잠금: 다음 클릭 가능 시각(Unix ms). now < nextAllowedAt 이면 잠김
  const [nextAllowedAt, setNextAllowedAt] = useState(0);

  const [flipping, setFlipping] = useState(false);

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
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
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
    if (!page) return;

    // Play slide audio on mount only if user has interacted
    if (hasInteracted && page?.id) {
      const audio = new Audio(`/sounds/narration/merged${page.id}.mp3`);
      audio.playbackRate = 1.1;
      audio.play().catch(err => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Audio playback failed:', err);
        }
      });
    }

    const flipTimeout = setTimeout(() => {
      setFlipping(true);
    }, 3000);

    const autoAdvanceTimeout = setTimeout(() => {
      const isLastPage = pageIndex >= config.length - 1;
      if (isLastPage) {
        setStep(2);
        navigate('/admin/afterSlide');
      } else {
        setPageIndex(i => i + 1);
      }
    }, (page.timeoutSec ?? 7) * 1000);

    return () => {
      clearTimeout(flipTimeout);
      clearTimeout(autoAdvanceTimeout);
    };
  }, [pageIndex, page, hasInteracted]);

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
    }),
    [pageIndex, page, config, required, requiredCount, clickedSet, allDone, isBlocked, msRemaining, nextAllowedAt, flipping]
  );

  return <SlideCtx.Provider value={value}>{children}</SlideCtx.Provider>;
}

export function useSlides() {
  const ctx = useContext(SlideCtx);
  if (!ctx) throw new Error('useSlides must be used within SlideProvider');
  return ctx;
}