import { NextResponse } from "next/server";
import { MAX_JSON_BYTES, MAX_TEXT_CHARS } from "@/lib/plans";
import { HttpError, errorResponse, requireUser } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Descarga de transcripciones (.txt / .md). Solo plan Pro.
 * La verificación del plan ocurre en el servidor, por lo que no se puede saltar desde el navegador.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    if (user.plan !== "pro") {
      throw new HttpError(402, "Descargar el contenido es una función del plan Pro.", "PRO_REQUIRED");
    }
    if (Number(req.headers.get("content-length") || 0) > MAX_JSON_BYTES) throw new HttpError(413, "Texto demasiado grande.");
    const body = await req.json().catch(() => null);
    const text = body?.text;
    const format = body?.format;
    if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_CHARS) throw new HttpError(400, "Texto no válido.");
    if (format !== "txt" && format !== "md") throw new HttpError(400, "Formato no válido.");
    // Nombre de archivo saneado (solo letras, números y guiones)
    const base = String(body?.name || "transcripcion").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "transcripcion";

    return new Response(text, {
      headers: {
        "Content-Type": `${format === "md" ? "text/markdown" : "text/plain"}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="${base}.${format}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
