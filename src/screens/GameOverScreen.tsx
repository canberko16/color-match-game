import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import { rgbToString, getScoreColor, getScoreComment, getScoreEmoji } from '../utils/colorUtils';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

const getGradeLabel = (avg: number): string => {
  if (avg >= 90) return 'Renk Ustası 🎨';
  if (avg >= 75) return 'Renk Dedektifi 🔍';
  if (avg >= 55) return 'Renk Avcısı 🏹';
  if (avg >= 35) return 'Renk Çömezi 🌱';
  return 'Yeni Başlayan 💪';
};

interface Props {
  rounds: RoundResult[];
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}

const GameOverScreen: React.FC<Props> = ({
  rounds,
  isNewHighScore,
  onPlayAgain,
  onHome,
}) => {
  const totalScore   = useMemo(() => rounds.reduce((sum, r) => sum + r.score, 0), [rounds]);
  const averageScore = useMemo(
    () => rounds.length > 0 ? Math.round(totalScore / rounds.length) : 0,
    [rounds.length, totalScore]
  );

  const [displayAverage, setDisplayAverage] = useState(0);
  const [isNavigating,   setIsNavigating]   = useState(false);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const trophyScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.sequence([
      Animated.spring(trophyScale, {
        toValue: 1, tension: 60, friction: 5, useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    // averageScore 0 ise sayaç animasyonuna gerek yok
    if (averageScore === 0) return;

    let current = 0;
    const step  = Math.max(1, Math.ceil(averageScore / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= averageScore) {
        setDisplayAverage(averageScore);
        clearInterval(interval);
      } else {
        setDisplayAverage(current);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [averageScore]);

  const handlePlayAgain = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    onPlayAgain();
  }, [isNavigating, onPlayAgain]);

  const handleHome = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    onHome();
  }, [isNavigating, onHome]);

  const avgScoreColor = getScoreColor(averageScore);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Trophy + başlık ── */}
          <Animated.View style={[styles.heroSection, { transform: [{ scale: trophyScale }] }]}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.heroTitle}>Oyun Bitti!</Text>
            <Text style={styles.gradeLabel}>{getGradeLabel(averageScore)}</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Yeni rekor banner'ı ── */}
            {isNewHighScore && (
              <View style={styles.highScoreBanner}>
                <Text style={styles.highScoreBannerText}>🎉  Yeni rekor kırdın!</Text>
              </View>
            )}

            {/* ── Ortalama skor ── */}
            <View style={styles.averageCard}>
              <Text style={styles.averageLabel}>Ortalama Skor</Text>
              <View style={styles.averageBadge}>
                <Text style={[styles.averageNumber, { color: avgScoreColor }]}>
                  {displayAverage}
                </Text>
                <Text style={[styles.averageMax, { color: avgScoreColor + '99' }]}> / 100</Text>
              </View>
              <Text style={[styles.averageComment, { color: avgScoreColor }]}>
                {getScoreEmoji(averageScore)}  {getScoreComment(averageScore)}
              </Text>
            </View>

            {/* ── Round detayları ── */}
            {rounds.length > 0 && (
              <View style={styles.breakdownCard}>
                <Text style={styles.sectionTitle}>Round Detayları</Text>
                {rounds.map((r) => {
                  const sc = getScoreColor(r.score);
                  return (
                    <View key={r.round} style={styles.roundRow}>
                      <View style={[styles.roundColorDot, { backgroundColor: rgbToString(r.targetColor) }]} />
                      <Text style={styles.roundRowLabel}>Round {r.round}</Text>
                      <View style={styles.scoreBarTrack}>
                        <View style={[styles.scoreBarFill, { width: `${r.score}%` as any, backgroundColor: sc }]} />
                      </View>
                      <Text style={[styles.roundScore, { color: sc }]}>{r.score}</Text>
                    </View>
                  );
                })}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Toplam</Text>
                  <Text style={styles.totalScore}>{totalScore}</Text>
                </View>
              </View>
            )}

            {/* ── Butonlar ── */}
            <TouchableOpacity onPress={handlePlayAgain} activeOpacity={0.85} disabled={isNavigating}>
              <LinearGradient
                colors={['#6C63FF', '#4ECDC4']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>🔄  Tekrar Oyna</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleHome} activeOpacity={0.75} style={styles.secondaryButton} disabled={isNavigating}>
              <Text style={styles.secondaryButtonText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe:      { flex: 1 },
  scroll:    { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },

  heroSection: { alignItems: 'center', paddingTop: SPACING.xl, marginBottom: SPACING.lg },
  trophy:      { fontSize: 72, marginBottom: SPACING.sm },
  heroTitle:   { color: COLORS.text, fontSize: FONT_SIZE.xxl, fontWeight: '900', letterSpacing: -0.5, marginBottom: SPACING.xs },
  gradeLabel:  { color: '#A78BFA', fontSize: FONT_SIZE.md, fontWeight: '700', letterSpacing: 0.5 },

  highScoreBanner: {
    backgroundColor: '#FFD70022', borderRadius: RADIUS.lg, padding: SPACING.md,
    alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: '#FFD70055',
  },
  highScoreBannerText: { color: '#FFD700', fontSize: FONT_SIZE.md, fontWeight: '800', letterSpacing: 0.3 },

  averageCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  averageLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACING.md },
  averageBadge: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SPACING.sm },
  averageNumber: { fontSize: FONT_SIZE.giant, fontWeight: '900', lineHeight: 80 },
  averageMax:    { fontSize: FONT_SIZE.xl, fontWeight: '700', marginBottom: 10 },
  averageComment: { fontSize: FONT_SIZE.lg, fontWeight: '800' },

  breakdownCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md,
  },
  sectionTitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' },
  roundRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  roundColorDot: { width: 24, height: 24, borderRadius: 12, flexShrink: 0 },
  roundRowLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', width: 70, flexShrink: 0 },
  scoreBarTrack: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.round, overflow: 'hidden' },
  scoreBarFill:  { height: '100%', borderRadius: RADIUS.round },
  roundScore:    { fontSize: FONT_SIZE.sm, fontWeight: '800', width: 32, textAlign: 'right', flexShrink: 0 },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md, marginTop: SPACING.xs },
  totalLabel:    { color: COLORS.text, fontSize: FONT_SIZE.md, fontWeight: '700' },
  totalScore:    { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: '900' },

  primaryButton: { height: 58, borderRadius: RADIUS.round, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  primaryButtonText: { color: '#FFF', fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.5 },
  secondaryButton: { height: 52, borderRadius: RADIUS.round, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  secondaryButtonText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, fontWeight: '700' },
});

export default GameOverScreen;
