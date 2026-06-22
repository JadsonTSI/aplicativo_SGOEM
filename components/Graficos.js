import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const C = {
  gold: '#C9A84C', goldL: '#E8C96A', goldPale: '#F5E9C8', goldD: '#9A7A30',
  ink: '#0F0D0A', soft: '#2A2520', cream: '#FDFAF3', surf: '#F2EDE2',
  mute: '#8A7E70', line: '#E2D8C8',
  green: '#2D7A4F', greenBg: '#E8F5EE',
  red: '#C0392B',   redBg: '#FDECEA',
  blue: '#1A5FAB',  blueBg: '#EAF1FB',
  amber: '#B8620A', amberBg: '#FDF3E3',
};

// ── 1. GRÁFICO DE BARRAS VERTICAL ANIMADO ──────────────────────────────────────────
export function VerticalBarChart({ data, color = C.gold, height = 150 }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: false,
    }).start();
  }, [data]);

  const maxVal = Math.max(...data.map(d => d.v), 1);
  const gridLines = [0, 0.33, 0.66, 1];

  return (
    <View style={[s.barChartContainer, { height: height + 40 }]}>
      {/* Linhas de Grade de Fundo */}
      <View style={[s.gridContainer, { height }]}>
        {gridLines.map((gl, i) => (
          <View
            key={i}
            style={[
              s.gridLine,
              { bottom: `${gl * 100}%` },
              i === 0 && { backgroundColor: C.line, height: 1.5 }
            ]}
          />
        ))}
      </View>

      {/* Barras */}
      <View style={[s.barsRow, { height }]}>
        {data.map((d, index) => {
          const pct = d.v / maxVal;
          const barHeight = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, pct * height],
          });

          return (
            <View key={index} style={s.barCol}>
              {/* Valor flutuante no topo */}
              <Animated.View
                style={[
                  s.barValBox,
                  {
                    bottom: barHeight,
                    opacity: animValue.interpolate({
                      inputRange: [0, 0.8, 1],
                      outputRange: [0, 0, 1],
                    }),
                  },
                ]}
              >
                <Text style={s.barValText}>{d.v}</Text>
              </Animated.View>

              {/* Corpo da Barra */}
              <Animated.View
                style={[
                  s.barBody,
                  {
                    height: barHeight,
                    backgroundColor: color,
                  },
                ]}
              />

              {/* Legenda inferior */}
              <Text style={s.barLabelText} numberOfLines={1}>
                {d.l}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── 2. GRÁFICO DE ROSCA / DOUGHNUT COM SVG E LEGENDA LATERAL ───────────────────────
export function DoughnutChart({ data, size = 130, strokeWidth = 20 }) {
  const animScale = useRef(new Animated.Value(0.3)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animScale.setValue(0.3);
    animOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(animScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [data]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  // Montar arcos
  let accumulatedPct = 0;
  const slices = data.map(item => {
    const pct = total > 0 ? item.value / total : 0;
    const offset = circ - pct * circ;
    const rotateAngle = accumulatedPct * 360 - 90;
    accumulatedPct += pct;

    return {
      ...item,
      pct,
      offset,
      rotateAngle,
    };
  });

  return (
    <View style={s.doughnutContainer}>
      {/* Círculo Gráfico Animado */}
      <Animated.View
        style={[
          s.doughnutGraphic,
          {
            width: size,
            height: size,
            transform: [{ scale: animScale }],
            opacity: animOpacity,
          },
        ]}
      >
        <Svg width={size} height={size}>
          {total === 0 ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={C.line}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
          ) : (
            slices.map((slice, i) => (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circ} ${circ}`}
                strokeDashoffset={slice.offset}
                transform={`rotate(${slice.rotateAngle} ${size / 2} ${size / 2})`}
                strokeLinecap="butt"
                fill="transparent"
              />
            ))
          )}
        </Svg>

        {/* Miolo da Rosca */}
        <View
          style={[
            s.doughnutInnerCircle,
            {
              width: size - strokeWidth * 2 + 2,
              height: size - strokeWidth * 2 + 2,
              borderRadius: (size - strokeWidth * 2 + 2) / 2,
            },
          ]}
        >
          <Text style={s.doughnutTotalNum}>{total}</Text>
          <Text style={s.doughnutTotalLabel}>Total</Text>
        </View>
      </Animated.View>

      {/* Legendas Laterais */}
      <View style={s.legendsColumn}>
        {slices.map((slice, i) => (
          <View key={i} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: slice.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.legendText} numberOfLines={1}>
                {slice.label}
              </Text>
              <Text style={s.legendVal}>
                {slice.value} un. ({Math.round(slice.pct * 100)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── 3. LISTA DE PROGRESSO HORIZONTAL ANIMADA ─────────────────────────────────────
export function NaipeProgressList({ data }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={s.progressListContainer}>
      {data.map((item, i) => (
        <ProgressRow
          key={i}
          label={item.label}
          value={item.value}
          max={maxVal}
          color={item.color || C.gold}
        />
      ))}
    </View>
  );
}

function ProgressRow({ label, value, max, color }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animWidth.setValue(0);
    Animated.timing(animWidth, {
      toValue: max > 0 ? value / max : 0,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value, max]);

  const widthPct = animWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.progressRowWrap}>
      <View style={s.progressRowHeader}>
        <Text style={s.progressRowLabel}>{label}</Text>
        <Text style={[s.progressRowVal, { color }]}>{value} alunos</Text>
      </View>
      <View style={s.progressRowBg}>
        <Animated.View style={[s.progressRowFill, { width: widthPct, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  barChartContainer: {
    width: '100%',
    position: 'relative',
    marginTop: 15,
    marginBottom: 5,
  },
  gridContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: C.line + '55',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    zIndex: 2,
  },
  barCol: {
    alignItems: 'center',
    width: 48,
    position: 'relative',
  },
  barValBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: C.soft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  barValText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  barBody: {
    width: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabelText: {
    fontSize: 9,
    color: C.mute,
    marginTop: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    width: '100%',
  },

  doughnutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    gap: 12,
  },
  doughnutGraphic: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  doughnutInnerCircle: {
    position: 'absolute',
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  doughnutTotalNum: {
    fontSize: 20,
    fontWeight: '900',
    color: C.ink,
    lineHeight: 22,
  },
  doughnutTotalLabel: {
    fontSize: 8,
    color: C.mute,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  legendsColumn: {
    flex: 1,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.soft,
  },
  legendVal: {
    fontSize: 10,
    color: C.mute,
    marginTop: 1,
  },

  progressListContainer: {
    width: '100%',
    gap: 12,
    marginTop: 6,
  },
  progressRowWrap: {
    width: '100%',
  },
  progressRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.soft,
  },
  progressRowVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressRowBg: {
    width: '100%',
    height: 6,
    backgroundColor: C.line,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressRowFill: {
    height: '100%',
    borderRadius: 3,
  },
});
