"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Language = "pt" | "en" | "es" | "fr" | "hi" | "zh";
type CandidateHeroProps = { onCareerPlanClick: () => void };

const languageCodes: readonly Language[] = ["pt", "en", "es", "fr", "hi", "zh"];
const languageStorageKey = "okutijobs-language";

function isLanguage(value: string | null | undefined): value is Language {
  return !!value && languageCodes.includes(value as Language);
}

function readLanguagePreference(): Language {
  try {
    const saved = window.localStorage.getItem(languageStorageKey);
    if (isLanguage(saved)) return saved;
  } catch {
    // The language cookie is a fallback when local storage is unavailable.
  }

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${languageStorageKey}=`))
    ?.slice(languageStorageKey.length + 1);

  try {
    const value = cookie ? decodeURIComponent(cookie) : null;
    return isLanguage(value) ? value : "pt";
  } catch {
    return "pt";
  }
}

const portugueseCopy = {
  eyebrow: "PARA PROFISSIONAIS EM MOVIMENTO",
  titleStart: "O seu talento",
  titleMiddle: "merece",
  titleEnd: "um palco maior.",
  description: "Ferramentas, orientação e oportunidades para transformar a sua experiência no próximo capítulo da sua carreira.",
  jobs: "Encontrar vagas",
  jobsSub: "Oportunidades para si",
  training: "Formações",
  trainingSub: "Aprender e avançar",
  career: "Plano de carreira",
  careerSub: "Definir o próximo passo",
  badgeTitle: "Novas oportunidades",
  badgeSub: "para diferentes percursos",
  note: "O seu próximo passo começa aqui",
  photoAlt: "Equipa diversa de profissionais angolanos a partilhar ideias num escritório luminoso",
};

const englishCopy = {
  eyebrow: "FOR PROFESSIONALS ON THE MOVE",
  titleStart: "Your talent",
  titleMiddle: "deserves",
  titleEnd: "a bigger stage.",
  description: "Tools, guidance and opportunities to turn your experience into the next chapter of your career.",
  jobs: "Find jobs",
  jobsSub: "Opportunities for you",
  training: "Training",
  trainingSub: "Learn and move forward",
  career: "Career plan",
  careerSub: "Define the next step",
  badgeTitle: "New opportunities",
  badgeSub: "for different career paths",
  note: "Your next step starts here",
  photoAlt: "A diverse team of Angolan professionals sharing ideas in a bright office",
};

const frenchCopy = {
  eyebrow: "POUR LES PROFESSIONNELS EN MOUVEMENT",
  titleStart: "Votre talent",
  titleMiddle: "mérite",
  titleEnd: "une scène plus grande.",
  description: "Des outils, des conseils et des opportunités pour transformer votre expérience en prochain chapitre de carrière.",
  jobs: "Trouver des offres",
  jobsSub: "Des opportunités pour vous",
  training: "Formations",
  trainingSub: "Apprendre et avancer",
  career: "Plan de carrière",
  careerSub: "Définir la prochaine étape",
  badgeTitle: "De nouvelles opportunités",
  badgeSub: "pour différents parcours",
  note: "Votre prochaine étape commence ici",
  photoAlt: "Une équipe diversifiée de professionnels angolais échangeant dans un bureau lumineux",
};

export function CandidateHero({ onCareerPlanClick }: CandidateHeroProps) {
  const [language, setLanguage] = useState<Language>("pt");

  useEffect(() => {
    const syncLanguage = () => setLanguage(readLanguagePreference());
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<string>).detail;
      if (isLanguage(nextLanguage)) setLanguage(nextLanguage);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === languageStorageKey) syncLanguage();
    };

    syncLanguage();
    window.addEventListener("okutijobs-language-change", handleLanguageChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("okutijobs-language-change", handleLanguageChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const copy = language === "en" ? englishCopy : language === "fr" ? frenchCopy : portugueseCopy;

  return (
    <section className="candidate-hero">
      <div className="candidate-hero-copy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>
          {copy.titleStart}
          <br />
          {copy.titleMiddle} <em>{copy.titleEnd}</em>
        </h1>
        <p className="lede">{copy.description}</p>
        <div className="candidate-quick-actions">
          <Link href="/vagas" className="button button-orange">
            <span className="quick-icon" aria-hidden="true">↗</span>
            <span><strong>{copy.jobs}</strong><small>{copy.jobsSub}</small></span>
          </Link>
          <Link href="/formacoes" className="button button-dark">
            <span className="quick-icon" aria-hidden="true">◌</span>
            <span><strong>{copy.training}</strong><small>{copy.trainingSub}</small></span>
          </Link>
          <button type="button" className="button button-outline" onClick={onCareerPlanClick}>
            <span className="quick-icon" aria-hidden="true">✦</span>
            <span><strong>{copy.career}</strong><small>{copy.careerSub}</small></span>
          </button>
        </div>
      </div>
      <div className="candidate-hero-art">
        <div className="candidate-hero-orbit" aria-hidden="true" />
        <div className="candidate-hero-photo-frame">
          <Image
            src="/okutijobs-candidate-team-hero.jpg"
            alt={copy.photoAlt}
            fill
            priority
            sizes="(max-width: 980px) 90vw, 48vw"
            className="candidate-hero-photo"
          />
        </div>
        <div className="candidate-photo-badge">
          <strong>{copy.badgeTitle}</strong>
          <span>{copy.badgeSub}</span>
        </div>
        <div className="candidate-photo-note">
          <span aria-hidden="true">✦</span>
          <strong>{copy.note}</strong>
        </div>
      </div>
    </section>
  );
}
