// ============================================================
// Veterinaria La Plata — Design System / Theme
// ============================================================

export const colors = {
  primary: '#4ECDC4',
  primaryDark: '#3BAFA7',
  primaryLight: '#A8E6CF',
  primarySoft: '#E8FAF6',

  accent: '#FF8C42',
  accentDark: '#E67330',
  accentLight: '#FFB380',
  accentSoft: '#FFF0E5',

  bgMain: '#FFFDF5',
  bgCard: '#FFFFFF',
  bgOverlay: 'rgba(0, 0, 0, 0.4)',

  textDark: '#2D3436',
  textMuted: '#636E72',
  textLight: '#B2BEC3',
  textWhite: '#FFFFFF',

  danger: '#FF6B6B',
  dangerDark: '#EE5252',
  dangerSoft: '#FFE8E8',

  success: '#51CF66',
  successDark: '#40C057',
  successSoft: '#E6F9ED',

  warning: '#FFD43B',
  warningDark: '#FCC419',
  warningSoft: '#FFF9DB',

  border: '#E8E8E8',
  borderLight: '#F0F0F0',
  divider: '#F5F5F5',

  skeleton: '#E8E8E8',
  skeletonHighlight: '#F5F5F5',
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
  '5xl': 48,
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const theme = {
  colors,
  fonts,
  fontSizes,
  spacing,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
export default theme;
