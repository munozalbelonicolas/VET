// ============================================================
// Veterinaria La Plata — Card Component
// Premium: hairline border + sombra suave + variante destacada
// ============================================================
import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../config/theme';

type CardVariant = 'elevated' | 'outlined' | 'flat' | 'highlight';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  onPress,
  style,
  padding = spacing.lg,
}) => {
  const cardStyle: ViewStyle[] = [
    styles.base,
    { padding },
    variant === 'elevated' && [styles.elevatedBase, styles.elevated],
    variant === 'outlined' && styles.outlined,
    variant === 'flat' && styles.flat,
    variant === 'highlight' && [styles.highlightBase, styles.highlight],
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
  },
  // Elevated: hairline + sombra suave en capas
  elevatedBase: {
    backgroundColor: colors.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    ...shadows.md,
  },
  elevated: {},
  outlined: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.surfaceMuted,
  },
  highlightBase: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(14, 157, 150, 0.18)',
  },
  highlight: {},
});

export default Card;
