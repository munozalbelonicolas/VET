// ============================================================
// Veterinaria La Plata — Design System / Theme
// Dirección: premium, cálido, puro y de confianza.
// Teal profundo (salud/confianza) + albaricoque cálido (cercanía)
// sobre neutros limpios y casi blancos.
// ============================================================

export const colors = {
  // --- Primario: teal profundo (confianza, salud, pureza) ---
  primary: '#0E9D96',
  primaryDark: '#0A7C77',
  primaryLight: '#5FC9C3',
  primarySoft: '#E3F4F3',

  // --- Acento: albaricoque cálido (cercanía, energía suave) ---
  accent: '#F09A5F',
  accentDark: '#DD7D3E',
  accentLight: '#F9C89B',
  accentSoft: '#FCEFE2',

  // --- Fondos: limpios, casi blancos con un dejo cálido ---
  bgMain: '#FBFCF9',
  bgCard: '#FFFFFF',
  bgOverlay: 'rgba(15, 40, 39, 0.45)',
  surfaceMuted: '#F1F6F4',
  hairline: '#E3ECE9',

  // --- Texto ---
  textDark: '#1E2C2C',
  textMuted: '#5B6D6B',
  textLight: '#8FA3A1',
  textWhite: '#FFFFFF',

  // --- Semánticos (más refinados y accesibles) ---
  danger: '#E56B6B',
  dangerDark: '#CE5555',
  dangerSoft: '#FCE9E9',

  success: '#3EAB77',
  successDark: '#33925F',
  successSoft: '#E5F4EC',

  warning: '#E2A93A',
  warningDark: '#C8912A',
  warningSoft: '#FBF3DE',

  // --- Bordes y separadores ---
  border: '#E5ECEA',
  borderLight: '#ECF2F0',
  divider: '#F1F6F4',

  // --- Skeleton ---
  skeleton: '#E6EEEC',
  skeletonHighlight: '#F3F8F7',

  // --- Gradientes premium (botones y superficies destacadas) ---
  gradientPrimary: ['#16B1A9', '#0E9D96', '#0A7C77'] as [string, string, string],
  gradientPrimaryDark: ['#0E9D96', '#0A7C77'] as [string, string],
  gradientAccent: ['#F7A86B', '#F09A5F', '#DD7D3E'] as [string, string, string],
  gradientHero: ['#FFFFFF', '#E9F6F4'] as [string, string],
};

export const fonts = {
  nunito: {
    regular: 'Nunito_400Regular',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extraBold: 'Nunito_800ExtraBold',
  },
  quicksand: {
    medium: 'Quicksand_500Medium',
    bold: 'Quicksand_700Bold',
  },
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 44,
};

export const letterSpacing = {
  tight: -0.3,
  normal: 0,
  display: 0.4,
  caption: 0.6,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const borderRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const shadows = {
  // Sombras suaves y en capas con un tinte esmeralda sutil
  sm: {
    shadowColor: 'rgba(15, 50, 48, 0.06)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: 'rgba(15, 50, 48, 0.09)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: 'rgba(15, 50, 48, 0.11)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 6,
  },
  xl: {
    shadowColor: 'rgba(15, 50, 48, 0.14)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 12,
  },
  focus: {
    shadowColor: 'rgba(14, 157, 150, 0.25)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const theme = {
  colors,
  fonts,
  fontSizes,
  letterSpacing,
  spacing,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
export default theme;
