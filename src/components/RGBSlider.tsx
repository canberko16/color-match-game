import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

interface Props {
  label: string;
  value: number;
  trackColor: string;
  onChange: (value: number) => void;
}

/**
 * Tek bir RGB kanalı için slider bileşeni.
 * React.memo ile sarılmış — onChange referansı değişmedikçe yeniden render olmaz.
 */
const RGBSlider: React.FC<Props> = ({ label, value, trackColor, onChange }) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={[styles.colorDot, { backgroundColor: trackColor }]} />
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueBox}>
          <Text style={styles.valueText}>{Math.round(value)}</Text>
        </View>
      </View>

      <Slider
        style={styles.slider}
        value={value}
        minimumValue={0}
        maximumValue={255}
        step={1}
        minimumTrackTintColor={trackColor}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor="#FFFFFF"
        onValueChange={onChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.5,
  },
  valueBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 46,
    alignItems: 'center',
  },
  valueText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  slider: {
    height: 40,
  },
});

export default memo(RGBSlider);
