"use client";

import { useState } from "react";

type FlatIllustrationProps = { src: string; alt: string; className?: string; loading?: "eager" | "lazy" };

export function FlatIllustration({ src, alt, className = "", loading = "lazy" }: FlatIllustrationProps) {
  const [failed, setFailed] = useState(false);
  if (!failed) return <img className={className} src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />;
  return <svg className={`${className} flat-illustration-fallback`} viewBox="0 0 520 320" role="img" aria-label={alt} focusable="false">
    <rect x="18" y="32" width="484" height="256" rx="36" fill="#e4f1f1" />
    <circle cx="126" cy="124" r="38" fill="#f2b45b" />
    <circle cx="260" cy="104" r="38" fill="#6da8a4" />
    <circle cx="390" cy="132" r="38" fill="#f0c9b6" />
    <path d="M77 244c8-52 31-76 66-76s58 24 66 76M210 244c8-52 31-76 66-76s58 24 66 76M340 244c8-52 31-76 66-76s58 24 66 76" fill="#003f52" />
    <path d="M165 210h190l-22 34H187z" fill="#fff" stroke="#003f52" strokeWidth="6" />
    <path d="M250 210v-68h64" fill="none" stroke="#e88800" strokeWidth="8" strokeLinecap="round" />
    <path d="M314 142l58 20-58 22z" fill="#e88800" />
    <path d="M103 64l12-24 12 24 24 12-24 12-12 24-12-24-24-12z" fill="#e88800" opacity=".9" />
  </svg>;
}
