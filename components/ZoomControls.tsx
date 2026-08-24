"use client";

import { useEffect, useState } from "react";

const steps = [0.85, 0.925, 1, 1.075, 1.15];

export function ZoomControls() {
  const [index, setIndex] = useState(1);
  useEffect(() => { const stored = Number(window.localStorage.getItem("okutijobs-zoom")); const next = steps.indexOf(stored); if (next >= 0) setIndex(next); }, []);
  useEffect(() => { document.body.style.setProperty("--ui-scale", String(steps[index])); window.localStorage.setItem("okutijobs-zoom", String(steps[index])); }, [index]);
  const update = (next: number) => setIndex(Math.max(0, Math.min(steps.length - 1, next)));
  return <div className="zoom-controls" aria-label="Controlos de tamanho da apresentação"><button type="button" onClick={() => update(index - 1)} disabled={index === 0} aria-label="Reduzir tamanho">−</button><button type="button" className="zoom-value" onClick={() => update(2)} aria-label="Repor tamanho">{Math.round(steps[index] * 100)}%</button><button type="button" onClick={() => update(index + 1)} disabled={index === steps.length - 1} aria-label="Aumentar tamanho">+</button></div>;
}
