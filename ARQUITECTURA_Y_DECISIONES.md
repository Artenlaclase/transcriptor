# Arquitectura y Decisiones de Diseño: Voz a Texto (Transcriptor IA)

Este documento detalla la estructura técnica de la aplicación, cómo está construida y las razones detrás de cada decisión de ingeniería adoptada.

---

## 1. Visión General del Proyecto

La aplicación es una SPA (*Single Page Application*) desarrollada sobre **Next.js (App Router)** orientada a la transcripción continua y procesamiento de audio en español mediante Inteligencia Artificial (Google Gemini).

El objetivo principal es ofrecer una solución con dos flujos complementarios:
1. **Dictado en tiempo real sin latencia ni coste de API** para notas rápidas y trabajo continuo.
2. **Transcripción y análisis de archivos de audio completos (sin límite artificial de tamaño)** utilizando modelos multimodales avanzados de Gemini.

---

## 2. Decisiones Técnicas y de Arquitectura

### 2.1. Next.js (App Router) + TypeScript
- **Por qué:** 
  - Permite tener tanto la interfaz de usuario (React) como las rutas de backend seguras (`/api/gemini`) en un único repositorio sin requerir servidores adicionales (Express, FastAPI, etc.).
  - Next.js protege las credenciales críticas: la `GEMINI_API_KEY` nunca llega al navegador del usuario, se procesa exclusivamente en el entorno Node.js del servidor.
  - TypeScript garantiza robustez en el manejo de tipos de audio, eventos del navegador y contratos de API.

---

### 2.2. Transcripción de Voz: Enfoque Híbrido

#### A. Micrófono en Tiempo Real -> Web Speech API (`SpeechRecognition`)
- **Decisión:** Usar el motor nativo del navegador (`window.SpeechRecognition` / `webkitSpeechRecognition`) para la voz en directo en lugar de enviar streams constantes de audio a una API de pago.
- **Razones:**
  - **Latencia cero:** Las palabras aparecen instantáneamente en pantalla según el usuario habla.
  - **Sin costo por minuto de API:** El procesamiento en tiempo real se ejecuta en el dispositivo/navegador.
  - **Modo continuo automático:** Se implementó un bucle de reconexión en el evento `onend` para evitar que el navegador detenga la escucha tras silencios breves.
  - **Compatibilidad regional:** Se incluyó un selector con variantes regionales del español (`es-ES`, `es-MX`, `es-AR`, `es-CL`, `es-CO`, `es-US`) para mejorar la precisión acústica según el acento.

#### B. Archivos de Audio Grabados -> Gemini Files API (`@google/genai`)
- **Decisión:** Subir archivos de audio vía `multipart/form-data` al endpoint de backend y de allí a la **Files API de Google Gemini**.
- **Razones del cambio frente a Base64 (*inline data*):**
  - **Eliminación del límite de 20 MB:** Base64 incrementa el peso del archivo en un ~33% y satura la memoria del servidor en peticiones HTTP JSON. La Files API permite procesar audios de hasta **2 GB** (grabaciones de reuniones largas, conferencias, podcasts).
  - **Manejo de ciclo de vida seguro:** El backend almacena un archivo temporal mínimo, lo envía a Google, espera la transcripción y lo destruye de inmediato (`unlink` local y `ai.files.delete` remoto), protegiendo la privacidad y evitando fugas de almacenamiento.

---

### 2.3. Reproductor de Audio y Visualización de Forma de Onda (Waveform)

- **Decisión:** Implementación personalizada con HTML5 `<canvas>` y la **Web Audio API** nativa (`AudioContext.decodeAudioData`), en lugar de bibliotecas externas pesadas (como `wavesurfer.js`).
- **Razones:**
  - **Rendimiento ligero:** Se generan exactamente 160 barras muestreadas a partir del buffer de audio. No añade megabytes innecesarios al bundle de JavaScript.
  - **Interactividad accesible:** Permite hacer clic o arrastrar en la forma de onda para adelantar/retroceder a cualquier punto exacto del audio con sincronización visual en tiempo real.
  - **Controles avanzados integrados:** Modificación de velocidad de reproducción (0.75x a 2x) y volumen, facilitando la revisión de transcripciones largas.

---

### 2.4. Integración con Gemini para Procesamiento Inteligente de Texto

- **Decisión:** Creación de un menú de acciones rápidas orientadas a la productividad:
  - **Resumir:** Sintetiza el contenido manteniendo las ideas centrales.
  - **Corregir gramática:** Agrega mayúsculas, comas, puntos y tildes omitidos en el dictado por voz.
  - **Formato de notas:** Transforma texto plano en un documento Markdown estructurado con títulos y viñetas.
  - **Puntos clave y acciones:** Identifica compromisos y tareas con casillas `- [ ]`.
  - **Traducir:** Traduce a 8 idiomas seleccionables.
