import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import Theme from '../theme/theme';
import { Caption, Subheading } from './Typography';

interface CustomLineChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  gradientStartColor?: string;
  gradientStopColor?: string;
  minVal?: number;
  maxVal?: number;
  title?: string;
  unit?: string;
  style?: ViewStyle;
}

export const CustomLineChart: React.FC<CustomLineChartProps> = ({
  data = [],
  labels = [],
  height = 180,
  color = Theme.colors.primary,
  gradientStartColor = Theme.colors.primaryLight,
  gradientStopColor = '#FFFFFF',
  minVal,
  maxVal,
  title,
  unit = '',
  style,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - Theme.spacing.xl * 2; // adjusted to card borders
  const paddingLeft = 35;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

  const drawableWidth = chartWidth - paddingLeft - paddingRight;
  const drawableHeight = height - paddingTop - paddingBottom;

  // Process data limits
  const activeData = data.length > 0 ? data : [0];
  const dataMax = Math.max(...activeData);
  const dataMin = Math.min(...activeData);

  const min = minVal !== undefined ? minVal : Math.max(0, Math.floor(dataMin * 0.9));
  const max = maxVal !== undefined ? maxVal : Math.max(10, Math.ceil(dataMax * 1.1));
  const range = max - min || 1;

  // Grid coordinates mapping
  const points = activeData.map((val, index) => {
    const x = paddingLeft + (index / (Math.max(1, activeData.length - 1))) * drawableWidth;
    const y = paddingTop + drawableHeight - ((val - min) / range) * drawableHeight;
    return { x, y, value: val };
  });

  // Construct SVG Path
  let linePath = '';
  let fillPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    fillPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + drawableHeight} L ${points[0].x} ${paddingTop + drawableHeight} Z`;
  }

  // Draw grid ticks
  const gridSteps = 3;
  const yTicks = Array.from({ length: gridSteps + 1 }).map((_, i) => {
    const val = min + (range / gridSteps) * i;
    const y = paddingTop + drawableHeight - (i / gridSteps) * drawableHeight;
    return { val: Math.round(val), y };
  });

  return (
    <View style={[styles.container, style]}>
      {title && (
        <View style={styles.header}>
          <Subheading style={styles.title}>{title}</Subheading>
          {data.length > 0 && (
            <Caption style={styles.latestValue}>
              Latest: {data[data.length - 1].toFixed(0)}
              {unit}
            </Caption>
          )}
        </View>
      )}

      {data.length === 0 ? (
        <View style={[styles.emptyContainer, { height }]}>
          <Caption>Waiting for telemetry stream...</Caption>
        </View>
      ) : (
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <Stop offset="100%" stopColor={gradientStopColor} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <React.Fragment key={i}>
              <Line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke={Theme.colors.divider}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={tick.y + 4}
                fontSize={Theme.typography.sizes.xs}
                fill={Theme.colors.textSecondary}
                textAnchor="end"
              >
                {tick.val}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Area Fill */}
          {fillPath !== '' && <Path d={fillPath} fill="url(#chartGradient)" />}

          {/* Path Line */}
          {linePath !== '' && (
            <Path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Highlight latest point */}
          {points.length > 0 && (
            <Circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4.5"
              fill={color}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          )}

          {/* Horizontal Labels */}
          {labels.length > 0 &&
            labels.map((lbl, index) => {
              const denom = Math.max(1, labels.length - 1);
              const showLabel =
                labels.length === 1 ||
                index === 0 ||
                index === labels.length - 1 ||
                index === Math.floor(labels.length / 2);
              if (!showLabel) return null;
              const x = paddingLeft + (index / denom) * drawableWidth;
              return (
                <SvgText
                  key={index}
                  x={x}
                  y={height - 6}
                  fontSize={Theme.typography.sizes.xs}
                  fill={Theme.colors.textMuted}
                  textAnchor="middle"
                >
                  {lbl}
                </SvgText>
              );
            })}
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.typography.sizes.base,
    color: Theme.colors.text,
  },
  latestValue: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.semibold,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Theme.colors.divider,
    borderRadius: Theme.borders.radius.md,
  },
});
export default CustomLineChart;
