"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

export type AuthMode = "login" | "register";

export default function AuthModal({ mode, onMode, onClose }: { mode: AuthMode; onMode: (m: AuthMode) => void; onClose: () => void }) {
  const { signIn, signUp, signInWithGoogle, resetPassword, configured } = useAuth();
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

  const handleGoogle = async () => {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await signInWithGoogle();
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
        <button
          type="button"
          className="btn google-btn"
          onClick={handleGoogle}
          disabled={busy || !configured}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continuar con Google
        </button>
        <div className="divider">
          <span>o con correo</span>
        </div>
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

