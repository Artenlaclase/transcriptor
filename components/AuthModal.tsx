"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

export type AuthMode = "login" | "register";

export default function AuthModal({ mode, onMode, onClose }: { mode: AuthMode; onMode: (m: AuthMode) => void; onClose: () => void }) {
  const { signIn, signUp, resetPassword, configured } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (mode === "register") {
      if (name.trim().length < 2) return setError("Escribe tu nombre.");
      if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    }
    setBusy(true);
    try {
      if (mode === "register") await signUp(name.trim().slice(0, 60), email.trim(), password);
      else await signIn(email.trim(), password);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError("");
    if (!email.trim()) return setError("Escribe tu correo para recuperar la contraseña.");
    try {
      await resetPassword(email.trim());
      setInfo("Si el correo está registrado, recibirás un enlace para restablecer la contraseña.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal glass" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-btn sm modal-x" onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 id="auth-title">{mode === "register" ? "Crear cuenta" : "Iniciar sesión"}</h2>
        <p className="muted">
          {mode === "register"
            ? "Necesitas una cuenta para transcribir archivos y usar la IA. Es gratis."
            : "Accede para transcribir archivos y usar la IA."}
        </p>
        {!configured && (
          <p className="warn" role="alert">
            Firebase no está configurado. Revisa FIREBASE_SETUP.md y tu archivo .env.local.
          </p>
        )}
        <form onSubmit={submit} className="form">
          {mode === "register" && (
            <label className="field">
              <span>Nombre</span>
              <input ref={firstRef} className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} required />
            </label>
          )}
          <label className="field">
            <span>Correo electrónico</span>
            <input
              ref={mode === "login" ? firstRef : undefined}
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={mode === "register" ? 8 : undefined}
              required
            />
          </label>
          {error && <p className="warn" role="alert">{error}</p>}
          {info && <p className="okmsg" role="status">{info}</p>}
          <button className="btn primary" type="submit" disabled={busy || !configured}>
            {busy ? <span className="spin" /> : null} {mode === "register" ? "Crear cuenta" : "Entrar"}
          </button>
        </form>
        <div className="modal-links">
          {mode === "login" && (
            <button className="link" onClick={forgot} type="button">¿Olvidaste tu contraseña?</button>
          )}
          <button className="link" type="button" onClick={() => onMode(mode === "register" ? "login" : "register")}>
            {mode === "register" ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
          </button>
        </div>
      </div>
    </div>
  );
}
