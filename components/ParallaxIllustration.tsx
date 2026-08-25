"use client";

import { ReactNode, useEffect, useRef } from "react";

export function ParallaxIllustration({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = element.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / window.innerHeight));
      element.style.setProperty("--parallax-y", `${Math.round(progress * 14)}px`);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, []);
  return <div ref={ref} className={`parallax-illustration ${className}`}>{children}</div>;
}