- **Razón del modelo por defecto (`gemini-2.5-flash` / `gemini-3-flash-preview`):**
  - La familia Flash ofrece la velocidad de inferencia más rápida del mercado, menor latencia de respuesta y una ventana de contexto de 1 millón de tokens, ideal para transcripciones extensas.

---

### 2.5. Experiencia de Usuario (UI/UX) y Diseño Glassmorphism

- **Estética Glassmorphism:** Fondo con degradados flotantes desenfocados (*blur 80px*) y tarjetas semitransparentes con `backdrop-filter: blur(18px)`. Otorga una apariencia moderna, limpia y profesional.
- **Tema Claro / Oscuro sin parpadeo (FOUC):** Inyección de un script síncrono mínimo en `<head>` que lee `localStorage` o la preferencia del sistema operativo antes de hidratar el DOM.
- **Microinteracciones y Feedback:**
  - Botón de micrófono con animación de ondas concéntricas (`@keyframes pulse`) en estado de grabación.
  - Visualizador en vivo con Canvas del espectro sonoro captado por el micrófono.
  - Soporte completo de arrastrar y soltar (*drag and drop*) sobre toda la ventana con indicador visual superpuesto.
  - Almacenamiento local persistente (`localStorage`): Si el usuario recarga la pestaña por error, su texto no se pierde.

---

### 2.6. Herramientas de Exportación y Accesibilidad

- **Exportación local instantánea:** Descarga directa en formatos `.txt` y `.md` generados mediante `Blob` en memoria del navegador sin depender del servidor.
- **Accesibilidad (a11y):** Roles ARIA (`tablist`, `slider`, `status`, `alert`), atributos `aria-live="polite"` para lectores de pantalla en los contadores y compatibilidad con `prefers-reduced-motion` para usuarios sensibles a animaciones.

---

## 3. Resumen de la Estructura de Archivos

```
C:\proyectos\transcriptor\
├── app/
│   ├── api/gemini/route.ts      # Backend: subida a Gemini Files API y prompts de IA
│   ├── globals.css              # Estilos globales, variables CSS y Glassmorphism
│   ├── layout.tsx               # Estructura raíz y script de detección de tema
│   └── page.tsx                 # SPA principal: control de voz, editor e interfaz
├── components/
│   ├── AudioPlayer.tsx          # Reproductor con render de onda en Canvas
│   └── LiveVisualizer.tsx       # Espectro de barras en vivo para el micrófono
├── lib/
│   └── utils.ts                 # Funciones de descarga, formateo, llamadas de API
├── .env.local                   # Clave de Gemini (protegido fuera de Git)
├── package.json                 # Dependencias (Next.js, React, @google/genai)
└── tsconfig.json                # Configuración de TypeScript
```



---

# Registro de cambios posteriores (se agregan al final, sin reemplazar lo anterior)

> Convención: cada cambio nuevo se añade debajo con fecha, qué se hizo y por qué.

## 09-11-2026 · Corrección de la subida de audio a Gemini
- **Problema:** `Can not determine mimeType. Please provide mimeType in the config`.
- **Causa:** el SDK `@google/genai` espera el tipo MIME dentro de `config`, no en la raíz de `files.upload`.
- **Solución:** `ai.files.upload({ file, config: { mimeType, displayName } })` y un mapa de extensión → MIME para cuando el navegador no informa el tipo (`.m4a`, `.opus`, etc.).

## 09-11-2026 · Botón «Nueva transcripción» / «Reiniciar»
- Detiene el micrófono y borra texto, texto provisional, archivo cargado, resultados de IA y `localStorage`.
- Pide confirmación si hay datos, para evitar pérdidas accidentales.
- Disponible en la cabecera (botón principal) y junto al contador del editor (chip «🔄 Reiniciar»).

## 09-11-2026 · Seguridad, cuentas y planes
**Qué cambió**
- Todas las rutas `/api/*` exigen sesión: el cliente envía el *ID token* de Firebase y el servidor lo verifica con Firebase Admin (`lib/serverAuth.ts`).
- **Plan gratis:** archivos de hasta 20 MB. **Plan Pro:** hasta 2 GB y descargas `.txt`/`.md`. El plan se lee de Firestore (`users/{uid}.plan`, con `proUntil` opcional) en el servidor, nunca del navegador.
- Nuevas rutas: `/api/me` (plan y aviso «avísame cuando haya pago») y `/api/export` (descarga solo Pro).
- Precio Pro: \$5.990 CLP/mes con equivalencia referencial en USD (`NEXT_PUBLIC_CLP_USD_RATE`, por defecto 950). Mensaje «sistema de pago en proceso».
- Registro con nombre, correo y contraseña (mín. 8), login, recuperación de contraseña y correo de verificación.
- Cabeceras de seguridad en `next.config.mjs` (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy con micrófono permitido) y `poweredByHeader: false`.
- Validaciones: listas permitidas (acciones, idiomas, extensiones), tope de 200.000 caracteres y 1 MB en JSON, nombre de descarga saneado, limitador de tasa por IP/usuario/hora.
- El audio se envía como `Blob` directo a Gemini: ya no se escribe nada en el disco del servidor.

