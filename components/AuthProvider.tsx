"use client";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
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
};
const friendly = (e: any) => new Error(ERRORS[e?.code] || "No se pudo completar la operación. Inténtalo de nuevo.");

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

