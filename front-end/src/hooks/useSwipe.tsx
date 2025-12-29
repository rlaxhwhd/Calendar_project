
import { RefObject, useEffect } from "react";

type SwipeOpts = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minDistance?: number; // 픽셀, 기본 40
  maxTime?: number; // ms, 기본 600
  maxVerticalRatio?: number; // |dy|/|dx| 허용 비율, 기본 0.6
};

export function useSwipe(ref: RefObject<HTMLElement>, opts: SwipeOpts) {
  const {
    onSwipeLeft,
    onSwipeRight,
    minDistance = 40,
    maxTime = 600,
    maxVerticalRatio = 0.6,
  } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let active = false;
    let startX = 0,
      startY = 0,
      startT = 0,
      pid = -1;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      active = true;
      startX = e.clientX;
      startY = e.clientY;
      startT = e.timeStamp;
      pid = e.pointerId;
      el.setPointerCapture?.(pid);
    };

    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // 가로 제스처로 판단되면 브라우저 가로 스크롤 방지
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    };

    const onUpCancel = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dt = e.timeStamp - startT;

      const horizontal =
        Math.abs(dx) >= minDistance &&
        Math.abs(dy) / Math.abs(dx) <= maxVerticalRatio &&
        dt <= maxTime;

      if (horizontal) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }
      if (pid !== -1) {
        try {
          el.releasePointerCapture?.(pid);
        } catch {}
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove, { passive: false } as any);
    el.addEventListener("pointerup", onUpCancel);
    el.addEventListener("pointercancel", onUpCancel);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove as any);
      el.removeEventListener("pointerup", onUpCancel);
      el.removeEventListener("pointercancel", onUpCancel);
    };
  }, [ref, onSwipeLeft, onSwipeRight, minDistance, maxTime, maxVerticalRatio]);
}
