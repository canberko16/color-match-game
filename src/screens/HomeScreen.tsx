import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  Modal,
  Linking,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTier, Tier } from '../utils/mmr';
import { getTopScores, GameRecord } from '../utils/storage';
import { getScoreColor } from '../utils/colorUtils';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

const APP_STORE_ID    = '6761482277';
const GITHUB_ISSUES   = 'https://github.com/canberko16/color-match-game/issues/new';

interface Blob {
  color: string;
  size:  number;
  top:   number;
  left?: number;
  right?: number;
}

interface Props {
  onPlay: () => void;
  onCompetitive: () => void;
  highScore: number;
  trophies: number;
}

const BLOBS: Blob[] = [
  { color: '#FF6B6B50', size: 140, top: 50,  left: -40  },
  { color: '#4ECDC450', size: 110, top: 70,  right: -25 },
  { color: '#FFE66D40', size:  90, top: 230, left:   30 },
  { color: '#A78BFA40', size: 100, top: 270, right:  10 },
];

const HomeScreen: React.FC<Props> = ({ onPlay, onCompetitive, highScore, trophies }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const [showTop5, setShowTop5]   = useState(false);
  const [topScores, setTopScores] = useState<GameRecord[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleShowTop5 = useCallback(async () => {
    const scores = await getTopScores();
    setTopScores(scores);
    setShowTop5(true);
  }, []);

  const handlePlay        = useCallback(() => onPlay(), [onPlay]);
  const handleCompetitive = useCallback(() => onCompetitive(), [onCompetitive]);

  const handleBugReport = useCallback(() => {
    Linking.openURL(GITHUB_ISSUES).catch(() => {});
  }, []);

  const handleRateApp = useCallback(() => {
    Linking.openURL(
      `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
    ).catch(() => {});
  }, []);

  const tier: Tier = getTier(trophies);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
  };

  return (
    <View style={styles.container}>
      {BLOBS.map((blob, i) => (
        <View
          key={i}
          style={[
            styles.blob,
            {
              width:        blob.size,
              height:       blob.size,
              borderRadius: blob.size / 2,
              backgroundColor: blob.color,
              top:   blob.top,
              left:  blob.left,
              right: blob.right,
            },
          ]}
        />
      ))}

      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* ── Logo + başlık ── */}
          <View style={styles.logoSection}>
            <View style={styles.logoGrid}>
              {['#FF6B6B', '#FFE66D', '#4ECDC4', '#A78BFA'].map((c, i) => (
                <View key={i} style={[styles.logoDot, { backgroundColor: c }]} />
              ))}
            </View>
            <Text style={styles.title}>Color Match</Text>
            <Text style={styles.subtitle}>Rengi gör, hatırla, tahmin et</Text>
          </View>

          {/* ── Kupa / kademe kartı ── */}
          <View style={styles.trophyRow}>
            <View style={[styles.trophyCard, { borderColor: tier.color + '55' }]}>
              <Text style={styles.trophyEmoji}>{tier.emoji}</Text>
              <View>
                <Text style={[styles.trophyTier, { color: tier.color }]}>{tier.name}</Text>
                <Text style={styles.trophyCount}>{trophies} 🏆</Text>
              </View>
            </View>
            {highScore > 0 && (
              <TouchableOpacity
                style={styles.highScoreCard}
                onPress={handleShowTop5}
                activeOpacity={0.75}
              >
                <Text style={styles.highScoreLabel}>En iyi</Text>
                <Text style={styles.highScoreValue}>{highScore}</Text>
                <Text style={styles.highScoreTap}>Top 5 →</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Butonlar ── */}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={handlePlay} activeOpacity={0.85}>
              <LinearGradient
                colors={['#6C63FF', '#4ECDC4']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>🎮  Oyna</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCompetitive} activeOpacity={0.85}>
              <LinearGradient
                colors={['#FF6B35', '#FF2D55']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>⚔️  Rekabetçi</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.6} disabled>
              <Text style={styles.secondaryButtonText}>👥  Arkadaşınla Oyna</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Yakında</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Alt aksiyonlar ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleRateApp} activeOpacity={0.75}>
              <Text style={styles.actionBtnText}>⭐ Puan Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleBugReport} activeOpacity={0.75}>
              <Text style={styles.actionBtnText}>🐛 Hata Bildir</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.copyright}>© 2026 Color Match. All rights reserved.</Text>
        </Animated.View>
      </SafeAreaView>

      {/* ── Top 5 Modal ── */}
      <Modal
        visible={showTop5}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTop5(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏆 En İyi 5 Oyun</Text>
              <TouchableOpacity onPress={() => setShowTop5(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {topScores.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Henüz kayıtlı oyun yok.</Text>
                <Text style={styles.emptySubText}>Oyna ve skoru burada gör!</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {topScores.map((rec, i) => {
                  const sc      = getScoreColor(rec.averageScore);
                  const medals  = ['🥇', '🥈', '🥉', '4.', '5.'];
                  return (
                    <View key={i} style={styles.scoreRow}>
                      <Text style={styles.scoreRank}>{medals[i]}</Text>
                      <View style={styles.scoreInfo}>
                        <Text style={[styles.scoreAvg, { color: sc }]}>
                          {rec.averageScore} ort.
                        </Text>
                        <Text style={styles.scoreDate}>{formatDate(rec.date)}</Text>
                      </View>
                      <View style={styles.scoreTotalBox}>
                        <Text style={styles.scoreTotalLabel}>Toplam</Text>
                        <Text style={[styles.scoreTotalVal, { color: sc }]}>{rec.totalScore}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe:      { flex: 1 },
  blob:      { position: 'absolute' },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },

  logoSection: { alignItems: 'center', marginBottom: SPACING.xl },
  logoGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 52, gap: 6, marginBottom: SPACING.lg },
  logoDot:  { width: 22, height: 22, borderRadius: 6 },
  title:    { color: COLORS.text, fontSize: FONT_SIZE.xxl, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, textAlign: 'center' },

  trophyRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  trophyCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1,
  },
  trophyEmoji: { fontSize: 28 },
  trophyTier:  { fontSize: FONT_SIZE.sm, fontWeight: '800', letterSpacing: 0.3 },
  trophyCount: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 2 },
  highScoreCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    borderColor: '#6C63FF44', minWidth: 80,
  },
  highScoreLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600', marginBottom: 2 },
  highScoreValue: { color: '#A78BFA', fontSize: FONT_SIZE.lg, fontWeight: '900' },
  highScoreTap:   { color: '#6C63FF99', fontSize: 10, fontWeight: '700', marginTop: 3 },

  buttons:       { gap: SPACING.md, marginBottom: SPACING.lg },
  primaryButton: { height: 56, borderRadius: RADIUS.round, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.5 },
  secondaryButton: {
    height: 52, backgroundColor: COLORS.surface, borderRadius: RADIUS.round,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: SPACING.xl, justifyContent: 'space-between', opacity: 0.55,
  },
  secondaryButtonText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  badge: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.sm, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border,
  },
  badgeText: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  actionBtn: {
    flex: 1, height: 42, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700' },

  copyright: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, textAlign: 'center', letterSpacing: 0.2 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 44, minHeight: 320,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle:   { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: '800' },
  closeBtn:     { padding: SPACING.xs },
  closeBtnText: { color: COLORS.textMuted, fontSize: FONT_SIZE.lg, fontWeight: '700' },

  emptyState:   { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText:    { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, fontWeight: '600', marginBottom: SPACING.xs },
  emptySubText: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm },

  scoreRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  scoreRank:       { fontSize: 22, width: 34, textAlign: 'center' },
  scoreInfo:       { flex: 1 },
  scoreAvg:        { fontSize: FONT_SIZE.lg, fontWeight: '900' },
  scoreDate:       { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  scoreTotalBox:   { alignItems: 'flex-end' },
  scoreTotalLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  scoreTotalVal:   { fontSize: FONT_SIZE.md, fontWeight: '800' },
});

export default HomeScreen;
