import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LeaderboardEntry } from '../types';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';
import { getScoreColor } from '../utils/colorUtils';

interface Props {
  entries: LeaderboardEntry[];
  currentUserId: string;
  maxShow?: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const LeaderboardList: React.FC<Props> = ({ entries, currentUserId, maxShow = 20 }) => {
  const visible = entries.slice(0, maxShow);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {visible.map((entry, i) => {
        const isMe = entry.userId === currentUserId;
        const sc = getScoreColor(entry.score);
        const timeStr = (entry.timeMs / 1000).toFixed(1) + 's';

        return (
          <View
            key={`${entry.userId}-${i}`}
            style={[styles.row, isMe && styles.rowMe]}
          >
            <Text style={styles.rank}>
              {i < 3 ? MEDALS[i] : `${i + 1}.`}
            </Text>
            <View style={styles.info}>
              <Text style={[styles.userId, isMe && styles.userIdMe]}>
                {isMe ? 'Sen' : `Oyuncu ${entry.userId.slice(-4)}`}
              </Text>
              <Text style={styles.time}>{timeStr}</Text>
            </View>
            <Text style={[styles.score, { color: sc }]}>{entry.score}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { maxHeight: 280 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowMe: {
    backgroundColor: '#6C63FF18', borderRadius: RADIUS.sm,
    borderBottomColor: '#6C63FF33',
  },
  rank: { fontSize: FONT_SIZE.md, width: 32, textAlign: 'center' },
  info: { flex: 1 },
  userId: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  userIdMe: { color: '#6C63FF', fontWeight: '800' },
  time: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 1 },
  score: { fontSize: FONT_SIZE.lg, fontWeight: '900' },
});

export default React.memo(LeaderboardList);
