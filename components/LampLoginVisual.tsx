"use client";

import { PointerEvent, useRef } from "react";

export function LampLoginVisual() {
  const frameRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (!frame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = frame.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    frame.style.setProperty("--lamp-shift-x", `${(x * 4).toFixed(2)}px`);
    frame.style.setProperty("--lamp-shift-y", `${(y * 3).toFixed(2)}px`);
  }

  function resetPointer() {
    frameRef.current?.style.setProperty("--lamp-shift-x", "0px");
    frameRef.current?.style.setProperty("--lamp-shift-y", "0px");
  }

  return (
    <div ref={frameRef} className="lamp-login-visual" aria-label="Ilustração de um candeeiro a acender" onPointerMove={handlePointerMove} onPointerLeave={resetPointer}>
      <div className="lamp-stars" aria-hidden="true"><i>✦</i><i>·</i><i>✦</i><i>·</i></div>
      <div className="lamp-glow" aria-hidden="true" />
      <div className="lamp-shade" aria-hidden="true"><span /></div>
      <div className="lamp-stem" aria-hidden="true" />
      <div className="lamp-switch" aria-hidden="true"><span /></div>
      <div className="lamp-base" aria-hidden="true" />
      <div className="lamp-message"><span>OkutiJobs</span><strong>Acenda o próximo passo.</strong></div>
    </div>
  );
}
