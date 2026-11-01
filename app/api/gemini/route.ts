import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutos para procesar audios extensos

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta GEMINI_API_KEY en tu archivo .env.local" },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = DEFAULT_MODEL;

  const contentType = req.headers.get("content-type") || "";

  // 1. Manejo de subida de archivo de audio grande mediante FormData (soporta hasta 2 GB)
  if (contentType.includes("multipart/form-data")) {
    let tempFilePath: string | null = null;
    let uploadedFile: any = null;

    try {
      const formData = await req.formData();
      const file = formData.get("audio") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No se recibió ningún archivo de audio." }, { status: 400 });
      }

      // Guardar temporalmente para subirlo a la Files API de Gemini
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.name.split(".").pop() || "mp3";
      tempFilePath = join(tmpdir(), `audio_${randomUUID()}.${ext}`);
      await writeFile(tempFilePath, buffer);

      const mimeType = file.type || "audio/mpeg";
      // Subir mediante Files API de Google GenAI
      uploadedFile = await ai.files.upload({
        file: tempFilePath,
        mimeType: mimeType,
      } as any);

      // Esperar si entra en procesamiento preliminar
      let fileState = await ai.files.get({ name: uploadedFile.name });
      while (fileState.state === "PROCESSING") {
        await new Promise((r) => setTimeout(r, 2000));
        fileState = await ai.files.get({ name: uploadedFile.name });
      }

      if (fileState.state === "FAILED") {
        throw new Error("El procesamiento del audio falló en los servidores de Gemini.");
      }

      // Solicitar transcripción completa
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Transcribe fielmente y por completo este archivo de audio en español. Incluye puntuación natural, párrafos y buena ortografía. Devuelve exclusivamente la transcripción sin explicaciones adicionales ni introducciones.",
              },
              {
                fileData: {
                  mimeType: uploadedFile.mimeType,
                  fileUri: uploadedFile.uri,
                },
              },
            ],
          },
        ],
      });

      const transcription = response.text?.trim() || "";
      return NextResponse.json({ result: transcription });
    } catch (err: any) {
      console.error("Error procesando audio con Gemini Files API:", err);
      return NextResponse.json(
        { error: err?.message || "Error procesando el archivo de audio con Gemini." },
        { status: 500 }
      );
    } finally {
      // Limpiar archivo temporal local y remoto
      if (tempFilePath) {
        unlink(tempFilePath).catch(() => {});
      }
      if (uploadedFile?.name) {
        ai.files.delete({ name: uploadedFile.name }).catch(() => {});
      }
    }
  }

  // 2. Procesamiento de acciones de texto habituales (JSON)
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const { action, text, target } = body ?? {};

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "No hay texto para procesar." }, { status: 400 });
  }

  let promptInstruction = "";
  if (action === "translate") {
    promptInstruction = `Traduce el siguiente texto al idioma: ${String(target || "inglés").slice(0, 40)}. Devuelve solo la traducción final.`;
  } else if (PROMPTS[action]) {
    promptInstruction = PROMPTS[action];
  } else {
    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `${promptInstruction}\n\n---\n${text}` }],
        },
      ],
    });

    const result = response.text?.trim() || "";
    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al comunicarse con Gemini." },
      { status: 500 }
    );
  }
}