**Por qué**
- Sin sesión, cualquiera podría gastar tu cuota de Gemini; por eso la IA y los archivos requieren cuenta.
- Si el plan se validara solo en el cliente, se saltaría editando el navegador; por eso la verificación y la descarga pasan por el servidor.
- Firestore queda con reglas «todo denegado» y sin SDK de Firestore en el cliente: menor superficie de ataque.
- `firebase-admin` se fijó en la **versión 13**: la 14 pide `@google-cloud/firestore` aparte y carga módulos ESM que Node 20.17 no soporta.

**Riesgos pendientes:** archivos de 2 GB se leen en memoria del servidor (conviene subida directa a almacenamiento); limitador en memoria (usar Redis si hay varias instancias); activar App Check y exigir correo verificado; `'unsafe-inline'` en la CSP.

**Guía de configuración:** `FIREBASE_SETUP.md`. **Documentación privada:** `DOCUMENTACION_PRIVADA.md` (en `.gitignore`).

## 09-11-2026 · Nueva paleta blanco y azul
- Variables CSS (`--accent`, `--accent2`, `--grad`, `--glass`, etc.) rediseñadas para modo claro (blanco, celeste, azul) y oscuro (azul marino).
- Se eliminó el rosa/violeta. El rojo se reserva para grabación y errores.
- Se añadieron estilos para los modales de cuenta y plan.

## 09-11-2026 · Mensajes de error de autenticación más claros
- **Problema:** el mensaje «No se pudo completar la operación» ocultaba la causa real.
- **Solución:** se tradujeron los errores comunes de Firebase (método no habilitado, Authentication sin activar, API key inválida, dominio no autorizado, cuenta deshabilitada, etc.). Para cualquier otro error se muestra su código (`código: auth/...`) y se registra en la consola.
- **Por qué:** acelera el diagnóstico de la configuración de Firebase sin exponer datos sensibles.

## 09-11-2026 · Copiar y descargar bloqueados sin sesión
- **Qué:** sin iniciar sesión, el botón «Copiar», `Ctrl+C` y `Ctrl+X` sobre el texto quedan bloqueados y abren el registro. Con sesión gratuita se puede copiar; descargar `.txt`/`.md` requiere plan Pro.
- **Por qué:** el texto transcrito es el valor que entrega la app; se pide cuenta para acceder a él.
- **Decisión:** «Borrar» y «Reiniciar» siguen libres porque no entregan el contenido.
- **Limitación:** el bloqueo de copiar se hace en el navegador y puede saltarse con las herramientas de desarrollador. La descarga sí está protegida en el servidor. Para un bloqueo total habría que ocultar el texto hasta iniciar sesión.


## 09-11-2026 · Nombre en base de datos, Google Sign-In y herramientas de IA exclusivas del Plan Pro
- **1. Guardado de nombre en Firestore (`users/{uid}`):**
  - Al autenticar o registrar un usuario, el servidor (`lib/serverAuth.ts`) extrae el nombre verificado del token de Firebase (`decoded.name`) y lo almacena en el documento Firestore correspondiente (`name: tokenName`). Si un usuario existente no tenía nombre, se actualiza automáticamente con `merge: true`.
  - Se añade también el campo `provider` para registrar el origen de la cuenta (`google.com`, `password`, etc.).
- **2. Autenticación con Google (Google Sign-In):**
  - Implementación de `signInWithPopup` y `GoogleAuthProvider` en `components/AuthProvider.tsx`.
  - Agregado del botón interactivo con el logo oficial de Google en `components/AuthModal.tsx` tanto para inicio de sesión como para registro rápido en un solo clic.
  - La ventana modal permite alternar entre Google y correo/contraseña.
