// ============================================================
// Veterinaria La Plata — Onboarding Screen
// 4 slides con ilustraciones SVG y paginación
// ============================================================
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Svg, { Path, Circle, G, Rect, Ellipse, Line } from 'react-native-svg';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Button, Logo } from '../../components/ui';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
  bgColor: string;
}

// --- Logo / Illustrations ---
const WelcomeIllustration = () => (
  <View style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.md }}>
    <Logo size={180} />
  </View>
);

const HistorialIllustration = () => (
  <Svg width={220} height={220} viewBox="0 0 220 220">
    {/* Clipboard */}
    <Rect x="50" y="30" width="120" height="160" rx="12" fill="#FFF" stroke={colors.primary} strokeWidth="2" />
    <Rect x="75" y="20" width="70" height="24" rx="12" fill={colors.primary} />
    <Circle cx="110" cy="32" r="4" fill="#FFF" />
    {/* Lines */}
    <Rect x="70" y="65" width="80" height="8" rx="4" fill={colors.primarySoft} />
    <Rect x="70" y="85" width="60" height="8" rx="4" fill={colors.primarySoft} />
    <Rect x="70" y="105" width="70" height="8" rx="4" fill={colors.primarySoft} />
    <Rect x="70" y="125" width="50" height="8" rx="4" fill={colors.primarySoft} />
    {/* Check marks */}
    <G transform="translate(155, 65)">
      <Path d="M0,4 L3,7 L8,0" stroke={colors.success} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </G>
    <G transform="translate(155, 85)">
      <Path d="M0,4 L3,7 L8,0" stroke={colors.success} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </G>
    <G transform="translate(155, 105)">
      <Path d="M0,4 L3,7 L8,0" stroke={colors.success} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </G>
    {/* Paw at bottom */}
    <G transform="translate(110, 160)" opacity={0.3}>
      <Circle cx="0" cy="6" r="6" fill={colors.primary} />
      <Circle cx="-7" cy="-2" r="3.5" fill={colors.primary} />
      <Circle cx="7" cy="-2" r="3.5" fill={colors.primary} />
      <Circle cx="0" cy="-6" r="3" fill={colors.primary} />
    </G>
  </Svg>
);

const TurnosIllustration = () => (
  <Svg width={220} height={220} viewBox="0 0 220 220">
    {/* Calendar */}
    <Rect x="35" y="40" width="150" height="140" rx="14" fill="#FFF" stroke={colors.accent} strokeWidth="2" />
    <Rect x="35" y="40" width="150" height="40" rx="14" fill={colors.accent} />
    {/* Binding rings */}
    <Rect x="75" y="30" width="8" height="24" rx="4" fill={colors.accentDark} />
    <Rect x="137" y="30" width="8" height="24" rx="4" fill={colors.accentDark} />
    {/* Month text */}
    <Rect x="80" y="52" width="60" height="10" rx="5" fill="#FFF" opacity={0.5} />
    {/* Day cells */}
    {[0, 1, 2, 3, 4].map((col) =>
      [0, 1, 2].map((row) => (
        <Rect
          key={`${col}-${row}`}
          x={52 + col * 26}
          y={95 + row * 26}
          width="20"
          height="20"
          rx="6"
          fill={col === 2 && row === 1 ? colors.primary : colors.divider}
        />
      ))
    )}
    {/* Selected day highlight */}
    <Circle cx="114" cy="131" r="3" fill="#FFF" />
    {/* Clock icon */}
    <G transform="translate(170, 160)">
      <Circle cx="0" cy="0" r="16" fill={colors.primarySoft} stroke={colors.primary} strokeWidth="1.5" />
      <Line x1="0" y1="0" x2="0" y2="-8" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
      <Line x1="0" y1="0" x2="6" y2="3" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
    </G>
  </Svg>
);

