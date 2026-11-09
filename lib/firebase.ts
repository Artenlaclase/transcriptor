// Firebase (cliente). Solo se usa Authentication; la clave pública de Firebase NO es un secreto.
import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Deben referenciarse literalmente para que Next los incluya en el bundle del cliente.
const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);

export function getFirebaseAuth(): Auth | null {
  if (!firebaseConfigured) return null;
  const app = getApps()[0] ?? initializeApp(cfg as Record<string, string>);
  return getAuth(app);
}

