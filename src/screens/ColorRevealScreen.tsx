import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Easing,
} from 'react-native';
import { RGB } from '../types';
import { rgbToString } from '../utils/colorUtils';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

interface Props {
  color: RGB;
  currentRound: number;
  totalRounds: number;
  onRevealComplete: () => void;
}

const { width, height } = Dimensions.get('window');

/** Renk bloğu boyutu — ekrana göre hesaplanır, sabit üst sınırla */
const COLOR_BLOCK_SIZE = Math.min(width - SPACING.xl * 2, height * 0.42, 320);

/** Hedef rengin gösterim süresi (ms) */
const REVEAL_DURATION  = 5000;
/** Geri sayım her adım arası süre (ms) */
const COUNTDOWN_STEP   = 900;

type Phase = 'countdown' | 'reveal' | 'done';

const ColorRevealScreen: React.FC<Props> = ({
  color,
  currentRound,
  totalRounds,
  onRevealComplete,
}) => {
  const [phase,            setPhase]            = useState<Phase>('countdown');
  const [countdownNum,     setCountdownNum]     = useState(3);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.ceil(REVEAL_DURATION / 1000)   // → 5
  );

  const progressAnim   = useRef(new Animated.Value(1)).current;
  const colorFadeAnim  = useRef(new Animated.Value(0)).current;
  const countAnim      = useRef(new Animated.Value(0)).current;
  // unmount sonrası state güncellemesini önlemek için
  const isMountedRef   = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Geri sayım fazı ──────────────────────────────────────────────────────────
  useEffect(() => {
    let count = 3;

    const animateNumber = () => {
      countAnim.setValue(0);
      Animated.spring(countAnim, {
        toValue: 1, useNativeDriver: true, tension: 80, friction: 6,
      }).start();
    };

    animateNumber();

    const interval = setInterval(() => {
      count -= 1;
      if (!isMountedRef.current) { clearInterval(interval); return; }
      if (count > 0) {
        setCountdownNum(count);
        animateNumber();
      } else {
        clearInterval(interval);
        setPhase('reveal');
      }
    }, COUNTDOWN_STEP);

    return () => clearInterval(interval);
  }, []);

  // ── Renk gösterimi fazı ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'reveal') return;

    // Renk bloğunu fade-in yap
    Animated.timing(colorFadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();

    // Progress bar tam REVEAL_DURATION boyunca Easing.linear ile azalır
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: REVEAL_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Saniyeli geri sayım: her 1000ms'de remainingSeconds -1
    setRemainingSeconds(Math.ceil(REVEAL_DURATION / 1000));
    const ticker = setInterval(() => {
      if (!isMountedRef.current) return;
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        return next < 0 ? 0 : next;
      });
    }, 1000);

    // REVEAL_DURATION sonunda geçişi tetikle
    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      clearInterval(ticker);
      setPhase('done');
      onRevealComplete();
    }, REVEAL_DURATION);

    return () => {
      clearTimeout(timer);
      clearInterval(ticker);
    };
  }, [phase]);

  const bgColor = rgbToString(color);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, COLOR_BLOCK_SIZE],
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* ── Round göstergesi ── */}
        <View style={styles.header}>
          <Text style={styles.roundText}>
            Round {currentRound} / {totalRounds}
          </Text>
        </View>

        {/* ── Geri sayım ── */}
        {phase === 'countdown' && (
          <View style={styles.countdownWrapper}>
            <Text style={styles.countdownLabel}>Hazır ol…</Text>
            <Animated.Text
              style={[
                styles.countdownNumber,
                {
                  opacity: countAnim,
                  transform: [{
                    scale: countAnim.interpolate({
                      inputRange: [0, 1], outputRange: [0.5, 1],
                    }),
                  }],
                },
              ]}
            >
              {countdownNum}
            </Animated.Text>
          </View>
        )}

        {/* ── Renk gösterimi ── */}
        {phase === 'reveal' && (
          <Animated.View style={[styles.revealWrapper, { opacity: colorFadeAnim }]}>
            <Text style={styles.instruction}>Rengi hatırla!</Text>

            <View style={[styles.colorBlock, { backgroundColor: bgColor }]} />

            <View style={styles.timerSection}>
              <View style={[styles.timerTrack, { width: COLOR_BLOCK_SIZE }]}>
                <Animated.View style={[styles.timerFill, { width: progressWidth }]} />
              </View>
              {/* Kalan süreyi saniye cinsinden göster */}
              <Text style={styles.timerLabel}>
                {remainingSeconds} saniye
              </Text>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe:      { flex: 1 },

  header: { alignItems: 'center', paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  roundText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, fontWeight: '700', letterSpacing: 0.5 },

  // Geri sayım
  countdownWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  countdownLabel:   { color: COLORS.textSecondary, fontSize: FONT_SIZE.lg, fontWeight: '600', marginBottom: SPACING.xl, letterSpacing: 0.5 },
  countdownNumber:  { color: COLORS.text, fontSize: 120, fontWeight: '900', lineHeight: 130 },

  // Renk gösterimi — dikey ortalanmış, timer her zaman altında
  revealWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  instruction: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: '700', letterSpacing: 0.3 },
  colorBlock: {
    width: COLOR_BLOCK_SIZE,
    height: COLOR_BLOCK_SIZE,
    borderRadius: RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  timerSection: { width: '100%', alignItems: 'center', gap: SPACING.xs },
  timerTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.round, overflow: 'hidden' },
  timerFill:  { height: '100%', backgroundColor: '#6C63FF', borderRadius: RADIUS.round },
  timerLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600' },
});

export default ColorRevealScreen;
