// ============================================================
// Veterinaria La Plata — WeightChart (evolución de peso)
// Línea de tendencia con react-native-svg
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';

export interface WeightPoint {
  date: Date;
  weightKg: number;
}

interface WeightChartProps {
  points: WeightPoint[];
  height?: number;
  targetLabel?: string;
}

export const WeightChart: React.FC<WeightChartProps> = ({ points, height = 180, targetLabel = 'kg' }) => {
  const data = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Se necesitan al menos 2 mediciones de peso para graficar la evolución.</Text>
      </View>
    );
  }

  const width = 300;
  const paddingX = 24;
  const paddingY = 20;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const weights = data.map((p) => p.weightKg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = Math.max(maxW - minW, 0.5);

  const xFor = (index: number) =>
    paddingX + (data.length === 1 ? chartW / 2 : (index / (data.length - 1)) * chartW);
  const yFor = (weight: number) => paddingY + ((maxW - weight) / range) * chartH;

  const polylinePoints = data.map((p, i) => `${xFor(i)},${yFor(p.weightKg)}`).join(' ');

  // Grid lines (4 divisions)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const w = maxW - (range / 4) * i;
    return { y: yFor(w), label: w.toFixed(1) };
  });

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {gridLines.map((line, i) => (
          <React.Fragment key={i}>
            <Line
              x1={paddingX}
              y1={line.y}
              x2={width - paddingX}
              y2={line.y}
              stroke={colors.hairline}
              strokeWidth={1}
            />
            <SvgText
              x={paddingX - 6}
              y={line.y + 3}
              fill={colors.textLight}
              fontSize={9}
              textAnchor="end"
              fontFamily="Nunito_700Bold"
            >
              {line.label}
            </SvgText>
          </React.Fragment>
        ))}

        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={xFor(i)} cy={yFor(p.weightKg)} r={4} fill={colors.bgCard} stroke={colors.primary} strokeWidth={2} />
            {i === data.length - 1 && (
              <Circle cx={xFor(i)} cy={yFor(p.weightKg)} r={2.5} fill={colors.accent} />
            )}
          </React.Fragment>
        ))}
      </Svg>

      {/* Etiquetas de fechas */}
      <View style={styles.labelsRow}>
        <Text style={styles.dateLabel}>{data[0].date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</Text>
        <Text style={styles.latestLabel}>
          {data[data.length - 1].weightKg.toFixed(1)} {targetLabel}
        </Text>
        <Text style={[styles.dateLabel, { textAlign: 'right' }]}>
          {data[data.length - 1].date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  emptyText: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelsRow: {
    width: 300,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  dateLabel: {
    flex: 1,
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.xs,
    color: colors.textLight,
  },
  latestLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.quicksand.bold,
    fontSize: fontSizes.sm,
    color: colors.primaryDark,
  },
});

export default WeightChart;
