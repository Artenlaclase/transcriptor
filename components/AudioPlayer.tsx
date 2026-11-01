"use client";
import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/utils";

const BARS = 160;

export default function AudioPlayer({ file }: { file: File }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  const [peaks, setPeaks] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);

  // URL del objeto
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    setPlaying(false);
    setTime(0);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Picos de la forma de onda
  useEffect(() => {
    let cancelled = false;
    setPeaks([]);
    (async () => {
      try {
        const buf = await file.arrayBuffer();
        const ctx = new AudioContext();
        const audio = await ctx.decodeAudioData(buf);
        ctx.close();
        const ch = audio.getChannelData(0);
        const block = Math.floor(ch.length / BARS) || 1;
        const out: number[] = [];
        for (let i = 0; i < BARS; i++) {
          let max = 0;
          for (let j = 0; j < block; j += 16) max = Math.max(max, Math.abs(ch[i * block + j] || 0));
          out.push(max);
        }
        const top = Math.max(...out, 0.01);
        if (!cancelled) setPeaks(out.map((p) => p / top));
      } catch {
        if (!cancelled) setPeaks(Array(BARS).fill(0.15));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Dibujo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue("--accent").trim() || "#6366f1";
    const muted = css.getPropertyValue("--wave-muted").trim() || "#94a3b8";
    const progress = duration ? time / duration : 0;
    const step = w / BARS;
    peaks.forEach((p, i) => {
      const bh = Math.max(3, p * h * 0.95);
      ctx.fillStyle = i / BARS <= progress ? accent : muted;
      ctx.beginPath();
      ctx.roundRect(i * step + 1, (h - bh) / 2, Math.max(1, step - 2), bh, 2);
      ctx.fill();
    });
  });

  // Redibujar al cambiar tamaño o tema
  const [, force] = useState(0);
  useEffect(() => {
    const on = () => force((n) => n + 1);
    window.addEventListener("resize", on);
    const mo = new MutationObserver(on);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      window.removeEventListener("resize", on);
      mo.disconnect();
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    a.paused ? a.play() : a.pause();
  };
  const seekTo = (t: number) => {
    const a = audioRef.current;
    if (a) a.currentTime = Math.min(Math.max(0, t), duration || 0);
  };
  const onWaveClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    seekTo(((e.clientX - r.left) / r.width) * duration);
  };

  return (
    <div className="player">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      <canvas
        ref={canvasRef}
        className="wave"
        onClick={onWaveClick}
        role="slider"
        tabIndex={0}
        aria-label="Posición de reproducción"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(time)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") seekTo(time + 5);
          if (e.key === "ArrowLeft") seekTo(time - 5);
        }}
      />
      <div className="player-row">
        <span className="time">
          {formatTime(time)} / {formatTime(duration)}
        </span>
        <div className="player-controls">
          <button className="icon-btn" onClick={() => seekTo(time - 10)} aria-label="Retroceder 10 segundos">
            ⏪
          </button>
          <button className="icon-btn primary round" onClick={toggle} aria-label={playing ? "Pausar" : "Reproducir"}>
            {playing ? "⏸" : "▶"}
          </button>
          <button className="icon-btn" onClick={() => seekTo(time + 10)} aria-label="Adelantar 10 segundos">
            ⏩
          </button>
        </div>
        <div className="player-extra">
          <label className="mini">
            <span className="sr-only">Velocidad</span>
            <select
              value={rate}
              onChange={(e) => {
                const r = Number(e.target.value);
                setRate(r);
                if (audioRef.current) audioRef.current.playbackRate = r;
              }}
            >
              {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                <option key={r} value={r}>
                  {r}×
                </option>
              ))}
            </select>
          </label>
          <label className="mini vol">
            <span aria-hidden="true">🔊</span>
            <span className="sr-only">Volumen</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