const ShopIllustration = () => (
  <Svg width={220} height={220} viewBox="0 0 220 220">
    {/* Shopping bag */}
    <Path
      d="M60,80 L50,190 Q50,200 60,200 L160,200 Q170,200 170,190 L160,80 Z"
      fill={colors.primarySoft}
      stroke={colors.primary}
      strokeWidth="2"
    />
    {/* Handle */}
    <Path
      d="M85,80 L85,55 Q85,35 110,35 Q135,35 135,55 L135,80"
      stroke={colors.primary}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Paw on bag */}
    <G transform="translate(110, 140)">
      <Circle cx="0" cy="8" r="10" fill={colors.primary} opacity={0.4} />
      <Circle cx="-10" cy="-3" r="6" fill={colors.primary} opacity={0.4} />
      <Circle cx="10" cy="-3" r="6" fill={colors.primary} opacity={0.4} />
      <Circle cx="0" cy="-9" r="5" fill={colors.primary} opacity={0.4} />
    </G>
    {/* Stars / sparkles */}
    <G opacity={0.6}>
      <Path d="M40,60 L43,50 L46,60 L56,63 L46,66 L43,76 L40,66 L30,63 Z" fill={colors.warning} />
      <Path d="M170,50 L172,44 L174,50 L180,52 L174,54 L172,60 L170,54 L164,52 Z" fill={colors.accent} />
    </G>
    {/* Delivery truck small */}
    <G transform="translate(30, 180)">
      <Rect x="0" y="0" width="30" height="18" rx="3" fill={colors.accent} />
      <Rect x="-12" y="5" width="14" height="13" rx="2" fill={colors.accentDark} />
      <Circle cx="5" cy="20" r="4" fill="#2D3436" />
      <Circle cx="22" cy="20" r="4" fill="#2D3436" />
    </G>
  </Svg>
);

const slides: Slide[] = [
  {
    id: '1',
    title: '¡Bienvenido a\nVeterinaria La Plata!',
    description: 'El cuidado que tu mascota merece,\nal alcance de tu mano.',
    illustration: <WelcomeIllustration />,
    bgColor: colors.bgMain,
  },
  {
    id: '2',
    title: 'Historial clínico\nsiempre contigo',
    description: 'Llevá el registro de vacunas, controles\ny tratamientos de tu mascota.',
    illustration: <HistorialIllustration />,
    bgColor: colors.bgMain,
  },
  {
    id: '3',
    title: 'Pedí turnos\nen segundos',
    description: 'Agendá consultas, vacunaciones\ny peluquería desde tu celular.',
    illustration: <TurnosIllustration />,
    bgColor: colors.bgMain,
  },
  {
    id: '4',
    title: 'Tu petshop\nen tu bolsillo',
    description: 'Comprá alimentos, accesorios y más.\nRecibilos en la puerta de tu casa.',
    illustration: <ShopIllustration />,
    bgColor: colors.bgMain,
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onComplete();
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { backgroundColor: item.bgColor }]}>
      <View style={styles.illustrationContainer}>
        {item.illustration}
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: colors.primary,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={32}
      />

      <View style={styles.bottomContainer}>
        {renderDots()}

        <View style={styles.buttonsContainer}>
          {!isLastSlide && (
            <TouchableOpacity onPress={onComplete} style={styles.skipButton}>
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
          )}

          <Button
            title={isLastSlide ? 'Comenzar' : 'Siguiente'}
            onPress={goToNext}
            variant={isLastSlide ? 'accent' : 'primary'}
            size="lg"
            fullWidth={isLastSlide}
            style={isLastSlide ? {} : { minWidth: 140 }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMain,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  illustrationContainer: {
    marginBottom: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.bgCard,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 5,
    },
  },
  title: {
    fontFamily: fonts.quicksand.bold,
    fontSize: fontSizes['3xl'],
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 38,
  },
  description: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.lg,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomContainer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    padding: spacing.md,
  },
  skipText: {
    fontFamily: fonts.nunito.semiBold,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
});

export default OnboardingScreen;
