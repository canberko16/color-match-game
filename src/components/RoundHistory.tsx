import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RoundResult } from '../types';
import { rgbToString, getScoreColor } from '../utils/colorUtils';
import { COLORS, FONT_SIZE, SPACING } from '../constants/theme';

interface Props {
  rounds: RoundResult[];
  totalRounds?: number;
}

/**
 * Tamamlanan/bekleyen roundların kompakt özet satırı.
 * React.memo ile sarılmış — rounds dizisi değişmedikçe yeniden render olmaz.
 */
const RoundHistory: React.FC<Props> = ({ rounds, totalRounds = 5 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalRounds }).map((_, idx) => {
        const round = rounds[idx];
        const isCompleted = !!round;

        return (
          <View key={idx} style={styles.item}>
            <View
              style={[
                styles.colorDot,
                {
                  backgroundColor: isCompleted
                    ? rgbToString(round.targetColor)
                    : COLORS.border,
                },
              ]}
            />
            <Text
              style={[
                styles.roundLabel,
                { color: isCompleted ? COLORS.textSecondary : COLORS.textMuted },
              ]}
            >
              R{idx + 1}
            </Text>
            <Text
              style={[
                styles.score,
                {
                  color: isCompleted
                    ? getScoreColor(round.score)
                    : COLORS.textMuted,
                },
              ]}
            >
              {isCompleted ? round.score : '—'}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
  },
  item: {
    alignItems: 'center',
    gap: 4,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  roundLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  score: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
});

export default memo(RoundHistory);
