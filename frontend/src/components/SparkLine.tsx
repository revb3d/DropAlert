import React, { useMemo } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  lineColor?: string;
  fillColor?: string;
  strokeWidth?: number;
}

export default function SparkLine({
  data,
  width = 120,
  height = 40,
  lineColor = colors.spark,
  fillColor = colors.sparkFill,
  strokeWidth = 1.5,
}: Props) {
  const { linePath, fillPath } = useMemo(() => {
    if (!data || data.length < 2) return { linePath: '', fillPath: '' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2; // vertical padding in px

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = pad + ((max - val) / range) * (height - pad * 2);
      return { x, y };
    });

    // Smooth path using cardinal spline approximation
    const tension = 0.4;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const fill =
      d + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { linePath: d, fillPath: fill };
  }, [data, width, height]);

  if (!linePath) return null;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
          <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fillPath} fill="url(#sparkGrad)" />
      <Path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
