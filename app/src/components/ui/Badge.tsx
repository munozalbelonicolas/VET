// ============================================================
// Veterinaria La Plata — Badge Component (Resilient)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';

export type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted' | 'info';

interface BadgeProps {
  label: string;
  variant?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: colors.primarySoft, text: colors.primaryDark },
  accent: { bg: colors.accentSoft, text: colors.accentDark },
  success: { bg: colors.successSoft, text: colors.successDark },
  warning: { bg: colors.warningSoft, text: colors.warningDark },
  danger: { bg: colors.dangerSoft, text: colors.dangerDark },
  muted: { bg: colors.divider, text: colors.textMuted },
  info: { bg: colors.primarySoft, text: colors.primaryDark },
};

const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', size = 'sm', style }) => {
  const colorsConfig = variantColors[variant as BadgeVariant] || variantColors.primary;
  const { bg, text } = colorsConfig;

  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'md' && styles.textMd,
          { color: text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontFamily: fonts.nunito.bold,
    fontSize: fontSizes.xs,
  },
  textMd: {
    fontSize: fontSizes.sm,
  },
});

export default Badge;
