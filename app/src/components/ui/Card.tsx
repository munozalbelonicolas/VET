// ============================================================
// Veterinaria La Plata — Card Component
// ============================================================
import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../config/theme';

type CardVariant = 'elevated' | 'outlined' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
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
    variant === 'elevated' && { ...styles.elevated, ...shadows.md },
    variant === 'outlined' && styles.outlined,
    variant === 'flat' && styles.flat,
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
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: colors.bgCard,
  },
  outlined: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.divider,
  },
});

export default Card;
