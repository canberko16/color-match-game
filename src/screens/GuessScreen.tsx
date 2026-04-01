import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RGB, RoundResult } from '../types';
import { rgbToString } from '../utils/colorUtils';
import RGBSlider from '../components/RGBSlider';
import RoundHistory from '../components/RoundHistory';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

interface Props {
  currentRound: number;
  totalRounds: number;
  previousRounds: RoundResult[];
  onConfirm: (guess: RGB) => void;
}

const GuessScreen: React.FC<Props> = ({
  currentRound,
  totalRounds,
  previousRounds,
  onConfirm,
}) => {
  const [r, setR] = useState(128);
  const [g, setG] = useState(128);
  const [b, setB] = useState(128);
  const [isSubmitting, setIsSubmitting] = useState(false); // double-tap önleme

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Slider callback'leri — useCallback ile sabitlenmiş (RGBSlider memo'lu)
  const handleR = useCallback((v: number) => setR(v), []);
  const handleG = useCallback((v: number) => setG(v), []);
  const handleB = useCallback((v: number) => setB(v), []);

  const guessColor = rgbToString({ r, g, b });

  const handleConfirm = useCallback(() => {
    if (isSubmitting) return; // çift tıklama engeli
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onConfirm({ r: Math.round(r), g: Math.round(g), b: Math.round(b) });
  }, [isSubmitting, r, g, b, onConfirm]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.roundText}>
                Round {currentRound} / {totalRounds}
              </Text>
              <Text style={styles.title}>Rengi tahmin et</Text>
            </View>

            {/* ── Canlı renk önizleme ── */}
            <View style={styles.previewSection}>
              <View style={[styles.previewBlock, { backgroundColor: guessColor }]} />
              <View style={styles.rgbValues}>
                <Text style={styles.rgbChip}>R {Math.round(r)}</Text>
                <Text style={styles.rgbChip}>G {Math.round(g)}</Text>
                <Text style={styles.rgbChip}>B {Math.round(b)}</Text>
              </View>
            </View>

            {/* ── Slider'lar ── */}
            <View style={styles.sliderCard}>
              <RGBSlider label="Red"   value={r} trackColor={COLORS.red}   onChange={handleR} />
              <RGBSlider label="Green" value={g} trackColor={COLORS.green} onChange={handleG} />
              <RGBSlider label="Blue"  value={b} trackColor={COLORS.blue}  onChange={handleB} />
            </View>

            {/* ── Önceki roundlar ── */}
            {previousRounds.length > 0 && (
              <View style={styles.historyCard}>
                <Text style={styles.historyTitle}>Önceki roundlar</Text>
                <RoundHistory rounds={previousRounds} totalRounds={totalRounds} />
              </View>
            )}

            {/* ── Onayla butonu ── */}
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? ['#555', '#555'] : ['#6C63FF', '#4ECDC4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>
                  {isSubmitting ? 'Gönderiliyor…' : 'Tahmini Onayla'}
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
  safe:      { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },

  header: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  roundText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  previewSection: { alignItems: 'center', marginBottom: SPACING.lg },
  previewBlock: {
    width: 150,
    height: 150,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  rgbValues: { flexDirection: 'row', gap: SPACING.sm },
  rgbChip: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    overflow: 'hidden',
  },

  sliderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },

  confirmButton: {
    height: 58,
    borderRadius: RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default GuessScreen;
