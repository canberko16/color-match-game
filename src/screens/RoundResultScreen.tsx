import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { RoundResult } from '../types';
import {
  rgbToHex,
  getScoreComment,
  getScoreEmoji,
  getScoreColor,
} from '../utils/colorUtils';
import ColorSwatch from '../components/ColorSwatch';
import RoundHistory from '../components/RoundHistory';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

interface Props {
  result: RoundResult;
  allRounds: RoundResult[];
  totalRounds: number;
  isLastRound: boolean;
  onNext: () => void;
}

const RoundResultScreen: React.FC<Props> = ({
  result,
  allRounds,
  totalRounds,
  isLastRound,
  onNext,
}) => {
  const { targetColor, guessedColor, score, round } = result;

  const [displayScore, setDisplayScore] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false); // double-tap önleme

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Skor kalitesine göre haptic
    if (score >= 80) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (score >= 50) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    // Giriş animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
    ]).start();

    // Skor sayacı — score 0 ise animasyon gereksiz
    if (score === 0) {
      setDisplayScore(0);
      return;
    }

    let current = 0;
    const step = Math.max(1, Math.ceil(score / 30)); // minimum 1 adım
    const interval = setInterval(() => {
      current += step;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [score]);

  const handleNext = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    onNext();
  }, [isNavigating, onNext]);

  const scoreColor = getScoreColor(score);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.roundLabel}>Round {round} / {totalRounds}</Text>
              <Text style={styles.title}>Sonuç</Text>
            </View>

            {/* ── Skor kartı ── */}
            <Animated.View style={[styles.scoreCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={[styles.scoreBadge, { borderColor: scoreColor + '60' }]}>
                <Text style={[styles.scoreNumber, { color: scoreColor }]}>{displayScore}</Text>
                <Text style={[styles.scoreMax, { color: scoreColor + 'AA' }]}> / 100</Text>
              </View>
              <Text style={styles.scoreEmoji}>{getScoreEmoji(score)}</Text>
              <Text style={[styles.scoreComment, { color: scoreColor }]}>
                {getScoreComment(score)}
              </Text>
            </Animated.View>

            {/* ── Renk karşılaştırması ── */}
            <View style={styles.comparisonSection}>
              <Text style={styles.sectionTitle}>Renk karşılaştırması</Text>
              <View style={styles.swatchRow}>
                <View style={styles.swatchItem}>
                  <ColorSwatch color={targetColor} size={130} animateIn />
                  <Text style={styles.swatchLabel}>Gerçek</Text>
                  <Text style={styles.swatchHex}>{rgbToHex(targetColor)}</Text>
                  <Text style={styles.swatchRGB}>
                    {targetColor.r} · {targetColor.g} · {targetColor.b}
                  </Text>
                </View>
                <View style={styles.vsDivider}>
                  <Text style={styles.vsText}>vs</Text>
                </View>
                <View style={styles.swatchItem}>
                  <ColorSwatch color={guessedColor} size={130} animateIn />
                  <Text style={styles.swatchLabel}>Tahminin</Text>
                  <Text style={styles.swatchHex}>{rgbToHex(guessedColor)}</Text>
                  <Text style={styles.swatchRGB}>
                    {guessedColor.r} · {guessedColor.g} · {guessedColor.b}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Round geçmişi ── */}
            <View style={styles.historyCard}>
              <Text style={styles.sectionTitle}>Tüm roundlar</Text>
              <RoundHistory rounds={allRounds} totalRounds={totalRounds} />
            </View>

            {/* ── Sonraki buton ── */}
            <TouchableOpacity onPress={handleNext} activeOpacity={0.85} disabled={isNavigating}>
              <LinearGradient
                colors={['#6C63FF', '#4ECDC4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>
                  {isLastRound ? 'Sonuçları Gör 🏆' : 'Sonraki Round →'}
                </Text>
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
  scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },

  header: { alignItems: 'center', paddingTop: SPACING.lg, marginBottom: SPACING.lg },
  roundLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700', letterSpacing: 0.5, marginBottom: SPACING.xs },
  title: { color: COLORS.text, fontSize: FONT_SIZE.xl, fontWeight: '800', letterSpacing: -0.3 },

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
  scoreMax:    { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: 10, marginLeft: 4 },
  scoreEmoji:  { fontSize: 36, marginBottom: SPACING.xs },
  scoreComment: { fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.3 },

  comparisonSection: { marginBottom: SPACING.lg },
  sectionTitle: {
    color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700',
    letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: SPACING.lg,
  },
  swatchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  swatchItem: { alignItems: 'center', flex: 1, gap: SPACING.xs },
  swatchLabel: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: '700', marginTop: SPACING.xs },
  swatchHex:   { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  swatchRGB:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
  vsDivider:   { width: 36, alignItems: 'center' },
  vsText:      { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, fontWeight: '800', letterSpacing: 1 },

  historyCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },

  nextButton: { height: 58, borderRadius: RADIUS.round, justifyContent: 'center', alignItems: 'center' },
  nextButtonText: { color: '#FFF', fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.5 },
});

export default RoundResultScreen;
