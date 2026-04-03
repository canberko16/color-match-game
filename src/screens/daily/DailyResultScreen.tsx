import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DailyAttempt, LeaderboardEntry } from '../../types';
import {
  rgbToHex,
  rgbToString,
  getScoreComment,
  getScoreEmoji,
  getScoreColor,
} from '../../utils/colorUtils';
import { fetchDailyLeaderboard, getUserRankInfo } from '../../utils/dailyLeaderboard';
import LeaderboardList from '../../components/LeaderboardList';
import ColorSwatch from '../../components/ColorSwatch';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../constants/theme';

interface Props {
  attempt: DailyAttempt;
  userId: string;
  onBack: () => void;
}

const DailyResultScreen: React.FC<Props> = ({ attempt, userId, onBack }) => {
  const { targetColor, guessedColor, score, timeMs, dateKey } = attempt;

  const [displayScore, setDisplayScore] = useState(0);
  const [rankInfo, setRankInfo] = useState<{ rank: number; total: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (score >= 80) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
    ]).start();

    // Skor sayaci animasyonu
    if (score > 0) {
      let current = 0;
      const step = Math.max(1, Math.ceil(score / 30));
      const interval = setInterval(() => {
        current += step;
        if (current >= score) { setDisplayScore(score); clearInterval(interval); }
        else setDisplayScore(current);
      }, 20);
      return () => clearInterval(interval);
    }
  }, [score]);

  // Leaderboard verisi
  useEffect(() => {
    fetchDailyLeaderboard(dateKey).then(setLeaderboard);
    getUserRankInfo(dateKey, userId).then(setRankInfo);
  }, [dateKey, userId]);

  const scoreColor = getScoreColor(score);
  const timeStr = (timeMs / 1000).toFixed(1);
  const percentile = rankInfo
    ? Math.round(((rankInfo.total - rankInfo.rank) / rankInfo.total) * 100)
    : null;

  // Tarih formati
  const dayParts = dateKey.split('-');
  const dateLabel = `${dayParts[2]}.${dayParts[1]}.${dayParts[0]}`;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.dateLabel}>{dateLabel}</Text>
              <Text style={styles.title}>Gunluk Challenge</Text>
            </View>

            {/* Skor karti */}
            <Animated.View style={[styles.scoreCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={[styles.scoreBadge, { borderColor: scoreColor + '60' }]}>
                <Text style={[styles.scoreNumber, { color: scoreColor }]}>{displayScore}</Text>
                <Text style={[styles.scoreMax, { color: scoreColor + 'AA' }]}> / 100</Text>
              </View>
              <Text style={styles.scoreEmoji}>{getScoreEmoji(score)}</Text>
              <Text style={[styles.scoreComment, { color: scoreColor }]}>{getScoreComment(score)}</Text>
              <Text style={styles.timeText}>Sure: {timeStr}s</Text>
            </Animated.View>

            {/* Renk karsilastirmasi */}
            <View style={styles.comparisonSection}>
              <View style={styles.swatchRow}>
                <View style={styles.swatchItem}>
                  <ColorSwatch color={targetColor} size={110} animateIn />
                  <Text style={styles.swatchLabel}>Gercek</Text>
                  <Text style={styles.swatchHex}>{rgbToHex(targetColor)}</Text>
                </View>
                <View style={styles.vsBox}>
                  <Text style={styles.vsText}>vs</Text>
                </View>
                <View style={styles.swatchItem}>
                  <ColorSwatch color={guessedColor} size={110} animateIn />
                  <Text style={styles.swatchLabel}>Tahminin</Text>
                  <Text style={styles.swatchHex}>{rgbToHex(guessedColor)}</Text>
                </View>
              </View>
            </View>

            {/* Siralama bilgisi */}
            {rankInfo && (
              <View style={styles.rankCard}>
                <Text style={styles.rankTitle}>Siralaman</Text>
                <View style={styles.rankRow}>
                  <View style={styles.rankItem}>
                    <Text style={styles.rankBig}>{rankInfo.rank}.</Text>
                    <Text style={styles.rankSub}>{rankInfo.total} oyuncudan</Text>
                  </View>
                  {percentile !== null && (
                    <View style={styles.rankItem}>
                      <Text style={[styles.rankBig, { color: '#4ECDC4' }]}>%{percentile}</Text>
                      <Text style={styles.rankSub}>daha iyi</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <View style={styles.leaderboardCard}>
                <Text style={styles.leaderboardTitle}>Gunun En Iyileri</Text>
                <LeaderboardList
                  entries={leaderboard}
                  currentUserId={userId}
                  maxShow={10}
                />
              </View>
            )}

            {/* Geri butonu */}
            <TouchableOpacity onPress={onBack} activeOpacity={0.85}>
              <LinearGradient
                colors={['#6C63FF', '#4ECDC4']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Takvime Don</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },

  header: { alignItems: 'center', paddingTop: SPACING.lg, marginBottom: SPACING.lg },
  dateLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700', letterSpacing: 0.5, marginBottom: SPACING.xs },
  title: { color: COLORS.text, fontSize: FONT_SIZE.xl, fontWeight: '800' },

  scoreCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  scoreBadge: {
    flexDirection: 'row', alignItems: 'flex-end', marginBottom: SPACING.md,
    borderWidth: 2, borderRadius: RADIUS.round, paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm, backgroundColor: COLORS.surfaceElevated,
  },
  scoreNumber: { fontSize: FONT_SIZE.giant, fontWeight: '900', lineHeight: 80 },
  scoreMax: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: 10, marginLeft: 4 },
  scoreEmoji: { fontSize: 36, marginBottom: SPACING.xs },
  scoreComment: { fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.3 },
  timeText: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, fontWeight: '600', marginTop: SPACING.sm },

  comparisonSection: { marginBottom: SPACING.lg },
  swatchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  swatchItem: { alignItems: 'center', flex: 1, gap: SPACING.xs },
  swatchLabel: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: '700', marginTop: SPACING.xs },
  swatchHex: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  vsBox: { width: 36, alignItems: 'center' },
  vsText: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, fontWeight: '800', letterSpacing: 1 },

  rankCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#6C63FF33',
  },
  rankTitle: {
    color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700',
    letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: SPACING.md,
  },
  rankRow: { flexDirection: 'row', justifyContent: 'space-around' },
  rankItem: { alignItems: 'center' },
  rankBig: { color: '#6C63FF', fontSize: FONT_SIZE.xxl, fontWeight: '900' },
  rankSub: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 2 },

  leaderboardCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  leaderboardTitle: {
    color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700',
    letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: SPACING.md,
  },

  backButton: { height: 58, borderRadius: RADIUS.round, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: '#FFF', fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.5 },
});

export default DailyResultScreen;
