import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTier, Tier } from '../utils/mmr';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // useCallback — child'a stabil referans geçer
  const handlePlay        = useCallback(() => onPlay(), [onPlay]);
  const handleCompetitive = useCallback(() => onCompetitive(), [onCompetitive]);

  const tier: Tier = getTier(trophies);

  return (
    <View style={styles.container}>
      {/* StatusBar App.tsx'te tek yerden yönetilir — burada duplicate yok */}

      {/* Arka plan renk bloblari */}
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
              <View style={styles.highScoreCard}>
                <Text style={styles.highScoreLabel}>En iyi</Text>
                <Text style={styles.highScoreValue}>{highScore}</Text>
              </View>
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

            {/* Yakında — pasif */}
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.6} disabled>
              <Text style={styles.secondaryButtonText}>👥  Arkadaşınla Oyna</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Yakında</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.copyright}>© 2026 Color Match. All rights reserved.</Text>
        </Animated.View>
      </SafeAreaView>
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
    borderColor: '#6C63FF44', minWidth: 72,
  },
  highScoreLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600', marginBottom: 2 },
  highScoreValue: { color: '#A78BFA', fontSize: FONT_SIZE.lg, fontWeight: '900' },

  buttons:       { gap: SPACING.md, marginBottom: SPACING.xl },
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

  copyright: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, textAlign: 'center', letterSpacing: 0.2 },
});

export default HomeScreen;
