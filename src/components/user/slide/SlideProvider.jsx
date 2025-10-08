// src/slides/SlideProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';


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

  const page = config[pageIndex] ?? null;
  const required = page?.requiredTargets ?? [];
  const requiredCount = required.length;
  const timeoutMs = (page?.timeoutSec ?? 0) * 1000;

  useEffect(() => {
    setClickedSet(new Set());
    setNextAllowedAt(0);
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

  const nowTs = Date.now();
  const isBlocked = blockPolicy === 'global' && nowTs < nextAllowedAt;
  const msRemaining = Math.max(0, nextAllowedAt - nowTs);

  const getCooldownMs = (id) => {
    const cd = page?.targets?.[id]?.cooldownMs;
    return typeof cd === 'number' ? cd : defaultCooldownMs;
  };

  const markClicked = (id) => {
    // 전역 잠금 중이면 무시
    if (isBlocked) {
      return { ok: false, reason: 'cooldown', waitMs: msRemaining };
    }
    // 요구 타겟이 아니면 무시(정책에 따라 허용 가능)
    if (!required.includes(id)) {
      return { ok: false, reason: 'not-required' };
    }

    let updated = false;
    setClickedSet((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      updated = true;
      return next;
    });

    if (updated && blockPolicy === 'global') {
      const cd = getCooldownMs(id);
      if (cd > 0) setNextAllowedAt(Date.now() + cd);
    }

    if (updated) {
      const audio = new Audio(`@/assets/sounds/targets/${id}.mp3`);
      audio.preload = 'auto';
      audio.currentTime = 0;
      audio.play().catch((e) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Audio playback failed for ${id}:`, e);
        }
      });
    }

    return { ok: updated, reason: updated ? 'added' : 'duplicate' };
  };

  const allDone = requiredCount > 0 && clickedSet.size >= requiredCount;

  useEffect(() => {
    if (!allDone || !page) return;
    if (timerRef.current) return;
    if (timeoutMs <= 0) {
      setPageIndex((i) => Math.min(i + 1, config.length - 1));
      return;
    }
    timerRef.current = setTimeout(() => {
      setPageIndex((i) => Math.min(i + 1, config.length - 1));
      timerRef.current = null;
    }, timeoutMs);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [allDone, timeoutMs, page, config.length]);

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
      nextRequiredId: required.find(id => !clickedSet.has(id)),
    }),
    [pageIndex, page, config, required, requiredCount, clickedSet, allDone, isBlocked, msRemaining, nextAllowedAt]
  );

  return <SlideCtx.Provider value={value}>{children}</SlideCtx.Provider>;
}

export function useSlides() {
  const ctx = useContext(SlideCtx);
  if (!ctx) throw new Error('useSlides must be used within SlideProvider');
  return ctx;
}