- **3. Herramientas de IA (Gemini) exclusivas del Plan Pro:**
  - **Decisión de negocio:** Las funciones inteligentes de IA (Resumir, Corregir gramática, Formato de notas, Puntos clave y Traducir) implican consumo recurrente de cuota y valor añadido superior; por lo tanto, se movieron exclusivamente al **Plan Pro** y quedaron bloqueadas para el plan Gratis.
  - **Doble validación de seguridad:**
    - **En UI (`app/page.tsx`):** Cada botón de IA muestra el icono de candado `🔒` para usuarios con plan Gratis o sin sesión, y al hacer clic abre la comparativa y el aviso de suscripción Pro (`UpgradeModal`).
    - **En Backend (`app/api/gemini/route.ts`):** Las peticiones JSON de IA rechazan con código `402 (PRO_REQUIRED)` si el usuario no cuenta con `user.plan === 'pro'`, impidiendo cualquier elusión de las restricciones desde el cliente.
  - La tabla de planes en `UpgradeModal.tsx` y la documentación se actualizaron para reflejar esta nueva estructura comercial.


## 09-11-2026 · Solución de CSP y COOP para Google Sign-In Popup
- **Problema:** Al hacer clic en «Continuar con Google», se producía el error `auth/internal-error`.
- **Causa técnica:**
  1. La política CSP (`Content-Security-Policy`) en `next.config.mjs` no incluía `https://accounts.google.com` en `frame-src` ni en `connect-src`, bloqueando la ventana emergente/iframe de autenticación de Google.
  2. La cabecera `Cross-Origin-Opener-Policy: same-origin-allow-popups` impedía que el handler de retorno de Firebase Auth accediera a `window.opener` para transmitir las credenciales a la app.
- **Solución:**
  - Se agregaron `https://accounts.google.com` y `https://apis.google.com` a `connect-src` y `frame-src` en `next.config.mjs`.
  - Se ajustó `Cross-Origin-Opener-Policy` a `unsafe-none` para permitir la sincronización del popup de OAuth con la ventana principal.
  - Se mejoró el mapeo del mensaje de error en `AuthProvider.tsx` para guiar sobre el «Correo de asistencia del proyecto» exigido por Google Cloud/Firebase.


## 09-11-2026 · Persistencia garantizada de 'name' en Firestore y diagnósticos de Google OAuth
- **Persistencia de 'name' en Firestore:**
  - Se identificó que al registrarse con correo y contraseña, `updateProfile` puede tardar unos milisegundos en propagarse al token JWT recién emitido.
  - Para garantizar que el campo `name` nunca quede nulo en la colección `users/{uid}`, el cliente envía de forma síncrona `X-User-Name` durante `loadPlan`.
  - El backend (`lib/serverAuth.ts`) prioriza `decoded.name || headerName`, garantizando que el nombre del usuario (ya sea ingresado manualmente o proveído por Google) se registre inmediatamente en Firestore tanto en documentos nuevos como existentes.
- **Manejo de errores detallados de Google Auth:**
  - Se mejoró `friendly(e)` en `AuthProvider.tsx` para exponer la causa detallada que arroja Google en lugar de un error genérico, facilitando la detección de configuraciones pendientes en la pantalla de consentimiento de Google Cloud/Firebase.


## 09-11-2026 · Solución de Google Sign-In mediante Fallback Automático a Redirección (signInWithRedirect)
- **Problema:** En entornos de desarrollo sobre `localhost`, Chrome y Edge frecuentemente bloquean las ventanas emergentes o cortan la comunicación del iframe interno de Firebase Auth con `auth/internal-error`.
- **Solución implementada:**
  - En `components/AuthProvider.tsx`, `signInWithGoogle` implementa una estrategia híbrida resiliente:
    1. Intenta `signInWithPopup`.
    2. Si detecta `auth/internal-error` o `auth/popup-blocked`, conmuta automáticamente a **`signInWithRedirect`**.
    3. Al volver de `accounts.google.com`, `getRedirectResult` captura las credenciales del usuario, extrae su nombre (`res.user.displayName`) y ejecuta `loadPlan` para persistir su perfil y nombre en Firestore.
  - Esto garantiza que el inicio de sesión con Google funcione de manera fluida y sin bloqueos de navegador.


## 09-11-2026 · Habilitación de script-src y frame-src de Google/Firebase en CSP
- **Problema:** Tras completar la redirección de Google OAuth, la sesión no se establecía y se producía un error en `el.onerror` dentro del SDK de Firebase Auth (`@firebase/auth`).
- **Causa:** La directiva `script-src` de la cabecera CSP (`Content-Security-Policy`) en `next.config.mjs` no permitía `https://apis.google.com` ni `https://*.firebaseapp.com`. Al regresar del flujo de Google, Firebase inyecta dinámicamente el script `https://apis.google.com/js/api.js` para procesar el token de sesión; el navegador bloqueaba la carga de dicho script disparando el evento de fallo `el.onerror`.
- **Solución:**
  - Se agregaron `https://apis.google.com` y `https://*.firebaseapp.com` a `script-src`.
  - Se agregó `https://*.googleusercontent.com` a `img-src` para permitir la visualización de los avatares de perfil de Google.
  - Se agregó `https://content.googleapis.com` a `frame-src`.
