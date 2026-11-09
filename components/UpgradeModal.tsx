"use client";
import { useEffect, useState } from "react";
import { CLP_PER_USD, FREE_MAX_BYTES, MB, PRICE_CLP, PRICE_USD, formatCLP, formatUSD } from "@/lib/plans";
import { useAuth } from "./AuthProvider";

export default function UpgradeModal({
  reason,
  onClose,
  onNotify,
  onRegister,
}: {
  reason?: string;
  onClose: () => void;
  onNotify: () => Promise<void>;
  onRegister: () => void;
}) {
  const { user } = useAuth();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const notify = async () => {
    setBusy(true);
    setErr("");
    try {
      await onNotify();
      setDone(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal glass" role="dialog" aria-modal="true" aria-labelledby="up-title">
        <button className="icon-btn sm modal-x" onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 id="up-title">⭐ Plan Pro</h2>
        {reason && <p className="warn" role="status">{reason}</p>}

        <div className="price">
          <strong>{formatCLP(PRICE_CLP)}</strong>
          <span> CLP / mes</span>
          <small>
            ≈ {formatUSD(PRICE_USD)} USD (referencial, 1 USD ≈ {CLP_PER_USD} CLP)
          </small>
        </div>

        <table className="plans">
          <thead>
            <tr><th></th><th>Gratis</th><th>Pro</th></tr>
          </thead>
          <tbody>
            <tr><td>Dictado por micrófono</td><td>✔</td><td>✔</td></tr>
            <tr><td>Herramientas de IA</td><td>✔ (con cuenta)</td><td>✔</td></tr>
            <tr><td>Tamaño de archivo</td><td>hasta {FREE_MAX_BYTES / MB} MB</td><td>hasta 2 GB</td></tr>
            <tr><td>Descargar .txt / .md</td><td>✘</td><td>✔</td></tr>
          </tbody>
        </table>

        <p className="notice" role="status">
          🚧 <strong>El sistema de pago está en proceso.</strong> Te avisaremos cuando esté disponible.
        </p>

        {user ? (
          done ? (
            <p className="okmsg" role="status">¡Listo! Te avisaremos a {user.email}.</p>
          ) : (
            <button className="btn primary" onClick={notify} disabled={busy}>
              {busy ? <span className="spin" /> : "🔔"} Avísame cuando esté disponible
            </button>
          )
        ) : (
          <button className="btn primary" onClick={onRegister}>Crear cuenta para recibir el aviso</button>
        )}
        {err && <p className="warn" role="alert">{err}</p>}
      </div>
    </div>
  );
}

