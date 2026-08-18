// ============================================================
// Veterinaria La Plata — Button Component
// Variants: primary, accent, outline, ghost, danger
// Primary/accent usan gradientes premium
// ============================================================
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const gradientByVariant: Partial<Record<ButtonVariant, readonly [string, string, string] | readonly [string, string]>> = {
  primary: colors.gradientPrimary,
  accent: colors.gradientAccent,
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const baseContainerStyle: ViewStyle[] = [
    styles.base,
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const isGradientVariant = !!gradientByVariant[variant] && !isDisabled;

  const textVariantStyle =
    variant === 'primary' || variant === 'accent' || variant === 'danger'
      ? styles.text_onSolid
      : variant === 'outline'
      ? styles.text_outline
      : styles.text_ghost;

  const spinnerColor =
    variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textWhite;

  const renderLabel = () => {
    const labelStyle: TextStyle[] = [
      styles.text,
      styles[`textSize_${size}`],
      textVariantStyle,
      isDisabled && styles.textDisabled,
      textStyle as TextStyle,
    ].filter(Boolean) as TextStyle[];

    return (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
        <Text style={labelStyle}>{title}</Text>
        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
      </View>
    );
  };

  const gradient = gradientByVariant[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[style as ViewStyle]}
    >
      {isGradientVariant && gradient ? (
        <LinearGradient
          colors={gradient as readonly [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[...baseContainerStyle, styles.elevated]}
        >
          {loading ? <ActivityIndicator color={spinnerColor} size="small" /> : renderLabel()}
        </LinearGradient>
      ) : (
        <View style={[...baseContainerStyle, styles[`container_${variant}`], variant === 'primary' || variant === 'accent' || variant === 'danger' ? styles.elevated : undefined]}>
          {loading ? <ActivityIndicator color={spinnerColor} size="small" /> : renderLabel()}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },
  elevated: {
    ...shadows.md,
  },

  // --- Variants ---
  container_primary: {
    backgroundColor: colors.primary,
  },
  container_accent: {
    backgroundColor: colors.accent,
  },
  container_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  container_ghost: {
    backgroundColor: 'transparent',
  },
  container_danger: {
    backgroundColor: colors.danger,
  },

  // --- Sizes ---
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 38,
  },
  size_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 50,
  },
  size_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    minHeight: 58,
  },

  // --- Text ---
  text: {
    fontFamily: fonts.nunito.bold,
    textAlign: 'center',
  },
  text_onSolid: {
    color: colors.textWhite,
  },
  text_outline: {
    color: colors.primaryDark,
  },
  text_ghost: {
    color: colors.primaryDark,
  },
  textSize_sm: {
    fontSize: fontSizes.sm,
  },
  textSize_md: {
    fontSize: fontSizes.md,
  },
  textSize_lg: {
    fontSize: fontSizes.lg,
  },
  textDisabled: {
    opacity: 0.7,
  },

  // --- Icon ---
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default Button;
