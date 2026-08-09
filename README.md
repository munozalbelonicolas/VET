# 🐾 Veterinaria La Plata — Plataforma Completa

Plataforma todo-en-uno para **Veterinaria La Plata**: app móvil (Android + iOS) + landing page web + backend Firebase. Gestión clínica, e-commerce, turnero, notificaciones de marketing y seguimiento de mascotas.

![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_57-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?logo=firebase)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss)

---

## 📁 Estructura del Proyecto

```
Veterinaria/
├── app/                    # React Native + Expo (Android + iOS)
│   ├── src/
│   │   ├── components/     # Componentes reutilizables (UI design system)
│   │   ├── config/         # Theme, Firebase config
│   │   ├── navigation/     # React Navigation (role-based)
│   │   ├── screens/        # Pantallas por rol (auth, client, staff)
│   │   ├── services/       # Firebase services
│   │   ├── store/          # Zustand stores (auth, cart)
│   │   └── types/          # TypeScript type definitions
│   ├── App.tsx             # Entry point
│   ├── app.json            # Expo config
│   └── eas.json            # EAS Build config
│
├── landing/                # React 19 + Vite + TypeScript + Tailwind v4
│   ├── src/
│   │   ├── components/     # Logo, sections
│   │   ├── App.tsx         # Landing page completa
│   │   └── index.css       # Tailwind + custom styles
│   └── index.html          # SEO meta tags + schema.org
│
├── firebase/               # Firebase configuration
│   ├── firestore.rules     # Security rules por rol
│   ├── firestore.indexes.json
│   └── storage.rules
│
└── README.md
```

---

## 🚀 Instalación Rápida

### Prerrequisitos
- **Node.js** >= 18
- **npm** >= 9
- **Expo CLI**: `npm install -g expo-cli` (opcional, se usa `npx expo`)
- **EAS CLI**: `npm install -g eas-cli` (para builds)
- Cuenta de [Firebase](https://console.firebase.google.com)

### 1. Clonar e instalar

```bash
# Instalar dependencias de la app
cd app
npm install

# Instalar dependencias de la landing
cd ../landing
npm install
```

### 2. Configurar Firebase

1. Andá a [Firebase Console](https://console.firebase.google.com) y creá un proyecto.
2. Habilitá los servicios:
   - **Authentication** → Email/Password + Google Sign-In
   - **Firestore Database** → Crear en modo producción
   - **Storage** → Habilitar
   - **Cloud Messaging** → Habilitar
3. Copiá las credenciales del proyecto web (Settings → General → Your apps → Web app).
4. Creá el archivo `.env` en la carpeta `app/`:

```bash
cp app/.env.example app/.env
# Editá app/.env con tus credenciales de Firebase
```

5. Desplegá las security rules:
```bash
firebase deploy --only firestore:rules,storage
```

### 3. Correr la App (desarrollo)

```bash
cd app
npx expo start
```

Esto abre Expo Dev Tools. Desde ahí podés:
- **Android**: Escaneá el QR con Expo Go o presioná `a`
- **iOS**: Escaneá el QR con la cámara o presioná `i`
- **Web**: Presioná `w`

### 4. Correr la Landing Page

```bash
cd landing
npm run dev
```

Se abre en `http://localhost:5173`

---

## 👥 Cuentas de Prueba

La app viene con **mock login** habilitado. Usá cualquiera de estas cuentas (cualquier contraseña de 6+ caracteres):

| Email | Rol | Acceso |
|-------|-----|--------|
| `cliente@mascota.com` | 🐾 Cliente | Home, mascotas, turnos, tienda, notificaciones, perfil |
| `vet@soyvet.com` | 🩺 Veterinario | Dashboard, agenda, historia clínica, métricas |
| `peluquero@pelu.com` | ✂️ Peluquero | Agenda peluquería, registro estético |
| `recep@admin.com` | 📋 Recepcionista | Turnos, cobros, stock, envíos |
| `admin@soyveterinario.com` | 🏥 Admin | Todo + empleados, marketing, configuración |

---

## 🎨 Design System

### Colores
| Token | Color | Uso |
|-------|-------|-----|
| `primary` | `#4ECDC4` 🟢 | Salud, vitalidad, elementos principales |
| `accent` | `#FF8C42` 🟠 | Energía, CTAs, highlights |
| `bg-main` | `#FFFDF5` | Fondo principal (manteca suave) |
| `text-dark` | `#2D3436` | Texto principal |
| `danger` | `#FF6B6B` | Errores, cancelaciones |
| `success` | `#51CF66` | Confirmaciones, estados positivos |
| `warning` | `#FFD43B` | Alertas, pendientes |

### Tipografía
- **Nunito** (400/600/700/800): Texto principal, botones, body
- **Quicksand** (500/700): Títulos, headers, branding

### Componentes UI
- `Button` — 5 variantes (primary, accent, outline, ghost, danger) × 3 tamaños
- `Card` — elevated, outlined, flat
- `Input` — Con label, error state, iconos, password toggle
- `Badge` — 6 variantes semánticas
- `SkeletonLoader` — Shimmer animation para loading states
- `Logo` — SVG embebido (perro + gato formando corazón con cruz vet)

---

## 🏗️ Build para Producción

### Android (APK para testing)
```bash
cd app
eas build --platform android --profile preview
```

### Android (AAB para Play Store)
```bash
eas build --platform android --profile production
```

### iOS (Simulator)
```bash
eas build --platform ios --profile development
```

### iOS (App Store)
```bash
eas build --platform ios --profile production
```

### Landing Page (producción)
```bash
cd landing
npm run build
# Desplegá la carpeta `dist/` en tu hosting (Firebase Hosting, Vercel, etc.)
```

---

## 🗄️ Modelo de Datos (Firestore)

| Colección | Descripción |
|-----------|-------------|
| `users` | Clientes y personal (role-based) |
| `pets` | Mascotas (vinculadas a un dueño) |
| `appointments` | Turnos (tipo, fecha, estado) |
| `medicalRecords` | Historia clínica (diagnósticos, vacunas, estudios) |
| `groomingRecords` | Registros de peluquería |
| `products` | Catálogo de productos |
| `orders` | Pedidos del e-commerce |
| `notifications` | Notificaciones push/in-app |
| `campaigns` | Campañas de marketing |
| `employees` | Personal y sus roles |
| `veterinaryConfig` | Configuración de la veterinaria (singleton) |
| `coupons` | Cupones de descuento |

---

## 🔒 Seguridad

- **Firebase Auth** con verificación de email
- **Firestore Security Rules** estrictas por rol
- Clientes solo ven sus propias mascotas y datos
- Peluqueros solo ven datos de peluquería
- Veterinarios ven todo lo clínico
- Admins tienen acceso completo
- Datos de pago manejados por Mercado Pago (no se almacenan tarjetas)
- Cumplimiento con Ley 25.326 de Protección de Datos Personales

---

## 📱 Fases de Desarrollo

| Fase | Contenido | Estado |
|------|-----------|--------|
| **1** | Fundación, Landing, Auth, Onboarding, Navegación | ✅ Completada |
| **2** | Home cliente, Mascotas CRUD, Turnos | 📋 Pendiente |
| **3** | E-commerce, Checkout, Notificaciones | 📋 Pendiente |
| **4** | Veterinario, Peluquero (pantallas completas) | 📋 Pendiente |
| **5** | Admin, Recepcionista, Marketing | 📋 Pendiente |
| **6** | Animaciones, Performance, Deploy | 📋 Pendiente |

---

## 📄 Licencia

Proyecto privado — Veterinaria La Plata © 2025
