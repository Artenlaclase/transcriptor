"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import { useAuth } from "@/components/AuthProvider";
import AuthModal, { type AuthMode } from "@/components/AuthModal";
import LiveVisualizer from "@/components/LiveVisualizer";
import UpgradeModal from "@/components/UpgradeModal";
import { FREE_MAX_BYTES, MB, TARGETS, maxBytesFor } from "@/lib/plans";
import {
  ApiError,
  callGemini,
  countWords,
  exportFile,
  formatFileSize,
  requestPaymentNotice,
  transcribeAudioFile,
} from "@/lib/utils";

const LANGS = [
  { code: "es-ES", label: "España" },
  { code: "es-MX", label: "México" },
  { code: "es-AR", label: "Argentina" },
  { code: "es-CL", label: "Chile" },
  { code: "es-CO", label: "Colombia" },
  { code: "es-US", label: "EE. UU." },
];

const ACTIONS = [
  { id: "summarize", icon: "📝", label: "Resumir" },
  { id: "grammar", icon: "✅", label: "Corregir gramática" },
  { id: "format", icon: "🗒️", label: "Formato de notas" },
  { id: "keypoints", icon: "🎯", label: "Puntos clave y acciones" },
  { id: "translate", icon: "🌐", label: "Traducir" },
] as const;

type Tab = "mic" | "file";

