"use client";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
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
  "auth/configuration-not-found": "Authentication no está activado en tu proyecto de Firebase. Pulsa «Comenzar» en Authentication y habilita Correo/contraseña o Google.",
  "auth/invalid-api-key": "La API key de Firebase (NEXT_PUBLIC_FIREBASE_API_KEY) no es válida.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "La API key de Firebase (NEXT_PUBLIC_FIREBASE_API_KEY) no es válida.",
  "auth/user-disabled": "Esta cuenta está deshabilitada.",
  "auth/unauthorized-domain": "El dominio localhost no está autorizado en Firebase (Authentication > Settings > Authorized domains).",
};
const friendly = (e: any) => {
  const code = e?.code ? String(e.code) : "";
  const rawMsg = e?.message ? String(e.message) : "";
  console.error("Firebase Auth raw error:", e);
  
  if (code === "auth/internal-error") {
    return new Error(`Error interno de Google Auth: ${rawMsg || "Verifica guardar la configuración de Google y el SDK Web en Firebase"}`);
  }

  const base = ERRORS[code] || rawMsg || "No se pudo completar la operación. Inténtalo de nuevo.";
  return new Error(code && !ERRORS[code] ? `${base} (${code})` : base);
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async (u: User, customName?: string) => {
    try {
      const token = await u.getIdToken();
      const n = customName || u.displayName || "";
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (n) headers["X-User-Name"] = encodeURIComponent(n);
      
      const res = await fetch("/api/me", { headers });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan === "pro" ? "pro" : "free");
        if (data.name) setName(data.name);
      }
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

    // Capturar el retorno de Google Redirect si ocurrió
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          const gName = res.user.displayName || "";
          setName(gName);
          loadPlan(res.user, gName);
        }
      })
      .catch((e) => {
        console.error("Error al procesar getRedirectResult:", e);
      });

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
          loadPlan(cred.user, n);
        } catch (e) {
          throw friendly(e);
        }
      },
      async signIn(email, password) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Firebase no está configurado.");
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          loadPlan(cred.user);
        } catch (e) {
          throw friendly(e);
        }
      },
      async signInWithGoogle() {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Firebase no está configurado.");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        try {
          // Intentar primero con Popup
          const res = await signInWithPopup(auth, provider);
          const gName = res.user.displayName || "";
          setName(gName);
          loadPlan(res.user, gName);
        } catch (e: any) {
          if (e?.code === "auth/popup-closed-by-user") return;
          
          // Si el popup arroja internal-error o bloqueo de origen, usar signInWithRedirect (100% infalible)
          if (e?.code === "auth/internal-error" || e?.code === "auth/popup-blocked" || e?.code === "auth/cancelled-popup-request") {
            console.warn("Popup bloqueado o error interno, redirigiendo con signInWithRedirect...");
            await signInWithRedirect(auth, provider);
            return;
          }
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

