import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada (404) · Voz a Texto",
  description: "La página que buscas no existe o ha sido movida.",
};

export default function NotFound() {
  return (
    <>
      <div className="bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <main className="container" style={{ minHeight: "85vh", display: "grid", placeItems: "center" }}>
        <div className="glass card" style={{ maxWidth: "520px", textAlign: "center", padding: "40px 28px", alignItems: "center" }}>
          <div className="logo" style={{ fontSize: "2.2rem", width: "64px", height: "64px", marginBottom: "8px" }} aria-hidden="true">
            🔍
          </div>

          <h1 style={{ fontSize: "3rem", lineHeight: 1, margin: "6px 0", background: "var(--grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            404
          </h1>

          <h2 style={{ fontSize: "1.3rem", margin: "4px 0 12px" }}>
            Página no encontrada
          </h2>

          <p className="muted" style={{ lineHeight: 1.6, marginBottom: "20px" }}>
            Lo sentimos, la dirección a la que intentas acceder no existe, ha cambiado de lugar o no se encuentra disponible.
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/" className="btn primary" style={{ textDecoration: "none" }}>
              🎙️ Ir a la aplicación principal
            </Link>
            <Link href="/privacidad" className="btn" style={{ textDecoration: "none" }}>
              Privacidad
            </Link>
          </div>

          <footer className="footer" style={{ marginTop: "32px", fontSize: "0.8rem" }}>
            ¿Tienes dudas? Escríbenos a{" "}
            <a href="mailto:contacto@oceanicaweb.cl" className="link">
              contacto@oceanicaweb.cl
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}

