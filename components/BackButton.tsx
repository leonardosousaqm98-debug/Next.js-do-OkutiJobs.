"use client";

import { usePathname, useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <button className="back-button global-back-button" type="button" onClick={goBack} aria-label="Voltar à página anterior">
      <span aria-hidden="true">←</span>
      <span>Voltar</span>
    </button>
  );
}
