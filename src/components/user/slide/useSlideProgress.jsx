// src/slides/useSlideProgress.js
import { useSlides } from './SlideProvider';

export function useSlideProgress() {
  const { required, clickedSet, requiredCount, allDone } = useSlides();
  return {
    requiredIds: required,
    clickedCount: clickedSet.size,
    requiredCount,
    remainingIds: required.filter((id) => !clickedSet.has(id)),
    allDone
  };
}