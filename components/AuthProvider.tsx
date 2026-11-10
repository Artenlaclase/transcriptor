"use client";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { firebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import type { Plan } from "@/lib/plans";

interface AuthCtx {
  user: User | null;
  name: string;
  plan: Plan;
  loading: boolean;
  configured: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return c;
}

const ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "Ese correo ya está registrado. Inicia sesión.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/weak-password": "La contraseña es muy débil (mínimo 8 caracteres).",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
  "auth/operation-not-allowed": "El método de acceso no está habilitado en Firebase (Authentication > Sign-in method).",
  "auth/internal-error": "Error interno de autenticación. Verifica que en Firebase > Authentication > Sign-in method > Google hayas seleccionado el 'Correo de asistencia del proyecto'.",
  "auth/configuration-not-found": "Authentication no está activado en tu proyecto de Firebase. Pulsa «Comenzar» en Authentication y habilita Correo/contraseña o Google.",
  "auth/invalid-api-key": "La API key de Firebase (NEXT_PUBLIC_FIREBASE_API_KEY) no es válida.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "La API key de Firebase (NEXT_PUBLIC_FIREBASE_API_KEY) no es válida.",
  "auth/user-disabled": "Esta cuenta está deshabilitada.",
  "auth/unauthorized-domain": "El dominio no está autorizado en Firebase (Authentication > Settings > Authorized domains).",
};
const friendly = (e: any) => {
  const code = e?.code ? String(e.code) : "";
  const base = ERRORS[code] || "No se pudo completar la operación. Inténtalo de nuevo.";
  if (!ERRORS[code]) console.error("Firebase Auth error:", e);
  return new Error(code && !ERRORS[code] ? `${base} (código: ${code})` : base);
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async (u: User) => {
    try {
      const token = await u.getIdToken();
      const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPlan((await res.json()).plan === "pro" ? "pro" : "free");
    } catch {
      setPlan("free");
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setName(u?.displayName || "");
      if (u) loadPlan(u);
      else setPlan("free");
      setLoading(false);
    });
  }, [loadPlan]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      name,
      plan,
      loading,
      configured: firebaseConfigured,
      async signUp(n, email, password) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Firebase no está configurado.");
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(cred.user, { displayName: n });
          setName(n);
          sendEmailVerification(cred.user).catch(() => {});
          loadPlan(cred.user);
        } catch (e) {
          throw friendly(e);
        }
      },
      async signIn(email, password) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Firebase no está configurado.");
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
          throw friendly(e);
        }
      },
      async signInWithGoogle() {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Firebase no está configurado.");
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          const res = await signInWithPopup(auth, provider);
          setName(res.user.displayName || "");
          loadPlan(res.user);
        } catch (e: any) {
          if (e?.code === "auth/popup-closed-by-user") return;
          throw friendly(e);
        }
      },
      async resetPassword(email) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Firebase no está configurado.");
        try {
          await sendPasswordResetEmail(auth, email);
        } catch (e: any) {
          // No revelamos si el correo existe (evita enumeración de cuentas)
          if (e?.code === "auth/invalid-email" || e?.code === "auth/network-request-failed") throw friendly(e);
        }
      },
      async signOut() {
        const auth = getFirebaseAuth();
        if (auth) await fbSignOut(auth);
      },
      async getToken() {
        return user ? user.getIdToken() : null;
      },
    }),
    [user, name, plan, loading, loadPlan]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

