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

