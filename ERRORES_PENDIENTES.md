# 🐛 Errores TypeScript Pendientes

> Generado: 2026-08-14 | Errores ya corregidos: `uploadImage`, `updateUserProfile`, null checks en `AddPetModal`

---

## 🟡 Prioridad Media — Tipos incorrectos en datos mock

### `AppointmentsScreen.tsx`
- **L44, L58**: `TimeSlot` inválidos (`"09:00 (Recordatorio)"`, `"Todo el día"`) — deben usar valores del enum `TimeSlot`
- **L405**: Propiedad duplicada en object literal

### `AdminHubScreen.tsx`
- **L46, L60, L74**: `TimeSlot` inválidos (`"09:00 - 09:30"`, `"11:00 - 11:30"`, `"14:30 - 15:30"`)
- **L58**: `AppointmentType` inválido (`"consultation"`)
- **L211**: `Button` sin prop `onPress`
- **L475**: `colors.bgSoft` no existe → usar `colors.primarySoft`
- **L482**: `colors.white` no existe → usar `colors.textWhite`

### `VetScheduleScreen.tsx`
- **L19, L33, L47**: `TimeSlot` inválidos
- **L31**: `AppointmentType` `"consultation"` inválido
- **L45**: `AppointmentType` `"surgery"` inválido

---

## 🟠 Tokens de color inexistentes en theme.ts

Reemplazos necesarios:

| Token incorrecto | Reemplazar por | Archivos |
|-----------------|----------------|----------|
| `colors.white` | `colors.textWhite` | `CalendarView.tsx` (L257, L260), `AdminHubScreen.tsx` (L482), `WaitingRoomTVDisplay.tsx` (L92) |
| `colors.bgSoft` | `colors.primarySoft` | `AdminHubScreen.tsx` (L475) |
| `colors.secondary` | `colors.textMuted` | `DashboardScreens.tsx` (L185) |

---

## 🔵 Prioridad Baja — APIs de librerías actualizadas

### `notificationService.ts` — L9
```ts
// Error: NotificationBehavior ahora requiere shouldShowBanner y shouldShowList
// Fix:
return {
  shouldShowAlert: true,
  shouldPlaySound: true,
  shouldSetBadge: true,
  shouldShowBanner: true,  // ← agregar
  shouldShowList: true,    // ← agregar
};
```

### `ChatbotScreen.tsx` — L124
```ts
// Error: parts debe ser tupla [{ text }] no array { text }[]
// Fix: asegurar que history.map produzca parts: [{ text: msg.text }]
parts: [{ text: msg.text }] as [{ text: string }]
```

### `ChatbotScreen.tsx` — L259
- `colors.white` → `colors.textWhite`

### `NotificationsScreen.tsx` — L107
```ts
// Error: ViewStyle no acepta arrays con `false`
// Fix: usar StyleSheet.flatten o condicional
style={[styles.notifItem, isUnread && styles.unreadItem]}
// Reemplazar el false condicional por spread o ternario limpio
```

### `NotificationsScreen.tsx` — L112
- Ícono `"syringe"` no existe en `@expo/vector-icons` MaterialCommunityIcons
- Reemplazar por `"needle"` o `"medical-bag"` o `"needle-syringe"`

### `GroomingHubScreen.tsx` — L65
- `variant="success"` no es `ButtonVariant` válido
- Opciones: agregar `"success"` al tipo `ButtonVariant` en `components/ui/Button.tsx`, o cambiar a `variant="primary"`

### `LoginScreen.tsx` — L111
- `Property 'data' does not exist on type 'never'` — causado por el mock de GoogleSignin
- Fix: tipar el resultado de `signIn()` correctamente o castear: `(await GoogleSignin.signIn() as any)?.data`

### `shopService.ts` — L108, L109
```ts
// Error: Object is of type 'unknown' en catch block
catch (error: unknown) {
  const err = error as Error;
  console.error(err.message); // ← castear a Error
}
```

### `shopService.ts` — L159, L208, L212
- `Order` y `ShippingStatus` no importados — agregar al import desde `'../types'`

### `dataService.ts` — L84
- `'name'` no existe en `Appointment` — revisar el tipo y usar el campo correcto (posiblemente `title` o `petName`)
