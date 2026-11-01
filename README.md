# 🎙️ Voz a Texto · Transcriptor Inteligente en Español con Gemini IA

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-Files%20API-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)

Aplicación web de página única (SPA) completa, moderna y adaptable (*responsive*) para la transcripción y el procesamiento inteligente de audio y voz en español, potenciada por **Google Gemini IA**.

Desarrollada por **Raúl Rosales**.

---

## 🌟 Características Principales

### 1. 🎤 Transcripción de Voz en Tiempo Real
- **Cero latencia y sin costo:** Implementada sobre la **Web Speech API** nativa (`SpeechRecognition`), transcribiendo la voz directamente en el navegador.
- **Escucha continua resiliente:** Sistema de reconexión automática en segundo plano para evitar pausas indeseadas por silencios.
- **Variantes de acento en español:** Selector regional optimizado para España (`es-ES`), México (`es-MX`), Argentina (`es-AR`), Chile (`es-CL`), Colombia (`es-CO`) y EE. UU. (`es-US`).
- **Visualizador de espectro sonoro:** Barra de audio dinámica en vivo desarrollada con Canvas que reacciona a los decibelios del micrófono.

### 2. 📁 Carga y Transcripción de Archivos (Sin Límite de Tamaño)
- **Zona de arrastrar y soltar (*drag & drop*):** Admite múltiples formatos (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`, `.aac`, `.webm`, `.opus`, `.mp4`).
- **Soporte para audios de gran tamaño:** Integración directa con la **Gemini Files API** oficial (`@google/genai`), permitiendo procesar grabaciones largas, podcasts o reuniones de hasta **2 GB** (sin el límite clásico de 20 MB de las peticiones Base64).
- **Reproductor con forma de onda (*Waveform*):** Visualizador interactivo de picos de audio generado con la Web Audio API nativa. Permite hacer clic para saltar a cualquier punto temporal, control de velocidad (0.75x a 2x) y ajuste de volumen.

### 3. ✨ Asistente de IA Integrado (Gemini 2.5 / 3 Flash)
- 📝 **Resumir:** Genera una síntesis clara y concisa de la transcripción en Markdown.
- ✅ **Corregir gramática:** Agrega mayúsculas, comas, puntos y tildes omitidos en el dictado oral.
- 🗒️ **Formato de notas:** Estructura el texto con títulos, subtítulos, viñetas y énfasis.
- 🎯 **Puntos clave y acciones:** Extrae conclusiones y listas de tareas pendientes con casillas interactivas (`- [ ]`).
- 🌐 **Traducir:** Traduce instantáneamente a 8 idiomas (inglés, francés, alemán, italiano, portugués, catalán, japonés y chino).

### 4. 🛠️ Herramientas de Productividad y Exportación
- **Copia rápida:** Copia al portapapeles con un solo clic.
- **Descargas en local:** Exportación directa a archivos `.txt` y `.md` (Markdown).
- **Métricas en tiempo real:** Contador dinámico de palabras y caracteres.
- **Persistencia local:** El texto permanece guardado en `localStorage`, evitando pérdidas accidentales al recargar la página.

### 5. 🎨 Interfaz Moderna y Accesible
- **Diseño Glassmorphism:** Efecto de vidrio esmerilado con desenfoque de fondo (*backdrop-filter*) y esferas de luz animadas.
- **Modos Claro y Oscuro:** Selector de tema con detección automática de preferencias del sistema y persistencia sin parpadeo visual.
- **Diseño adaptable (*Responsive*):** Cuadrícula fluida optimizada desde dispositivos móviles hasta monitores ultrawide.
- **Accesibilidad:** Cumplimiento de estándares ARIA y compatibilidad con `prefers-reduced-motion`.

---

## 🏗️ Estructura del Proyecto

```
transcriptor/
├── app/
│   ├── api/gemini/route.ts      # Endpoint backend para Files API y prompts de Gemini
│   ├── globals.css              # Variables de tema, Glassmorphism y animaciones
│   ├── layout.tsx               # Estructura raíz y script de hidratación de tema
│   └── page.tsx                 # Interfaz principal (SPA) y gestor de eventos
├── components/
│   ├── AudioPlayer.tsx          # Reproductor de audio con onda interactiva (Canvas)
│   └── LiveVisualizer.tsx       # Visualizador de frecuencias del micrófono en vivo
├── lib/
│   └── utils.ts                 # Funciones auxiliares de cálculo, descarga y API
├── ARQUITECTURA_Y_DECISIONES.md # Documento técnico de decisiones de ingeniería
├── .env.example                 # Plantilla de variables de entorno
└── package.json                 # Dependencias y scripts del proyecto
```

---

## 🚀 Requisitos Previos e Instalación

### Requisitos
- **Node.js** v18 o superior
- Gestor de paquetes **pnpm** (recomendado), `npm` o `yarn`
- Una **API Key de Google Gemini** (gratuita en [Google AI Studio](https://aistudio.google.com/))

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/transcriptor.git
   cd transcriptor
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo `.env.local` en la raíz copiando la plantilla:
   ```bash
   cp .env.example .env.local
   ```
   Abre `.env.local` e introduce tu clave:
   ```env
   GEMINI_API_KEY=AIzaSy...tu_clave_de_gemini
   GEMINI_MODEL=gemini-2.5-flash
   ```

4. **Ejecutar el servidor de desarrollo:**
   ```bash
   pnpm dev
   ```

5. **Abrir en el navegador:**
   Visita [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Tecnologías Utilizadas

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **Librería UI:** [React 19](https://react.dev/)
- **Lenguaje:** [TypeScript 5](https://www.typescriptlang.org/)
- **IA Multimodal:** [@google/genai SDK](https://www.npmjs.com/package/@google/genai)
- **Audio & Voz:** Web Speech API, Web Audio API y HTML5 Canvas
- **Estilos:** CSS3 Moderno con variables personalizadas y efectos Glassmorphism

---

## 👨‍💻 Autor

Desarrollado con dedicación por **Raúl Rosales**.

Si este proyecto te resulta útil, considera dejar una ⭐ en el repositorio.

