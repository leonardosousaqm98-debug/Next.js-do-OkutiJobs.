"use client";

import { useState } from "react";

export function MascotHero() {
  const [failed, setFailed] = useState(false);
  return <div className={`mascot-frame${failed ? " mascot-frame-fallback" : ""}`} aria-label="Mascote OkutiJobs a dar as boas-vindas aos profissionais">
    {!failed ? <img className="hero-mascot" src="/manus-storage/okutijobs-career-mascot-office-v2_da857c8c.png" alt="Mascote OkutiJobs a dar as boas-vindas aos profissionais" onError={() => setFailed(true)} /> : <div className="mascot-fallback" role="img" aria-label="Ilustração abstracta da mascote OkutiJobs"><span className="mascot-fallback-head">✦</span><span className="mascot-fallback-body">Okuti<br /><b>Jobs</b></span></div>}
  </div>;
}
