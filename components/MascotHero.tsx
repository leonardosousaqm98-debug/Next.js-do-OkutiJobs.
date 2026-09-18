"use client";

import { useState } from "react";

export function MascotHero() {
  const [failed, setFailed] = useState(false);
  return <div className={`mascot-frame${failed ? " mascot-frame-fallback" : ""}`} aria-label="Mascote OkutiJobs a dar as boas-vindas aos profissionais">
    {!failed ? <img className="hero-mascot" src="/okutijobs-mascot-hr.png" alt="Mascote OkutiJobs a apresentar uma oportunidade de carreira" onError={() => setFailed(true)} /> : <div className="mascot-fallback" role="img" aria-label="Ilustração abstracta da mascote OkutiJobs"><span className="mascot-fallback-head">✦</span><span className="mascot-fallback-body">Okuti<br /><b>Jobs</b></span></div>}
  </div>;
}
