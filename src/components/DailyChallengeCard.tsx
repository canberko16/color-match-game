import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getDailyAttempt } from '../utils/dailyStorage';
import { getDailyColor, getDateKey } from '../utils/dailyColor';
import { rgbToString, getScoreColor } from '../utils/colorUtils';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

interface Props {
  onPress: () => void;
}

const DailyChallengeCard: React.FC<Props> = ({ onPress }) => {
  const [played, setPlayed] = useState(false);
  const [score, setScore]   = useState(0);

  const todayKey = getDateKey();
  const todayColor = getDailyColor(todayKey);

  useEffect(() => {
    getDailyAttempt(todayKey).then((a) => {
      if (a) { setPlayed(true); setScore(a.score); }
    });
  }, [todayKey]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.wrapper}>
      <LinearGradient
        colors={['#FF6B3522', '#6C63FF22']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Sol: renk önizleme */}
        <View style={[styles.colorPreview, { backgroundColor: rgbToString(todayColor) }]} />

        {/* Orta: bilgi */}
        <View style={styles.info}>
          <Text style={styles.title}>Gunluk Challenge</Text>
          {played ? (
            <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>
              Skorun: {score}
            </Text>
          ) : (
            <Text style={styles.subtitle}>Bugunku rengi tahmin et!</Text>
          )}
        </View>

        {/* Sag: aksiyon */}
        <View style={styles.action}>
          {played ? (
            <Text style={styles.checkmark}>✓</Text>
          ) : (
            <View style={styles.playBadge}>
              <Text style={styles.playText}>Oyna</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.lg },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: '#FF6B3533',
  },
  colorPreview: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  info: { flex: 1 },
  title: { color: COLORS.text, fontSize: FONT_SIZE.md, fontWeight: '800', marginBottom: 2 },
  subtitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  scoreText: { fontSize: FONT_SIZE.sm, fontWeight: '800' },
  action: { alignItems: 'center' },
  playBadge: {
    backgroundColor: '#FF6B35', borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
  },
  playText: { color: '#FFF', fontSize: FONT_SIZE.sm, fontWeight: '800' },
  checkmark: { color: '#4CAF50', fontSize: 24, fontWeight: '900' },
});

export default DailyChallengeCard;
