import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DailyCalendarDay, DayStatus } from '../types';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface Props {
  days: DailyCalendarDay[];
  onDayPress: (day: DailyCalendarDay) => void;
}

const statusColors: Record<DayStatus, { bg: string; text: string; border: string }> = {
  played:       { bg: '#4CAF5033', text: '#4CAF50', border: '#4CAF5055' },
  today:        { bg: '#6C63FF33', text: '#6C63FF', border: '#6C63FF88' },
  today_played: { bg: '#4CAF5044', text: '#4CAF50', border: '#6C63FF88' },
  unplayed:     { bg: '#FF6B3522', text: '#FF6B35', border: '#FF6B3544' },
  locked:       { bg: 'transparent', text: COLORS.textMuted, border: 'transparent' },
  future:       { bg: 'transparent', text: COLORS.textMuted, border: 'transparent' },
};

const CalendarGrid: React.FC<Props> = ({ days, onDayPress }) => {
  return (
    <View>
      {/* Gün başlıkları */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.weekCell}>
            <Text style={styles.weekText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Gün hücreleri */}
      <View style={styles.grid}>
        {days.map((day, i) => {
          if (day.dayNum === 0) {
            return <View key={`empty-${i}`} style={styles.cell} />;
          }

          const colors = statusColors[day.status];
          const isInteractive = ['today', 'unplayed', 'played', 'today_played'].includes(day.status);

          return (
            <TouchableOpacity
              key={day.dateKey}
              style={[
                styles.cell,
                styles.dayCell,
                { backgroundColor: colors.bg, borderColor: colors.border },
                day.status === 'today' && styles.todayCell,
              ]}
              onPress={() => isInteractive && onDayPress(day)}
              activeOpacity={isInteractive ? 0.7 : 1}
              disabled={!isInteractive}
            >
              <Text style={[styles.dayNum, { color: colors.text }]}>{day.dayNum}</Text>
              {day.status === 'played' || day.status === 'today_played' ? (
                <Text style={styles.scoreTag}>{day.score}</Text>
              ) : day.status === 'unplayed' ? (
                <Text style={styles.lockIcon}>🔓</Text>
              ) : day.status === 'today' ? (
                <Text style={styles.playDot}>!</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row', marginBottom: SPACING.xs },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: SPACING.xs },
  weekText: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: CELL_SIZE + 12, alignItems: 'center', justifyContent: 'center' },
  dayCell: {
    borderRadius: RADIUS.sm, borderWidth: 1, margin: 1,
    width: CELL_SIZE, height: CELL_SIZE + 8,
  },
  todayCell: { borderWidth: 2 },

  dayNum: { fontSize: FONT_SIZE.sm, fontWeight: '800' },
  scoreTag: { fontSize: 9, fontWeight: '700', color: '#4CAF50', marginTop: 1 },
  lockIcon: { fontSize: 10, marginTop: 1 },
  playDot: { fontSize: 10, fontWeight: '900', color: '#6C63FF', marginTop: 1 },
});

export default React.memo(CalendarGrid);
