import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Cookies · Voz a Texto",
  description: "Información detallada sobre el uso de cookies y tecnologías de almacenamiento local en Voz a Texto.",
};

export default function CookiesPage() {
  return (
    <div className="container policy-container">
      <header className="header glass" style={{ marginBottom: "20px" }}>
        <div className="brand">
          <Link href="/" className="logo" style={{ textDecoration: "none" }}>🍪</Link>
          <div>
            <h1>Política de Cookies</h1>
            <p>Última actualización: 9 de noviembre de 2026</p>
          </div>
        </div>
        <Link href="/" className="btn">
          ← Volver a la aplicación
        </Link>
      </header>

      <article className="glass card policy-content">
        <section>
          <h2>1. ¿Qué son las Cookies y el Almacenamiento Local?</h2>
          <p>
            Una cookie es un pequeño archivo de texto que los sitios web almacenan en su navegador para recordar 
            información sobre su visita. Tecnologías similares incluyen el almacenamiento local del navegador (<em>localStorage</em> y <em>sessionStorage</em>), 
            los cuales permiten conservar preferencias operativas directamente en su dispositivo.
          </p>
        </section>

        <section>
          <h2>2. ¿Qué tipos de Cookies y Almacenamiento utilizamos?</h2>
          <p>
            En <strong>Voz a Texto</strong> priorizamos la privacidad de nuestros usuarios. <strong>No utilizamos cookies de publicidad de terceros, rastreadores invasivos ni venta de perfiles comerciales.</strong>
          </p>
          <p>Únicamente empleamos tecnologías técnicas estrictamente necesarias y funcionales:</p>

          <table className="plans" style={{ marginTop: "14px", marginBottom: "14px" }}>
            <thead>
              <tr>
                <th>Nombre / Tipo</th>
                <th>Finalidad</th>
                <th>Duración</th>
                <th>Origen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Firebase Auth</strong></td>
                <td>Mantener la sesión iniciada del usuario y verificar tokens criptográficos seguros.</td>
                <td>Sesión / Persistente</td>
                <td>Técnica (Google / Firebase)</td>
              </tr>
              <tr>
                <td><strong>theme (localStorage)</strong></td>
                <td>Recordar su preferencia de tema visual (modo claro o modo oscuro).</td>
                <td>Indefinida (local)</td>
                <td>Funcional (Propia)</td>
              </tr>
              <tr>
                <td><strong>transcript (localStorage)</strong></td>
                <td>Preservar su texto transcrito para evitar pérdidas accidentales al recargar la página.</td>
                <td>Hasta que el usuario pulse &quot;Reiniciar&quot; o borre datos</td>
                <td>Funcional (Propia)</td>
              </tr>
              <tr>
                <td><strong>cookies_accepted</strong></td>
                <td>Registrar su consentimiento informado sobre el uso de cookies funcionales.</td>
                <td>1 año</td>
                <td>Técnica (Propia)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>3. Cookies de Terceros Esenciales</h2>
          <p>
            Al iniciar sesión con Google o gestionar su cuenta, Google Identity Services y Firebase Authentication 
            pueden establecer identificadores técnicos de seguridad para autenticar su identidad y proteger su cuenta contra accesos no autorizados.
          </p>
        </section>

        <section>
          <h2>4. ¿Cómo Deshabilitar o Eliminar las Cookies?</h2>
          <p>
            Usted puede en cualquier momento configurar, bloquear o eliminar las cookies y datos de sitios almacenados a través de la configuración de su navegador web:
          </p>
          <ul>
            <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
            <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad y seguridad &gt; Cookies y datos del sitio.</li>
            <li><strong>Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
            <li><strong>Microsoft Edge:</strong> Configuración &gt; Permisos del sitio &gt; Cookies y datos almacenados.</li>
          </ul>
          <p>
            <em>Nota:</em> Si bloquea las tecnologías de almacenamiento esenciales de sesión, no podrá iniciar sesión en su cuenta ni acceder a las funciones protegidas del Servicio.
          </p>
        </section>

        <section>
          <h2>5. Contacto sobre Cookies y Privacidad</h2>
          <p>
            Para cualquier consulta, duda o ejercicio de derechos respecto a nuestra Política de Cookies, puede escribirnos directamente a:{" "}
            <a href="mailto:contacto@oceanicaweb.cl" className="link">contacto@oceanicaweb.cl</a>.
          </p>
        </section>
      </article>

      <footer className="footer" style={{ marginTop: "24px" }}>
        Contacto legal y de privacidad: <a href="mailto:contacto@oceanicaweb.cl" className="link">contacto@oceanicaweb.cl</a>
      </footer>
    </div>
  );
}

