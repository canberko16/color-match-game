import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, ViewStyle } from 'react-native';
import { RGB } from '../types';
import { rgbToString, rgbToHex, getContrastColor } from '../utils/colorUtils';
import { RADIUS, FONT_SIZE, SPACING } from '../constants/theme';

interface Props {
  color: RGB;
  size?: number;
  label?: string;
  showHex?: boolean;
  /** Animate in with a spring scale + fade on mount */
  animateIn?: boolean;
  style?: ViewStyle;
}

const ColorSwatch: React.FC<Props> = ({
  color,
  size = 130,
  label,
  showHex = false,
  animateIn = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(animateIn ? 0.6 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(animateIn ? 0 : 1)).current;

  useEffect(() => {
    if (!animateIn) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const contrastColor = getContrastColor(color);
  const bgColor = rgbToString(color);

  return (
    <Animated.View
      style={[
        styles.swatch,
        {
          width: size,
          height: size,
          borderRadius: RADIUS.lg,
          backgroundColor: bgColor,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {label && (
        <Text style={[styles.label, { color: contrastColor }]}>{label}</Text>
      )}
      {showHex && (
        <Text style={[styles.hex, { color: contrastColor }]}>
          {rgbToHex(color)}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  swatch: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  hex: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    opacity: 0.85,
  },
});

export default ColorSwatch;
