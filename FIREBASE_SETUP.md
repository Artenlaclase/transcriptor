# Conectar la app con Firebase (paso a paso)

La app usa **Firebase Authentication** (correo + contraseña) y **Firestore** (guarda el plan de cada usuario). Es gratis en el plan Spark para este uso.

## 1. Crear el proyecto
1. Entra a https://console.firebase.google.com e inicia sesión con tu cuenta Google.
2. **Agregar proyecto** → nombre (ej. `voz-a-texto`) → Continuar. Google Analytics es opcional (puedes desactivarlo).

## 2. Activar Authentication
1. Menú **Compilación > Authentication > Comenzar**.
2. Pestaña **Sign-in method** → **Correo electrónico/contraseña** → Habilitar → Guardar.
3. (Recomendado) **Settings > User actions**: deja activada la **protección contra enumeración de correos**.
4. **Settings > Authorized domains**: deja solo `localhost` y tu dominio de producción.

## 3. Registrar la app web (claves públicas)
1. **Configuración del proyecto** (engranaje) > **General** > **Tus apps** > icono `</>` (Web).
2. Ponle un nombre y registra. Copia estos valores de `firebaseConfig`:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

## 4. Crear Firestore
1. **Compilación > Firestore Database > Crear base de datos**.
2. Ubicación cercana (ej. `southamerica-east1`) → modo **producción**.
3. Pestaña **Reglas** y pega lo siguiente (bloquea todo acceso desde el navegador; solo el servidor con credenciales de administrador puede leer/escribir):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} { allow read, write: if false; }
     }
   }
   ```
   → **Publicar**.

## 5. Credenciales del servidor (SECRETAS)
1. **Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada**. Se descarga un JSON.
2. Copia a `.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (entre comillas dobles, con los saltos de línea como `\n`, tal cual viene en el JSON)
3. **Borra el JSON descargado** o guárdalo fuera del proyecto. Nunca lo subas a Git.

## 6. Archivo `.env.local`
Copia `.env.example` a `.env.local` y rellénalo con los valores anteriores y tu `GEMINI_API_KEY`. Reinicia `pnpm dev`.

## 7. Probar
1. Abre http://localhost:3000 → **Crear cuenta** (nombre, correo, contraseña de 8+ caracteres).
2. En Firebase > Authentication verás al usuario; en Firestore se crea `users/{uid}` con `plan: "free"`.
3. Sube un audio de hasta 20 MB: debe transcribir. Uno mayor muestra el aviso del plan Pro.

## 8. Probar el plan Pro manualmente (mientras no hay pagos)
En **Firestore > users > (tu usuario)**: cambia el campo `plan` a `pro` (opcional: agrega `proUntil` de tipo timestamp con la fecha de vencimiento). Recarga la app: se habilitan archivos de 2 GB y las descargas `.txt` / `.md`.

## 9. Producción (recomendado)
- Despliega con HTTPS y añade tu dominio en *Authorized domains*.
- Activa **Firebase App Check** (reCAPTCHA Enterprise) para frenar bots.
- Considera exigir correo verificado (`email_verified`) antes de transcribir.
- Para varias instancias, reemplaza el limitador en memoria (`lib/rateLimit.ts`) por Redis/Upstash.
- Define cuotas y alertas de gasto en Google Cloud para la clave de Gemini.

