import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Alert,
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
  onHome: () => void;
}

const { width, height } = Dimensions.get('window');
const COLOR_BLOCK_SIZE = Math.min(width - SPACING.xl * 2, height * 0.42, 320);
const REVEAL_DURATION  = 5000;
const COUNTDOWN_STEP   = 900;

type Phase = 'countdown' | 'reveal' | 'done';

const ColorRevealScreen: React.FC<Props> = ({
  color,
  currentRound,
  totalRounds,
  onRevealComplete,
  onHome,
}) => {
  const [phase,            setPhase]            = useState<Phase>('countdown');
  const [countdownNum,     setCountdownNum]     = useState(3);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(REVEAL_DURATION / 1000));

  const progressAnim  = useRef(new Animated.Value(1)).current;
  const colorFadeAnim = useRef(new Animated.Value(0)).current;
  const countAnim     = useRef(new Animated.Value(0)).current;
  const isMountedRef  = useRef(true);

  useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

  const handleHome = useCallback(() => {
    Alert.alert(
      'Oyundan Çık',
      'Ana sayfaya dönersen oyun ilerlemen kaydedilmeyecek.',
      [
        { text: 'Devam Et', style: 'cancel' },
        { text: 'Ana Sayfa', style: 'destructive', onPress: onHome },
      ]
    );
  }, [onHome]);

  // Geri sayım fazı
  useEffect(() => {
    let count = 3;
    const animateNumber = () => {
      countAnim.setValue(0);
      Animated.spring(countAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }).start();
    };
    animateNumber();
    const interval = setInterval(() => {
      count -= 1;
      if (!isMountedRef.current) { clearInterval(interval); return; }
      if (count > 0) { setCountdownNum(count); animateNumber(); }
      else { clearInterval(interval); setPhase('reveal'); }
    }, COUNTDOWN_STEP);
    return () => clearInterval(interval);
  }, []);

  // Renk gösterimi fazı
  useEffect(() => {
    if (phase !== 'reveal') return;
    Animated.timing(colorFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.timing(progressAnim, {
      toValue: 0, duration: REVEAL_DURATION, easing: Easing.linear, useNativeDriver: false,
    }).start();
    setRemainingSeconds(Math.ceil(REVEAL_DURATION / 1000));
    const ticker = setInterval(() => {
      if (!isMountedRef.current) return;
      setRemainingSeconds(prev => { const n = prev - 1; return n < 0 ? 0 : n; });
    }, 1000);
    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      clearInterval(ticker);
      setPhase('done');
      onRevealComplete();
    }, REVEAL_DURATION);
    return () => { clearTimeout(timer); clearInterval(ticker); };
  }, [phase]);

  const bgColor = rgbToString(color);
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, COLOR_BLOCK_SIZE] });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.roundText}>Round {currentRound} / {totalRounds}</Text>
          <TouchableOpacity onPress={handleHome} style={styles.homeBtn} activeOpacity={0.7}>
            <Text style={styles.homeBtnText}>🏠</Text>
          </TouchableOpacity>
        </View>

        {phase === 'countdown' && (
          <View style={styles.countdownWrapper}>
            <Text style={styles.countdownLabel}>Hazır ol…</Text>
            <Animated.Text
              style={[styles.countdownNumber, {
                opacity: countAnim,
                transform: [{ scale: countAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
              }]}
            >
              {countdownNum}
            </Animated.Text>
          </View>
        )}

        {phase === 'reveal' && (
          <Animated.View style={[styles.revealWrapper, { opacity: colorFadeAnim }]}>
            <Text style={styles.instruction}>Rengi hatırla!</Text>
            <View style={[styles.colorBlock, { backgroundColor: bgColor }]} />
            <View style={styles.timerSection}>
              <View style={[styles.timerTrack, { width: COLOR_BLOCK_SIZE }]}>
                <Animated.View style={[styles.timerFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.timerLabel}>{remainingSeconds} saniye</Text>
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

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: SPACING.lg, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md,
    position: 'relative',
  },
  roundText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, fontWeight: '700', letterSpacing: 0.5 },
  homeBtn: {
    position: 'absolute', right: SPACING.xl, top: SPACING.lg,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  homeBtnText: { fontSize: 16 },

  countdownWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  countdownLabel:   { color: COLORS.textSecondary, fontSize: FONT_SIZE.lg, fontWeight: '600', marginBottom: SPACING.xl, letterSpacing: 0.5 },
  countdownNumber:  { color: COLORS.text, fontSize: 120, fontWeight: '900', lineHeight: 130 },

  revealWrapper: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl, gap: SPACING.lg,
  },
  instruction: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: '700', letterSpacing: 0.3 },
  colorBlock: {
    width: COLOR_BLOCK_SIZE, height: COLOR_BLOCK_SIZE, borderRadius: RADIUS.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  timerSection: { width: '100%', alignItems: 'center', gap: SPACING.xs },
  timerTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.round, overflow: 'hidden' },
  timerFill:  { height: '100%', backgroundColor: '#6C63FF', borderRadius: RADIUS.round },
  timerLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600' },
});

export default ColorRevealScreen;
