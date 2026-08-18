// ============================================================
// Veterinaria La Plata — MetricsChart (barras)
// Ingresos/turnos por período con react-native-svg
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';

export interface BarDatum {
  label: string;
  value: number;
}

interface MetricsChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  height = 180,
  color = colors.primary,
  formatValue = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)),
}) => {
  if (!data.length) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Sin datos para el período seleccionado.</Text>
      </View>
    );
  }

  const width = 300;
  const padL = 30;
  const padB = 26;
  const chartW = width - padL;
  const chartH = height - padB;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barGap = 10;
  const barW = (chartW - barGap * (data.length - 1)) / data.length;
  const half = barW / 2;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Guías horizontales */}
        {[0, 0.5, 1].map((f) => {
          const y = padB + chartH * (1 - f);
          return (
            <Rect
              key={f}
              x={padL}
              y={y}
              width={chartW}
              height={0.5}
              fill={colors.hairline}
            />
          );
        })}

        {data.map((d, i) => {
          const barH = Math.max((d.value / maxValue) * (chartH - 8), 2);
          const x = padL + i * (barW + barGap);
          const y = padB + chartH - barH;
          const isMax = d.value === maxValue;

          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={barW} height={barH} rx={6} fill={isMax ? color : colors.primarySoft} />
              <SvgText
                x={x + half}
                y={y - 5}
                fill={isMax ? color : colors.textMuted}
                fontSize={9}
                textAnchor="middle"
                fontFamily="Nunito_700Bold"
              >
                {d.value > 0 ? formatValue(d.value) : ''}
              </SvgText>
              <SvgText
                x={x + half}
                y={height - 8}
                fill={colors.textMuted}
                fontSize={10}
                textAnchor="middle"
                fontFamily="Nunito_600SemiBold"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
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
});

export default MetricsChart;
