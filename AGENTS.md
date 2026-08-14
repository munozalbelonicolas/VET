# VET - Sistema Veterinario

## Descripción
Sistema completo para clínica veterinaria. App móvil (clientes + staff) + landing page + Firebase backend. 5 roles: cliente, veterinario, peluquero, recepcionista, admin.

## Estructura del monorepo
```
veterinaria/
  app/          # App móvil React Native + Expo
  landing/      # Landing page React + Vite + Tailwind
  firebase/     # Reglas de Firestore + Storage + indexes
```

---

## app/ (React Native + Expo)

### Stack
- React Native 0.86 + Expo SDK 57
- React 19 + TypeScript
- React Navigation 7 (native-stack, bottom-tabs, drawer)
- Firebase 12 (Auth + Firestore + Storage)
- Zustand 5 (estado global)
- Google Generative AI (chatbot)
- expo-image-picker, expo-notifications, expo-crypto, expo-font

### Estructura
```
app/src/
  types/index.ts              # Tipos del dominio (User, Pet, Appointment, etc.)
  config/
    firebase.ts               # Config de Firebase
    theme.ts                  # Tema/colores de la app
  navigation/
    AuthStack.tsx             # Stack de auth (login, registro, forgot)
    AppNavigator.tsx          # Navigator principal (decide rol)
    ClientTabs.tsx            # Tabs del cliente
  screens/
    auth/                     # LoginScreen, RegisterScreen, ForgotPasswordScreen
    staff/                    # AdminHub, ReceptionistHub, VetSchedule, GroomingHub, etc.
    client/                   # AddPetModal, AppointmentsScreen, etc.
```

### Roles y navegación
- **cliente**: ve sus mascotas, turnos, historial
- **vet**: agenda, fichas clínicas, recetas
- **peluquero**: agenda de grooming
- **recep**: gestión de turnos, waiting room
- **admin**: dashboard completo, marketing, productos

### Auth
- Autenticación mock por ahora (migrar a Firebase Auth real)
- Google Sign-in configurado

### Comandos
- `npm run dev` — Metro bundler
- `npm run android` — Run en Android
- `npm run ios` — Run en iOS
- `npm run web` — Run en web

---

## landing/ (React + Vite + Tailwind)

### Stack
- React 19 + Vite + TypeScript
- Tailwind CSS 4 (via @tailwindcss/vite)

### Comandos
- `npm run dev` — Dev server
- `npm run build` — Producción

---

## firebase/ (Backend)

### Reglas
- `firestore.rules` — Reglas de seguridad de Firestore
- `storage.rules` — Reglas de Storage
- `firestore.indexes.json` — Índices compuestos

### Colecciones principales
- users (rol, nombre, email)
- pets (ownerId, nombre, especie, raza, historial)
- appointments (petId, vetId, fecha, estado, tipo)
- products (nombre, precio, stock)
- notifications

## Pendientes del cliente
- Firebase real (cambiar de auth mock a Firebase Auth)
- Integrar Mercado Pago
- Apple Developer account + Google Play
- Dominio

## Reglas
- TypeScript strict
- Zustand para estado global (no Redux)
- Tailwind para estilos en landing
- StyleSheet para RN en app
- No modificar firebase/ sin permiso
