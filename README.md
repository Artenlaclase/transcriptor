# 🎙️ Voz a Texto · Transcriptor Inteligente en Español con Gemini IA

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-yellow?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-Files%20API-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)

Aplicación web de página única (SPA) completa, moderna, segura y adaptable (*responsive*) para la transcripción y el procesamiento inteligente de audio y voz en español, potenciada por **Google Gemini IA** y autenticación con **Firebase**.

Desarrollada por **Raúl Rosales**.  
Contacto: [contacto@oceanicaweb.cl](mailto:contacto@oceanicaweb.cl)

---

## 🌟 Características Principales

### 1. 🎤 Transcripción de Voz en Tiempo Real (Micrófono)
- **Cero latencia y sin costo:** Implementada sobre la **Web Speech API** nativa (`SpeechRecognition`), transcribiendo la voz directamente en el navegador.
- **Acceso libre:** Disponible de inmediato sin requerir inicio de sesión previo para pruebas rápidas.
- **Escucha continua resiliente:** Sistema de reconexión automática en segundo plano para evitar pausas indeseadas por silencios del orador.
- **Variantes de acento en español:** Selector regional optimizado para España (`es-ES`), México (`es-MX`), Argentina (`es-AR`), Chile (`es-CL`), Colombia (`es-CO`) y EE. UU. (`es-US`).
- **Visualizador de espectro sonoro:** Barra de audio dinámica en vivo desarrollada con Canvas que reacciona a los decibelios del micrófono.

