import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebaseAdmin";
import type { Plan } from "./plans";
import { clientIp, rateLimit } from "./rateLimit";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export interface AuthedUser {
  uid: string;
  email: string | null;
  name: string | null;
  plan: Plan;
}

/** Verifica el ID token de Firebase (cabecera Authorization: Bearer ...) y resuelve el plan desde Firestore. */
export async function requireUser(req: Request): Promise<AuthedUser> {
  if (!rateLimit(`ip:${clientIp(req)}`, 120, 60_000)) {
    throw new HttpError(429, "Demasiadas solicitudes. Espera un momento.", "RATE_LIMIT");
  }
  const m = /^Bearer (.+)$/.exec(req.headers.get("authorization") || "");
  if (!m) throw new HttpError(401, "Inicia sesión para continuar.", "AUTH_REQUIRED");

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(m[1]);
  } catch (e: any) {
    if (e?.message === "FIREBASE_ADMIN_NOT_CONFIGURED") {
      console.error("Firebase Admin sin configurar (revisa FIREBASE_* en .env.local)");
      throw new HttpError(500, "El servidor no está configurado correctamente.");
    }
    throw new HttpError(401, "Sesión inválida o expirada. Vuelve a iniciar sesión.", "AUTH_REQUIRED");
  }

  const ref = adminDb().collection("users").doc(decoded.uid);
  const snap = await ref.get();
  let plan: Plan = "free";
  // El nombre viene del token verificado (registro con correo o cuenta de Google), nunca del cliente.
  const tokenName = typeof decoded.name === "string" && decoded.name.trim() ? decoded.name.trim().slice(0, 60) : null;
  if (!snap.exists) {
    await ref.set({
      name: tokenName,
      email: decoded.email ?? null,
      provider: decoded.firebase?.sign_in_provider ?? null,
      plan: "free",
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    const d = snap.data() ?? {};
    // Completa el nombre si faltaba (p. ej. el token se emitió antes de guardar el perfil)
    if (!d.name && tokenName) await ref.set({ name: tokenName }, { merge: true });
    plan = d.plan === "pro" ? "pro" : "free";
    const until = d.proUntil?.toMillis?.();
    if (plan === "pro" && until && until < Date.now()) plan = "free"; // suscripción vencida
  }
  return { uid: decoded.uid, email: decoded.email ?? null, name: tokenName, plan };
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
}

