"use client";

import { useRef, useState } from "react";

const acceptedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export function BuyCvTrigger({ className = "", ariaLabel = "Comprar CV" }: { className?: string; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className={className} aria-label={ariaLabel} onClick={() => setOpen(true)}>Comprar CV</button>{open && <CvOrderModal onClose={() => setOpen(false)} />}</>;
}

export function CvOrderModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [freeText, setFreeText] = useState("");
  const [payment, setPayment] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!acceptedTypes.includes(candidate.type) || candidate.size > 8 * 1024 * 1024) {
      setError("Envie um ficheiro PDF, DOC ou DOCX até 8 MB.");
      return;
    }
    setError("");
    setFile(candidate);
  }

  function nextStep(event: React.FormEvent) {
    event.preventDefault();
    if (!file && freeText.trim().length < 40) {
      setError("Anexe o seu CV ou escreva pelo menos 40 caracteres sobre a sua experiência.");
      return;
    }
    setError("");
    setStep(2);
  }

  function confirmOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!payment) {
      setError("Seleccione um método para continuar. Os métodos estão em configuração e não geram cobrança.");
      return;
    }
    setError("");
    setSuccess(true);
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="cv-order-modal" role="dialog" aria-modal="true" aria-labelledby="cv-order-title"><button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>{success ? <div className="cv-order-success"><span className="success-mark">✓</span><p className="eyebrow">Pedido preparado</p><h2>Recebemos a sua informação.</h2><p>A equipa OkutiJobs poderá finalizar o pedido de CV profissional e carta de apresentação. A entrega prevista é de até 48 horas.</p><button type="button" className="button button-orange" onClick={onClose}>Concluir</button></div> : <><div className="cv-order-header"><p className="eyebrow">Serviço OkutiJobs</p><h2 id="cv-order-title">CV profissional<br /><em>que abre portas.</em></h2><p>CV personalizado e carta de apresentação optimizados para destacar as suas qualificações.</p><div className="cv-order-price"><strong>15.000 Kz</strong><span>Entrega em até 48 horas</span></div></div><div className="cv-order-steps"><span className={step === 1 ? "active" : ""}>01 Dados</span><span className={step === 2 ? "active" : ""}>02 Pagamento</span></div>{step === 1 ? <form onSubmit={nextStep}><label className={`cv-upload-zone${dragging ? " dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]); }}><input ref={inputRef} type="file" accept=".pdf,.doc,.docx" onChange={(event) => acceptFile(event.target.files?.[0])} /><span className="upload-icon">↑</span><strong>{file ? file.name : "Arraste o seu CV para aqui"}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ficheiro pronto` : "ou clique para seleccionar PDF, DOC ou DOCX · máximo 8 MB"}</small></label><div className="cv-or"><span>ou</span></div><label className="cv-free-text"><span>Cole a sua informação profissional</span><textarea value={freeText} onChange={(event) => setFreeText(event.target.value)} placeholder="Experiência, cursos, competências, resultados e conquistas..." rows={5} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-orange cv-order-submit" type="submit">Avançar para pagamento <span>→</span></button></form> : <form onSubmit={confirmOrder}><div className="payment-summary"><span>Serviço de elaboração de CV + carta</span><strong>15.000 Kz</strong></div><fieldset className="payment-options"><legend>Escolha uma forma de pagamento</legend>{["Referência Multicaixa", "Transferência bancária", "Multicaixa Express"].map((method) => <label key={method} className={payment === method ? "selected" : ""}><input type="radio" name="payment" value={method} checked={payment === method} onChange={() => setPayment(method)} /><span><strong>{method}</strong><small>Configuração em breve</small></span></label>)}</fieldset>{error && <p className="form-error" role="alert">{error}</p>}<div className="cv-order-actions"><button type="button" className="button button-outline" onClick={() => { setStep(1); setError(""); }}>← Voltar</button><button className="button button-orange" type="submit">Confirmar pedido <span>✓</span></button></div><p className="payment-note">Nenhum pagamento é processado nesta versão. O gateway será ligado após a configuração comercial.</p></form>}</>}</section></div>;
}
