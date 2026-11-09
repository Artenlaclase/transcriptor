export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function formatTime(s: number): string {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function parseError(res: Response): Promise<ApiError> {
  const data = await res.json().catch(() => ({}));
  return new ApiError(data?.error || `Error ${res.status}`, res.status, data?.code);
}

export async function callGemini(payload: Record<string, unknown>, token: string): Promise<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  return ((await res.json()) as { result: string }).result;
}

export async function transcribeAudioFile(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append("audio", file);
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw await parseError(res);
  return ((await res.json()) as { result: string }).result;
}

/** Descarga el contenido a través del servidor (que verifica el plan Pro). */
export async function exportFile(text: string, format: "txt" | "md", name: string, token: string) {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, format, name }),
  });
  if (!res.ok) throw await parseError(res);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function requestPaymentNotice(token: string) {
  const res = await fetch("/api/me", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ notify: true }),
  });
  if (!res.ok) throw await parseError(res);
}
