import React, { useEffect, useRef, useState } from 'react';
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
import { RoundResult } from '../../types';
import {
  rgbToString,
  getScoreColor,
} from '../../utils/colorUtils';
import {
  getTier,
  getMatchResultLabel,
  TROPHY_WIN,
  TROPHY_LOSS,
} from '../../utils/mmr';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../constants/theme';

interface Props {
  myRounds:         RoundResult[];
  opponentScores:   number[];       // rakibin round skorları
  trophyDelta:      number;         // +25 / -15 / 0
  newTrophyTotal:   number;
  onPlayAgain:      () => void;
  onHome:           () => void;
}

const CompetitiveResultScreen: React.FC<Props> = ({
  myRounds,
  opponentScores,
  trophyDelta,
  newTrophyTotal,
  onPlayAgain,
  onHome,
}) => {
  const myTotal  = myRounds.reduce((s, r) => s + r.score, 0);
  const oppTotal = opponentScores.reduce((s, v) => s + v, 0);

  const result = getMatchResultLabel(trophyDelta);
  const tier   = getTier(newTrophyTotal);

  const [displayDelta,   setDisplayDelta]   = useState(0);
  const [displayTrophies, setDisplayTrophies] = useState(
    newTrophyTotal - trophyDelta // önceki değerden başla
  );

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haptic
    if (trophyDelta > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }

    // Giriş animasyonu
    Animated.sequence([
      Animated.spring(resultScale, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    // Kupa sayacı — beraberede animasyon döngüsüne hiç girme
    if (trophyDelta === 0) {
      setDisplayTrophies(newTrophyTotal);
      setDisplayDelta(0);
    } else {
      let current = newTrophyTotal - trophyDelta;
      const step  = trophyDelta > 0 ? 1 : -1;
      const interval = setInterval(() => {
        current += step;
        setDisplayTrophies(current);
        setDisplayDelta(Math.abs(current - (newTrophyTotal - trophyDelta)));
        if (
          (trophyDelta > 0 && current >= newTrophyTotal) ||
          (trophyDelta < 0 && current <= newTrophyTotal)
        ) {
          setDisplayTrophies(newTrophyTotal);
          setDisplayDelta(Math.abs(trophyDelta));
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, []);

  const isWin  = trophyDelta > 0;
  const isDraw = trophyDelta === 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Sonuç banner ── */}
          <Animated.View style={[styles.resultBanner, { transform: [{ scale: resultScale }] }]}>
            <Text style={styles.resultEmoji}>{result.emoji}</Text>
            <Text style={[styles.resultText, { color: result.color }]}>{result.text}</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Skor karşılaştırması ── */}
            <View style={styles.scoreCard}>
              <ScoreColumn label="Sen" total={myTotal} color={isWin ? '#4CAF50' : isDraw ? '#FFC107' : '#F44336'} />
              <View style={styles.scoreDivider}>
                <Text style={styles.vsLabel}>vs</Text>
              </View>
              <ScoreColumn label="Rakip" total={oppTotal} color={isWin ? '#F44336' : isDraw ? '#FFC107' : '#4CAF50'} />
            </View>

            {/* ── Round breakdown ── */}
            <View style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>Round Detayları</Text>
              {myRounds.map((r, i) => {
                const oppScore = opponentScores[i] ?? 0;
                const myColor  = r.score >= oppScore ? '#4CAF50' : '#F44336';
                const oppColor = oppScore >= r.score ? '#4CAF50' : '#F44336';
                return (
                  <View key={i} style={styles.roundRow}>
                    {/* Hedef renk */}
                    <View style={[styles.colorDot, { backgroundColor: rgbToString(r.targetColor) }]} />
                    <Text style={styles.roundLabel}>R{r.round}</Text>
                    {/* Benim skorum */}
                    <Text style={[styles.roundScore, { color: myColor }]}>{r.score}</Text>
                    <Text style={styles.roundVs}>—</Text>
                    {/* Rakip skoru */}
                    <Text style={[styles.roundScore, { color: oppColor }]}>{oppScore}</Text>
                  </View>
                );
              })}
            </View>

            {/* ── Kupa değişimi ── */}
            <View style={[styles.trophyCard, { borderColor: tier.color + '55' }]}>
              <View style={styles.trophyRow}>
                <Text style={styles.trophyEmoji}>{tier.emoji}</Text>
                <View style={styles.trophyInfo}>
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                  <Text style={styles.trophyTotal}>{displayTrophies} 🏆</Text>
                </View>
                <View style={styles.deltaBadge}>
                  <Text style={[styles.deltaText, { color: trophyDelta >= 0 ? '#4CAF50' : '#F44336' }]}>
                    {trophyDelta >= 0 ? '+' : '-'}{displayDelta}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Butonlar ── */}
            <TouchableOpacity onPress={onPlayAgain} activeOpacity={0.85}>
              <LinearGradient
                colors={['#FF6B35', '#FF2D55']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>⚔️  Tekrar Oyna</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onHome} activeOpacity={0.75} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

/** Tek oyuncunun toplam skorunu gösteren sütun */
const ScoreColumn: React.FC<{ label: string; total: number; color: string }> = ({ label, total, color }) => (
  <View style={styles.scoreCol}>
    <Text style={styles.scoreColLabel}>{label}</Text>
    <Text style={[styles.scoreColTotal, { color }]}>{total}</Text>
    <Text style={styles.scoreColSub}>/ 500</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe:      { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingBottom:     SPACING.xxl,
  },

  // Sonuç banner
  resultBanner: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  resultEmoji: { fontSize: 64 },
  resultText: {
    fontSize:     FONT_SIZE.xxl,
    fontWeight:   '900',
    letterSpacing: -0.5,
  },

  // Skor kartı
  scoreCard: {
    flexDirection:   'row',
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.xl,
    padding:         SPACING.xl,
    marginBottom:    SPACING.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    alignItems:      'center',
  },
  scoreCol: { flex: 1, alignItems: 'center', gap: 2 },
  scoreColLabel: {
    color:      COLORS.textSecondary,
    fontSize:   FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreColTotal: {
    fontSize:   FONT_SIZE.xxl,
    fontWeight: '900',
    lineHeight: 38,
  },
  scoreColSub: {
    color:      COLORS.textMuted,
    fontSize:   FONT_SIZE.xs,
    fontWeight: '600',
  },
  scoreDivider: { width: 40, alignItems: 'center' },
  vsLabel: {
    color:      COLORS.textMuted,
    fontSize:   FONT_SIZE.md,
    fontWeight: '800',
  },

  // Breakdown
  breakdownCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.lg,
    marginBottom:    SPACING.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    gap:             SPACING.md,
  },
  sectionTitle: {
    color:       COLORS.textSecondary,
    fontSize:    FONT_SIZE.sm,
    fontWeight:  '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign:   'center',
  },
  roundRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            SPACING.sm,
  },
  colorDot: { width: 22, height: 22, borderRadius: 11, flexShrink: 0 },
  roundLabel: {
    color:      COLORS.textSecondary,
    fontSize:   FONT_SIZE.sm,
    fontWeight: '600',
    width:      36,
  },
  roundScore: { fontSize: FONT_SIZE.md, fontWeight: '800', flex: 1, textAlign: 'center' },
  roundVs:   { color: COLORS.textMuted, fontSize: FONT_SIZE.sm },

  // Kupa kartı
  trophyCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.lg,
    marginBottom:    SPACING.lg,
    borderWidth:     1,
  },
  trophyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  trophyEmoji: { fontSize: 32 },
  trophyInfo: { flex: 1 },
  tierName: { fontSize: FONT_SIZE.md, fontWeight: '800' },
  trophyTotal: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', marginTop: 2 },
  deltaBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius:    RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.xs,
  },
  deltaText: { fontSize: FONT_SIZE.lg, fontWeight: '900' },

  // Butonlar
  primaryButton: {
    height:         56,
    borderRadius:   RADIUS.round,
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   SPACING.md,
  },
  primaryButtonText: { color: '#FFF', fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.5 },
  secondaryButton: {
    height:          52,
    borderRadius:    RADIUS.round,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: COLORS.surface,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  secondaryButtonText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, fontWeight: '700' },
});

export default CompetitiveResultScreen;
