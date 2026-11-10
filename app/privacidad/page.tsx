import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad · Voz a Texto",
  description: "Política de privacidad y tratamiento de datos personales de Voz a Texto conforme a la legislación aplicable.",
};

export default function PrivacidadPage() {
  return (
    <div className="container policy-container">
      <header className="header glass" style={{ marginBottom: "20px" }}>
        <div className="brand">
          <Link href="/" className="logo" style={{ textDecoration: "none" }}>🎙️</Link>
          <div>
            <h1>Política de Privacidad</h1>
            <p>Última actualización: 9 de noviembre de 2026</p>
          </div>
        </div>
        <Link href="/" className="btn">
          ← Volver a la aplicación
        </Link>
      </header>

      <article className="glass card policy-content">
        <section>
          <h2>1. Identificación del Responsable</h2>
          <p>
            El presente sitio web y servicio <strong>Voz a Texto</strong> (en adelante, &quot;el Servicio&quot;) es operado 
            bajo la responsabilidad legal y técnica accesible mediante el correo electrónico de contacto:{" "}
            <a href="mailto:contacto@oceanicaweb.cl" className="link">contacto@oceanicaweb.cl</a>.
          </p>
          <p>
            Nos comprometemos a garantizar la confidencialidad, integridad y seguridad de los datos personales 
            de nuestros usuarios en conformidad con la <strong>Ley N° 19.628 sobre Protección de la Vida Privada de Chile</strong>, 
            el Reglamento General de Protección de Datos (RGPD / GDPR de la UE) y las directrices internacionales aplicables.
          </p>
        </section>

        <section>
          <h2>2. Datos que Recopilamos</h2>
          <p>Recopilamos únicamente la información indispensable para la prestación de nuestros servicios:</p>
          <ul>
            <li><strong>Datos de Registro y Autenticación:</strong> Nombre, dirección de correo electrónico y credenciales gestionadas a través de Firebase Authentication (o Google OAuth si decide iniciar sesión con su cuenta Google).</li>
            <li><strong>Archivos de Audio y Transcripciones:</strong> Archivos de audio proporcionados voluntariamente por el usuario para transcripción y el texto resultante generado.</li>
            <li><strong>Datos de Uso Técnico:</strong> Dirección IP, tipo de navegador y registros de auditoría técnica con fines estrictos de seguridad, prevención de fraude y limitación de tasa (rate limiting).</li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidad del Tratamiento</h2>
          <p>Los datos personales son tratados con las siguientes finalidades legítimas:</p>
          <ul>
            <li>Permitir la creación y administración de cuentas de usuario.</li>
            <li>Procesar archivos de audio para la generación de transcripciones mediante modelos de Inteligencia Artificial (Google Gemini API).</li>
            <li>Proporcionar herramientas de edición, formateo, traducción y descarga de contenidos.</li>
            <li>Gestionar los planes de servicio (Gratuito y Pro) y registrar notificaciones operativas de pago.</li>
            <li>Proteger la infraestructura contra ataques cibernéticos, accesos no autorizados y abusos de cuota.</li>
          </ul>
        </section>

        <section>
          <h2>4. Procesamiento de Audio e Inteligencia Artificial</h2>
          <p>
            Los archivos de audio que usted sube al Servicio se transmiten de forma cifrada mediante canales HTTPS 
            hacia la API oficial de Google Gemini (Google Cloud).
          </p>
          <p>
            <strong>Garantía de Privacidad de Archivos:</strong> Una vez completado el procesamiento y generada la transcripción, 
            los archivos temporales son eliminados de forma automática e inmediata de nuestros servidores y de los servidores de almacenamiento 
            de la API. No comercializamos, cedemos ni utilizamos sus grabaciones de audio personales para entrenar modelos públicos de inteligencia artificial.
          </p>
        </section>

        <section>
          <h2>5. Conservación de los Datos</h2>
          <p>
            Los datos de su perfil de usuario (nombre y correo electrónico) se conservan mientras mantenga activa su cuenta en el Servicio. 
            El texto de sus transcripciones se conserva en el almacenamiento local de su propio navegador (<em>localStorage</em>) 
            y puede ser borrado en cualquier momento utilizando el botón &quot;Nueva transcripción&quot; o limpiando los datos de su navegador.
          </p>
        </section>

        <section>
          <h2>6. Derechos del Titular (ARCO)</h2>
          <p>
            De conformidad con la legislación aplicable, usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento 
            de sus datos personales, así como a solicitar la eliminación definitiva de su cuenta de usuario.
          </p>
          <p>
            Para ejercer cualquiera de estos derechos, basta con enviar una solicitud formal por escrito a nuestro correo oficial de privacidad:{" "}
            <a href="mailto:contacto@oceanicaweb.cl" className="link">contacto@oceanicaweb.cl</a>.
          </p>
        </section>

        <section>
          <h2>7. Medidas de Seguridad</h2>
          <p>
            Implementamos estrictas medidas técnicas y organizativas para salvaguardar sus datos: conexiones cifradas mediante 
            TLS/HTTPS, políticas de seguridad de contenido (CSP), encabezados anti-clickjacking, tokens criptográficos 
            de sesión gestionados por Google Identity Services y aislamiento de roles en bases de datos protegidas.
          </p>
        </section>

        <section>
          <h2>8. Modificaciones a esta Política</h2>
          <p>
            Nos reservamos el derecho de actualizar esta Política de Privacidad para adecuarla a novedades legislativas o mejoras técnicas. 
            Cualquier modificación sustancial será notificada a través del sitio web.
          </p>
        </section>
      </article>

      <footer className="footer" style={{ marginTop: "24px" }}>
        Contacto legal y de privacidad: <a href="mailto:contacto@oceanicaweb.cl" className="link">contacto@oceanicaweb.cl</a>
      </footer>
    </div>
  );
}