export default function Home() {
  const { user, name: userName, plan, loading: authLoading, signOut, getToken } = useAuth();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState<Tab>("mic");
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [lang, setLang] = useState("es-ES");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState("");
  const [aiLabel, setAiLabel] = useState("");
  const [target, setTarget] = useState<string>("inglés");
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [copied, setCopied] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [upgrade, setUpgrade] = useState<{ open: boolean; reason?: string }>({ open: false });

  const recRef = useRef<any>(null);
  const wantRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    setToast({ msg, kind });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  const openUpgrade = (reason?: string) => setUpgrade({ open: true, reason });

  /** Devuelve el token o abre el login si no hay sesión. */
  const requireToken = async (): Promise<string> => {
    const t = await getToken();
    if (!t) {
      setAuthMode("login");
      throw new ApiError("Inicia sesión para continuar.", 401, "AUTH_REQUIRED");
    }
    return t;
  };

  const handleError = (e: unknown) => {
    if (e instanceof ApiError) {
      if (e.code === "PRO_REQUIRED" || e.code === "LIMIT_EXCEEDED") return openUpgrade(e.message);
      if (e.code === "AUTH_REQUIRED") {
        setAuthMode("login");
        return notify(e.message, "err");
      }
      return notify(e.message, "err");
    }
    notify("Ocurrió un error inesperado.", "err");
  };

  // Tema
  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as "light" | "dark") || "light");
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  // Persistencia del texto
  useEffect(() => {
    try {
      const saved = localStorage.getItem("transcript");
      if (saved) setText(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("transcript", text);
    } catch {}
  }, [text]);

  // Reconocimiento de voz en tiempo real
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let fin = "";
      let tmp = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript;
        else tmp += r[0].transcript;
      }
      if (fin) {
        setText((prev) => {
          const chunk = fin.trim();
          if (!chunk) return prev;
          const sep = !prev || /\s$/.test(prev) ? "" : " ";
          return prev + sep + chunk.charAt(0).toUpperCase() + chunk.slice(1);
        });
      }
      setInterim(tmp);
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantRef.current = false;
        setListening(false);
        notify("Permiso de micrófono denegado.", "err");
      } else if (e.error === "audio-capture") {
        wantRef.current = false;
        setListening(false);
        notify("No se encontró ningún micrófono.", "err");
      }
    };
    rec.onend = () => {
      setInterim("");
      if (wantRef.current) {
        try {
          rec.start();
        } catch {}
      } else setListening(false);
    };
    recRef.current = rec;
    return () => {
      wantRef.current = false;
      rec.abort();
    };
  }, [notify]);

  const toggleListening = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      wantRef.current = false;
      rec.stop();
      setListening(false);
    } else {
      rec.lang = lang;
      wantRef.current = true;
      try {
        rec.start();
        setListening(true);
      } catch {
        notify("No se pudo iniciar el micrófono.", "err");
      }
    }
  };

  const changeLang = (code: string) => {
    setLang(code);
    if (listening && recRef.current) {
      recRef.current.lang = code;
      recRef.current.stop();
    }
  };

  // Archivos
  const acceptFile = (f: File | undefined | null) => {
    if (!f) return;
    if (!f.type.startsWith("audio/") && !/\.(mp3|wav|m4a|ogg|flac|aac|webm|opus|mp4)$/i.test(f.name)) {
      notify("Selecciona un archivo de audio válido.", "err");
      return;
    }
    setFile(f);
    setTab("file");
  };

  const limit = maxBytesFor(plan);
  const overLimit = !!file && file.size > limit;

  const transcribeFile = async () => {
    if (!file) return;
    if (!user) {
      setAuthMode("register");
      notify("Crea una cuenta gratis para transcribir archivos.", "err");
      return;
    }
    if (overLimit) {
      openUpgrade(`Tu archivo pesa ${formatFileSize(file.size)}. El plan gratis admite hasta ${FREE_MAX_BYTES / MB} MB.`);
      return;
    }
    setBusy("transcribe");
    try {
      const token = await requireToken();
      const result = await transcribeAudioFile(file, token);
      setText((p) => (p.trim() ? p.trimEnd() + "\n\n" : "") + result);
      notify("¡Audio transcrito exitosamente!");
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(null);
    }
  };

  // Gemini
  const runAI = async (id: string, label: string) => {
    if (!user) {
      setAuthMode("register");
      notify("Crea una cuenta gratis para usar la IA.", "err");
      return;
    }
    if (!text.trim()) {
      notify("Primero escribe o dicta algo de texto.", "err");
      return;
    }
    setBusy(id);
    try {
      const token = await requireToken();
      const result = await callGemini({ action: id, text, target }, token);
      setAiResult(result);
      setAiLabel(label);
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(null);
    }
  };

  // Descarga (solo Pro; verificada en el servidor)
  const doExport = async (content: string, format: "txt" | "md", base: string) => {
    if (!user) {
      setAuthMode("register");
      notify("Crea una cuenta para continuar.", "err");
      return;
    }
    if (plan !== "pro") {
      openUpgrade("Descargar en .txt y .md es una función del plan Pro.");
      return;
    }
    try {
      await exportFile(content, format, base, await requireToken());
    } catch (e) {
      handleError(e);
    }
  };

  const resetAll = () => {
    const hasData = text.trim() || interim || file || aiResult;
    if (hasData && !confirm("¿Iniciar una nueva transcripción? Se borrará el texto actual, el archivo cargado y los resultados de IA.")) {
      return;
    }
    if (listening && recRef.current) {
      wantRef.current = false;
      try {
        recRef.current.stop();
      } catch {}
      setListening(false);
    }
    setText("");
    setInterim("");
    setFile(null);
    setAiResult("");
    setAiLabel("");
    setBusy(null);
    try {
      localStorage.removeItem("transcript");
    } catch {}
    notify("Nueva transcripción iniciada. Todo en cero.");
  };

  const copy = async (value: string) => {
    if (!user) {
      setAuthMode("register");
      notify("Inicia sesión o crea una cuenta gratis para copiar el texto.", "err");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notify("No se pudo copiar al portapapeles.", "err");
    }
  };

  const words = countWords(text);
  const chars = text.length;
  const lock = plan === "pro" ? "" : "🔒 ";

  return (
    <>
      <div className="bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <main
        className="container"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          acceptFile(e.dataTransfer.files?.[0]);
        }}
      >
        <header className="header glass">
          <div className="brand">
            <span className="logo" aria-hidden="true">🎙️</span>
            <div>
              <h1>Voz a Texto</h1>
              <p>Transcripción en español con IA</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn primary new-session-btn" onClick={resetAll} title="Reiniciar todo a cero">
              ✨ Nueva transcripción
            </button>
            {!authLoading &&
              (user ? (
                <>
                  <span className="user-chip" title={user.email ?? ""}>
                    👤 {userName || user.email}
                    <span className={`badge ${plan}`}>{plan === "pro" ? "Pro" : "Gratis"}</span>
                  </span>
                  {plan !== "pro" && (
                    <button className="btn" onClick={() => openUpgrade()}>⭐ Pro</button>
                  )}
                  <button className="btn" onClick={() => signOut()}>Salir</button>
                </>
              ) : (
                <>
                  <button className="btn" onClick={() => setAuthMode("login")}>Iniciar sesión</button>
                  <button className="btn" onClick={() => setAuthMode("register")}>Crear cuenta</button>
                </>
              ))}
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title="Cambiar tema"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <div className="grid">
          <section className="glass card" aria-labelledby="in-title">
            <h2 id="in-title" className="sr-only">Entrada de audio</h2>
            <div className="tabs" role="tablist">
              <button role="tab" aria-selected={tab === "mic"} className={tab === "mic" ? "tab on" : "tab"} onClick={() => setTab("mic")}>
                🎤 Micrófono
              </button>
              <button role="tab" aria-selected={tab === "file"} className={tab === "file" ? "tab on" : "tab"} onClick={() => setTab("file")}>
                📁 Archivo
              </button>
            </div>

            {tab === "mic" ? (
              <div className="panel" role="tabpanel">
                {!supported && (
                  <p className="warn" role="alert">
                    Tu navegador no soporta la API Web Speech. Se recomienda Google Chrome, Edge o Safari.
                  </p>
                )}
                <LiveVisualizer active={listening} />
                <button
                  className={`mic ${listening ? "rec" : ""}`}
                  onClick={toggleListening}
                  disabled={!supported}
                  aria-pressed={listening}
                  aria-label={listening ? "Detener dictado" : "Iniciar dictado"}
                >
                  <span className="mic-ring" />
                  <span className="mic-ico">{listening ? "⏹" : "🎤"}</span>
                </button>
                <p className="status" aria-live="polite">
                  {listening ? "Escuchando… habla con naturalidad" : "Pulsa para empezar a dictar"}
                </p>
                <label className="field">
                  <span>Variante regional</span>
                  <select value={lang} onChange={(e) => changeLang(e.target.value)}>
                    {LANGS.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label} ({l.code})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="panel" role="tabpanel">
                <label className={`drop ${dragging ? "over" : ""}`}>
                  <input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac,.webm,.opus,.mp4" hidden onChange={(e) => acceptFile(e.target.files?.[0])} />
                  <span className="drop-ico" aria-hidden="true">⬆️</span>
                  <strong>{file ? file.name : "Arrastra un audio aquí"}</strong>
                  <small>
                    {file
                      ? `Tamaño: ${formatFileSize(file.size)} · Pulsa para cambiar archivo`
                      : "o pulsa para elegir archivo (MP3, WAV, M4A, OGG, FLAC…)"}
                  </small>
                </label>
                <p className={`limit ${overLimit ? "bad" : ""}`}>
                  {plan === "pro" ? "Plan Pro: archivos de hasta 2 GB." : `Plan gratis: archivos de hasta ${FREE_MAX_BYTES / MB} MB.`}{" "}
                  {plan !== "pro" && (
                    <button className="link" onClick={() => openUpgrade()}>Ampliar a 2 GB</button>
                  )}
                </p>
                {file && (
                  <>
                    <AudioPlayer file={file} />
                    <button className="btn primary" onClick={transcribeFile} disabled={busy === "transcribe"}>
                      {busy === "transcribe" ? <span className="spin" /> : overLimit ? "🔒" : "✨"} Transcribir con Gemini
                    </button>
                    {!user && <small className="hint">Necesitas una cuenta gratuita para transcribir archivos.</small>}
                  </>
                )}
              </div>
            )}
          </section>

          <section className="glass card editor" aria-labelledby="ed-title">
            <div className="card-head">
              <h2 id="ed-title">Transcripción</h2>
              <div className="stats" aria-live="polite">
                <span className="chip">{words} palabras</span>
                <span className="chip">{chars} caracteres</span>
                {(text || file || aiResult) && (
                  <button className="chip chip-btn" onClick={resetAll} title="Volver a cero">
                    🔄 Reiniciar
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Aquí aparecerá tu transcripción en tiempo real o tras cargar un archivo. También puedes redactar libremente..."
              aria-label="Texto transcrito"
              spellCheck
              lang="es"
              maxLength={200000}
              onCopy={(e) => {
                if (!user) {
                  e.preventDefault();
                  setAuthMode("register");
                  notify("Inicia sesión o crea una cuenta gratis para copiar el texto.", "err");
                }
              }}
              onCut={(e) => {
                if (!user) e.preventDefault();
              }}
            />
            {interim && <p className="interim">{interim}</p>}
            <div className="toolbar">
              <button className="btn" onClick={() => copy(text)} disabled={!text}>
                {copied ? "✔ Copiado" : `${user ? "" : "🔒 "}📋 Copiar`}
              </button>
              <button className="btn" onClick={() => doExport(text, "txt", "transcripcion")} disabled={!text}>
                {lock}⬇️ .txt
              </button>
              <button className="btn" onClick={() => doExport(text, "md", "transcripcion")} disabled={!text}>
                {lock}⬇️ .md
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  if (!text || confirm("¿Seguro que deseas borrar el texto?")) {
                    setText("");
                    setAiResult("");
                  }
                }}
                disabled={!text}
              >
                🗑️ Borrar
              </button>
            </div>
            {text && !user && (
              <small className="hint">🔒 Inicia sesión o crea una cuenta gratis para copiar. Descargar requiere el plan Pro.</small>
            )}
            {text && user && plan !== "pro" && (
              <small className="hint">🔒 Descargar en .txt / .md requiere el plan Pro. Copiar es gratis.</small>
            )}
          </section>

          <section className="glass card ai" aria-labelledby="ai-title">
            <div className="card-head">
              <h2 id="ai-title">✨ Gemini IA</h2>
              <label className="field inline">
                <span>Traducir a</span>
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                  {TARGETS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="actions">
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  className="btn action"
                  disabled={!!busy}
                  onClick={() => runAI(a.id, a.id === "translate" ? `Traducción (${target})` : a.label)}
                >
                  {busy === a.id ? <span className="spin" /> : a.icon} {a.label}
                </button>
              ))}
            </div>
            {!user && <small className="hint">Crea una cuenta gratis para usar las herramientas de IA.</small>}

            {aiResult && (
              <div className="result" aria-live="polite">
                <div className="result-head">
                  <strong>{aiLabel}</strong>
                  <button className="icon-btn sm" onClick={() => setAiResult("")} aria-label="Cerrar resultado">
                    ✕
                  </button>
                </div>
                <pre>{aiResult}</pre>
                <div className="toolbar">
                  <button className="btn" onClick={() => { setText(aiResult); notify("Texto sustituido."); }}>
                    Reemplazar
                  </button>
                  <button className="btn" onClick={() => { setText((p) => p.trimEnd() + "\n\n" + aiResult); notify("Resultado agregado."); }}>
                    Añadir al final
                  </button>
                  <button className="btn" onClick={() => copy(aiResult)}>📋 Copiar</button>
                  <button className="btn" onClick={() => doExport(aiResult, "md", "resultado")}>
                    {lock}⬇️ .md
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="footer">Desarrollado por Raúl Rosales · Next.js · Web Speech API · Gemini</footer>
      </main>

      {authMode && <AuthModal mode={authMode} onMode={setAuthMode} onClose={() => setAuthMode(null)} />}
      {upgrade.open && (
        <UpgradeModal
          reason={upgrade.reason}
          onClose={() => setUpgrade({ open: false })}
          onNotify={async () => requestPaymentNotice(await requireToken())}
          onRegister={() => {
            setUpgrade({ open: false });
            setAuthMode("register");
          }}
        />
      )}
      {dragging && <div className="drag-overlay">Suelta el archivo de audio para cargarlo</div>}
      {toast && (
        <div className={`toast ${toast.kind}`} role="status">
          {toast.msg}
        </div>
      )}
    </>
  );
}
