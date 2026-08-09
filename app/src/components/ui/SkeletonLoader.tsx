// ============================================================
// Veterinaria La Plata — Skeleton Loader Component
// Animated shimmer effect for loading states
// ============================================================
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../config/theme';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadiusValue?: number;
  style?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width,
  height,
  borderRadiusValue = borderRadius.md,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadiusValue,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Pre-made skeleton variants
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[skeletonStyles.card, style]}>
    <SkeletonLoader width={60} height={60} borderRadiusValue={30} />
    <View style={skeletonStyles.cardContent}>
      <SkeletonLoader width="70%" height={16} />
      <SkeletonLoader width="50%" height={12} style={{ marginTop: 8 }} />
    </View>
  </View>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} style={{ marginBottom: 12 }} />
    ))}
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default SkeletonLoader;
