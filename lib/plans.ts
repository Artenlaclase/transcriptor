// Constantes compartidas entre cliente y servidor (límites, precios, listas permitidas).

export const MB = 1024 * 1024;
export const FREE_MAX_BYTES = 20 * MB;
export const PRO_MAX_BYTES = 2 * 1024 * MB; // 2 GB

export type Plan = "free" | "pro";
export const maxBytesFor = (plan: Plan) => (plan === "pro" ? PRO_MAX_BYTES : FREE_MAX_BYTES);

// Precio de la suscripción mensual (CLP) y equivalencia referencial en USD.
// Ajusta NEXT_PUBLIC_CLP_USD_RATE en .env.local cuando cambie el tipo de cambio.
export const PRICE_CLP = 5990;
export const CLP_PER_USD = Number(process.env.NEXT_PUBLIC_CLP_USD_RATE) || 950;
export const PRICE_USD = PRICE_CLP / CLP_PER_USD;

export const formatCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
export const formatUSD = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
    .format(n)
    .replace("US$", "US$ ");

// Límites de seguridad
export const MAX_TEXT_CHARS = 200_000;
export const MAX_JSON_BYTES = 1 * MB;

export const TARGETS = ["inglés", "francés", "alemán", "italiano", "portugués", "catalán", "japonés", "chino"] as const;

// Extensiones de audio permitidas -> MIME para la Files API de Gemini
export const AUDIO_EXT_MIME: Record<string, string> = {
  mp3: "audio/mp3",
  wav: "audio/wav",
  m4a: "audio/m4a",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  webm: "audio/webm",
  opus: "audio/ogg",
  mp4: "audio/mp4",
};
