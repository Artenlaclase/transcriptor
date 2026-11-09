import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  AUDIO_EXT_MIME,
  MAX_JSON_BYTES,
  MAX_TEXT_CHARS,
  MB,
  TARGETS,
  formatCLP,
  maxBytesFor,
  PRICE_CLP,
  FREE_MAX_BYTES,
} from "@/lib/plans";
import { rateLimit } from "@/lib/rateLimit";
import { HttpError, errorResponse, requireUser } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const PROMPTS: Record<string, string> = {
  summarize:
    "Resume el siguiente texto transcrito en español de forma clara y concisa. Devuelve solo el resumen en Markdown.",
  grammar:
    "Corrige la ortografía, puntuación y gramática del siguiente texto transcrito en español. Añade mayúsculas y signos de puntuación necesarios. No cambies el significado ni agregues datos inventados. Devuelve solo el texto corregido.",
  format:
    "Da formato de notas bien estructuradas en Markdown al siguiente texto transcrito: agrega título, subtítulos (# / ##), viñetas y énfasis cuando corresponda. Devuelve solo el Markdown resultante.",
  keypoints:
    "Extrae del siguiente texto los puntos clave y las tareas o acciones identificadas. Devuelve dos secciones: '## Puntos clave' y '## Acciones pendientes' (con lista de tareas '- [ ]').",
};

/** Traduce errores del SDK a mensajes seguros (sin filtrar detalles internos). */
function geminiError(e: unknown): never {
  console.error("Gemini error:", e);
  const msg = String((e as any)?.message || "");
  if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg)) {
    throw new HttpError(429, "Se alcanzó el límite de uso de la IA. Inténtalo en unos minutos.", "RATE_LIMIT");
  }
  throw new HttpError(502, "No se pudo procesar con Gemini. Inténtalo nuevamente.");
}

export async function POST(req: Request) {
  try {
    // 1) Autenticación obligatoria: protege tu cuota de Gemini del uso anónimo.
    const user = await requireUser(req);
    if (!rateLimit(`u:${user.uid}`, 30, 60_000)) {
      throw new HttpError(429, "Demasiadas solicitudes. Espera un momento.", "RATE_LIMIT");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Falta GEMINI_API_KEY");
      throw new HttpError(500, "El servidor no está configurado correctamente.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const contentType = req.headers.get("content-type") || "";
    const contentLength = Number(req.headers.get("content-length") || 0);

    // 2) Transcripción de archivo de audio
    if (contentType.includes("multipart/form-data")) {
      if (!rateLimit(`t:${user.uid}`, user.plan === "pro" ? 30 : 10, 3_600_000)) {
        throw new HttpError(429, "Alcanzaste el máximo de transcripciones por hora.", "RATE_LIMIT");
      }
      const max = maxBytesFor(user.plan);
      const tooBig = () =>
        new HttpError(
          413,
          user.plan === "pro"
            ? "El archivo supera el máximo de 2 GB."
            : `El plan gratis admite archivos de hasta ${FREE_MAX_BYTES / MB} MB. Con el plan Pro (${formatCLP(PRICE_CLP)}/mes) llegas a 2 GB.`,
          "LIMIT_EXCEEDED"
        );
      // Rechazo temprano sin leer el cuerpo
      if (contentLength && contentLength > max + MB) throw tooBig();

      const form = await req.formData();
      const file = form.get("audio");
      if (!(file instanceof File)) throw new HttpError(400, "No se recibió ningún archivo de audio.");
      if (file.size === 0) throw new HttpError(400, "El archivo está vacío.");
      if (file.size > max) throw tooBig();

      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const mimeType = AUDIO_EXT_MIME[ext];
      if (!mimeType) throw new HttpError(400, "Formato de audio no permitido.");

      let uploadedName: string | undefined;
      try {
        // Se envía el Blob directamente: no se escribe nada en disco del servidor.
        const uploaded = await ai.files.upload({
          file,
          config: { mimeType, displayName: `audio-${randomUUID()}` },
        });
        uploadedName = uploaded.name;

        let state = await ai.files.get({ name: uploaded.name! });
        const started = Date.now();
        while (state.state === "PROCESSING") {
          if (Date.now() - started > 240_000) throw new Error("Tiempo de procesamiento agotado");
          await new Promise((r) => setTimeout(r, 2000));
          state = await ai.files.get({ name: uploaded.name! });
        }
        if (state.state === "FAILED") throw new Error("Procesamiento de audio falló");

        const response = await ai.models.generateContent({
          model: MODEL,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Transcribe fielmente y por completo este archivo de audio en español. Incluye puntuación natural, párrafos y buena ortografía. Devuelve exclusivamente la transcripción, sin explicaciones ni introducciones.",
                },
                { fileData: { mimeType: uploaded.mimeType, fileUri: uploaded.uri } },
              ],
            },
          ],
        });
        return NextResponse.json({ result: response.text?.trim() || "" });
      } catch (e) {
        geminiError(e);
      } finally {
        if (uploadedName) ai.files.delete({ name: uploadedName }).catch(() => {});
      }
    }

    // 3) Acciones de texto (JSON)
    if (contentLength > MAX_JSON_BYTES) throw new HttpError(413, "El texto es demasiado grande.");
    let body: any;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Solicitud inválida.");
    }
    const { action, text, target } = body ?? {};
    if (typeof text !== "string" || !text.trim()) throw new HttpError(400, "No hay texto para procesar.");
    if (text.length > MAX_TEXT_CHARS) throw new HttpError(413, `El texto supera ${MAX_TEXT_CHARS} caracteres.`);

    let instruction: string;
    if (action === "translate") {
      if (!(TARGETS as readonly string[]).includes(target)) throw new HttpError(400, "Idioma de destino no válido.");
      instruction = `Traduce el siguiente texto al idioma: ${target}. Devuelve solo la traducción final.`;
    } else if (typeof action === "string" && Object.hasOwn(PROMPTS, action)) {
      instruction = PROMPTS[action];
    } else {
      throw new HttpError(400, "Acción no reconocida.");
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: `${instruction}\n\n---\n${text}` }] }],
      });
      const result = response.text?.trim();
      if (!result) throw new Error("Respuesta vacía");
      return NextResponse.json({ result });
    } catch (e) {
      geminiError(e);
    }
  } catch (e) {
    return errorResponse(e);
  }
}
