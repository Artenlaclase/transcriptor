"use client";
import { useEffect, useRef } from "react";

/** Visualizador de barras en vivo del micrófono mientras `active` es true. */
export default function LiveVisualizer({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const accent = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#6366f1";

    const drawIdle = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = accent();
      ctx.globalAlpha = 0.35;
      for (let x = 0; x < w; x += 6) ctx.fillRect(x, h / 2 - 1, 3, 2);
      ctx.globalAlpha = 1;
    };

    if (!active) {
      drawIdle();
      return;
    }

    let raf = 0;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        audioCtx.createMediaStreamSource(s).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const color = accent();
        const draw = () => {
          raf = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(data);
          ctx.clearRect(0, 0, w, h);
          const bars = Math.floor(w / 6);
          ctx.fillStyle = color;
          for (let i = 0; i < bars; i++) {
            const v = data[Math.floor((i / bars) * data.length * 0.7)] / 255;
            const bh = Math.max(2, v * h);
            ctx.beginPath();
            ctx.roundRect(i * 6, (h - bh) / 2, 3, bh, 2);
            ctx.fill();
          }
        };
        draw();
      })
      .catch(() => drawIdle());

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtx?.close();
    };
  }, [active]);

  return <canvas ref={canvasRef} className="live-viz" aria-hidden="true" />;
}
