import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { FREE_MAX_BYTES, PRO_MAX_BYTES } from "@/lib/plans";
import { adminDb } from "@/lib/firebaseAdmin";
import { rateLimit } from "@/lib/rateLimit";
import { HttpError, errorResponse, requireUser } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Devuelve el plan del usuario autenticado (la fuente de verdad es Firestore, no el cliente). */
export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    return NextResponse.json({
      plan: user.plan,
      email: user.email,
      name: user.name,
      maxBytes: user.plan === "pro" ? PRO_MAX_BYTES : FREE_MAX_BYTES,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

/** Registra el interés en ser avisado cuando el pago esté disponible. */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    if (!rateLimit(`notify:${user.uid}`, 5, 3_600_000)) throw new HttpError(429, "Demasiadas solicitudes.", "RATE_LIMIT");
    const body = await req.json().catch(() => ({}));
    if (body?.notify !== true) throw new HttpError(400, "Solicitud inválida.");
    await adminDb()
      .collection("users")
      .doc(user.uid)
      .set({ notifyWhenPaymentReady: true, notifyRequestedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

