"use client";

export function ErrorIllustration({ code = "404" }: { code?: string }) {
  return (
    <div className="error-illustration" aria-hidden="true">
      <div className="error-orbit error-orbit-one" />
      <div className="error-orbit error-orbit-two" />
      <div className="error-cloud error-cloud-one" />
      <div className="error-cloud error-cloud-two" />
      <div className="error-ground" />
      <div className="error-rock error-rock-left" />
      <div className="error-rock error-rock-right" />
      <div className="error-person">
        <span className="person-head" />
        <span className="person-body" />
        <span className="person-arm person-arm-left" />
        <span className="person-arm person-arm-right" />
        <span className="person-leg person-leg-left" />
        <span className="person-leg person-leg-right" />
      </div>
      <div className="error-sign">
        <strong>{code}</strong>
        <span>Ups!</span>
      </div>
      <div className="error-spark spark-one">✦</div>
      <div className="error-spark spark-two">·</div>
      <div className="error-spark spark-three">✦</div>
    </div>
  );
}