### 2. 📁 Carga y Transcripción de Archivos de Audio
- **Zona de arrastrar y soltar (*drag & drop*):** Admite múltiples formatos (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`, `.aac`, `.webm`, `.opus`, `.mp4`).
- **Integración con Gemini Files API:** Los archivos se procesan mediante la API oficial (`@google/genai`) con limpieza automática de archivos temporales al concluir.
- **Reproductor con forma de onda (*Waveform*):** Visualizador interactivo de picos de audio generado con la Web Audio API nativa. Permite hacer clic para saltar a cualquier punto temporal, control de velocidad (0.75x a 2x) y ajuste de volumen.

### 3. 🔐 Autenticación y Perfil de Usuario (Firebase)
- **Registro con Correo y Contraseña:** Validación estricta con nombre de usuario, correo electrónico, verificación por correo y contraseñas seguras (mínimo 8 caracteres).
- **Inicio de sesión con Google (Google Sign-In):** Acceso rápido en un solo clic con fallback automático de redirección (`signInWithRedirect`) para máxima resiliencia ante bloqueos de popups.
- **Base de Datos Firestore:** Registro automático del usuario con su nombre (`name`), correo (`email`), proveedor (`provider`), fecha de creación y asignación de plan.

### 4. 💎 Esquema de Planes y Monetización

| Característica | Sin cuenta | Plan Gratis (con cuenta) | Plan Pro ($5.990 CLP / mes) |
|---|:---:|:---:|:---:|
| **Dictado por micrófono** | ✔ | ✔ | ✔ |
| **Copiar texto al portapapeles** | ✘ | ✔ | ✔ |
| **Límite de archivo de audio** | ✘ | Hasta **20 MB** | Hasta **2 GB** |
| **Descarga de archivos (.txt / .md)** | ✘ | ✘ | ✔ |
| **Herramientas de IA (Gemini)** | ✘ | ✘ | ✔ Ilimitadas |

- **Tarifa Pro:** **$5.990 CLP / mes** (≈ US$ 6,30 referencial).
- **Aviso de Pago en Proceso:** Sistema informativo integrado que permite a los usuarios solicitar un aviso cuando la pasarela de pago esté disponible, guardando el registro en Firestore.

### 5. ✨ Herramientas de IA de Gemini (Exclusivas Plan Pro)
- 📝 **Resumir:** Genera una síntesis clara y concisa de la transcripción en Markdown.
- ✅ **Corregir gramática:** Agrega mayúsculas, comas, puntos y tildes omitidos en el dictado oral.
- 🗒️ **Formato de notas:** Estructura el texto con títulos, subtítulos, viñetas y énfasis.
- 🎯 **Puntos clave y acciones:** Extrae conclusiones y listas de tareas pendientes con casillas interactivas (`- [ ]`).
- 🌐 **Traducir:** Traduce instantáneamente a 8 idiomas (inglés, francés, alemán, italiano, portugués, catalán, japonés y chino).

### 6. ⚖️ Cumplimiento Legal y Privacidad
- 📄 **[Política de Privacidad](/privacidad):** Conforme a la **Ley N° 19.628 de Chile** y estándares RGPD/GDPR, con detalle de derechos ARCO y borrado automático de archivos de audio tras su procesamiento.
- 🍪 **[Política de Cookies](/cookies):** Información transparente sobre el uso exclusivo de almacenamiento técnico y funcional sin rastreadores invasivos de publicidad.
- ☑️ **Consentimiento Obligatorio:** Casilla de verificación de aceptación de términos al crear una cuenta.
- 🔔 **Banner de Cookies:** Notificación flotante informativa con persistencia en `localStorage`.

### 7. 🎨 Diseño y Experiencia de Usuario
- **Estética Blanco y Azul:** Paleta corporativa moderna con fondos translúcidos (*Glassmorphism*), desenfoque de fondo (*backdrop-filter*) y esferas de luz dinámicas.
- **Modos Claro y Oscuro:** Selector de tema con detección automática de preferencias del sistema operativo sin parpadeo visual (FOUC).
- **Favicon de Micrófono:** Icono vectorial SVG de alta definición (`app/icon.svg`) integrado para todas las plataformas.
- **Página 404 Personalizada:** Pantalla de error amigable (`app/not-found.tsx`) con diseño integrado y enlace de retorno.
- **Botón «Nueva Transcripción» / «Reiniciar»:** Limpieza total a cero de la sesión (micrófono, audio, textos, IA y `localStorage`).

---

## 🏗️ Estructura del Proyecto

```
transcriptor/
├── app/
│   ├── api/
│   │   ├── export/route.ts      # Endpoint seguro para descargas (.txt / .md) con validación Pro
│   │   ├── gemini/route.ts      # Procesamiento con Gemini Files API y herramientas de IA
│   │   └── me/route.ts          # Consulta de plan del usuario y avisos de pago
│   ├── cookies/page.tsx         # Página informativa de Política de Cookies
│   ├── privacidad/page.tsx      # Página informativa de Política de Privacidad
│   ├── globals.css              # Estilos globales, variables de tema y Glassmorphism
│   ├── icon.svg                 # Favicon vectorial en SVG con diseño de micrófono
│   ├── layout.tsx               # Layout raíz, inyección de metadatos y AuthProvider
│   ├── not-found.tsx            # Página de error 404 personalizada
│   └── page.tsx                 # SPA principal con controles de voz, editor e interfaz
├── components/
│   ├── AudioPlayer.tsx          # Reproductor con onda interactiva (Canvas + Web Audio API)
│   ├── AuthModal.tsx            # Modal de registro (con checkbox legal), login y Google
│   ├── AuthProvider.tsx         # Contexto de autenticación Firebase con fallback de redirección
│   ├── LiveVisualizer.tsx       # Visualizador de espectro sonoro en tiempo real para micrófono
│   └── UpgradeModal.tsx         # Modal comparativo de planes y aviso de suscripción Pro
├── lib/
│   ├── firebase.ts              # Configuración del cliente de Firebase Auth
│   ├── firebaseAdmin.ts         # Inicialización segura de Firebase Admin SDK (servidor)
│   ├── plans.ts                 # Constantes de planes, límites de bytes, precios y extensiones
│   ├── rateLimit.ts             # Limitador de tasa por IP y por usuario
│   ├── serverAuth.ts            # Middleware de validación de tokens y persistencia en Firestore
│   └── utils.ts                 # Funciones auxiliares de cálculo, descarga y llamadas de API
├── next.config.mjs              # Cabeceras de seguridad (CSP, HSTS, COOP, Permissions-Policy)
├── .env.example                 # Plantilla de variables de entorno requeridas
└── package.json                 # Dependencias y scripts del proyecto
```

---

## 🚀 Requisitos Previos e Instalación

### Requisitos
- **Node.js** v18 o superior
- Gestor de paquetes **pnpm** (recomendado), `npm` o `yarn`
- Una **API Key de Google Gemini** ([Google AI Studio](https://aistudio.google.com/))
- Un proyecto en **Firebase** con **Authentication** y **Firestore Database** habilitados

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
   Copia la plantilla `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Rellena los valores en `.env.local`:
   ```env
   # Gemini
   GEMINI_API_KEY=tu_clave_de_google_ai_studio
   GEMINI_MODEL=gemini-2.5-flash

   # Firebase Cliente (Configuración del proyecto > Tus apps > Web)
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

   # Firebase Admin Servidor (Configuración del proyecto > Cuentas de servicio)
   FIREBASE_PROJECT_ID=tu-proyecto
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # Tipo de cambio referencial (CLP por 1 USD)
   NEXT_PUBLIC_CLP_USD_RATE=950
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   pnpm dev
   ```

5. **Abrir en el navegador:**
   Visita [http://localhost:3000](http://localhost:3000).

---

## 🛡️ Seguridad Implementada
- **Protección contra accesos anónimos:** Las rutas de backend exigen un ID token de Firebase verificado criptográficamente en el servidor.
- **Políticas de Seguridad (CSP):** Control estricto de scripts y conexiones en `next.config.mjs` con soporte para Google Identity Services y Firebase Auth.
- **Reglas de Firestore denegadas al navegador:** El cliente no tiene permisos de lectura ni escritura directa en la base de datos; todas las operaciones pasan validadas por el backend (`firebase-admin`).
- **Limitación de Tasa (Rate Limiting):** Prevención activa de ataques de denegación de servicio (DoS) y abusos de cuota por IP y por usuario.

---

## 👨‍💻 Autor y Contacto

Desarrollado por **Raúl Rosales**.  
Para consultas de soporte, técnicas o comerciales: [contacto@oceanicaweb.cl](mailto:contacto@oceanicaweb.cl)
