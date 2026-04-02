import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  Easing,
} from 'react-native';
import { getTier } from '../../utils/mmr';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../constants/theme';

/** Rakip arama zaman aşımı (ms) — bu süre dolunca arama iptal edilir */
const MATCHMAKING_TIMEOUT_MS = 30_000;

interface Props {
  trophies: number;
  onCancel: () => void;
  /** true = oyun bitti, rakibin bitmesi bekleniyor */
  waitingForOpponent?: boolean;
}

const MatchmakingScreen: React.FC<Props> = ({
  trophies,
  onCancel,
  waitingForOpponent = false,
}) => {
  const tier = getTier(trophies);

  const [timedOut, setTimedOut] = useState(false);
  const [elapsed,  setElapsed]  = useState(0); // saniye cinsinden geçen süre

  // Animasyon ref'leri
  const pulse1   = useRef(new Animated.Value(0)).current;
  const pulse2   = useRef(new Animated.Value(0)).current;
  const pulse3   = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Giriş animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();

    // Döndürme animasyonu
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true,
      })
    );
    spinLoop.start();

    // Nabız halkaları — staggered
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const p1 = createPulse(pulse1, 0);
    const p2 = createPulse(pulse2, 400);
    const p3 = createPulse(pulse3, 800);
    p1.start(); p2.start(); p3.start();

    // Geçen süre sayacı (saniye)
    const ticker = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Zaman aşımı — UI'da göster, 3 saniye sonra otomatik iptal et
    const timeout = setTimeout(() => {
      if (waitingForOpponent) return; // rakip bekleme modunda timeout uygulanmaz
      setTimedOut(true);
      setTimeout(() => onCancel(), 3000);
    }, MATCHMAKING_TIMEOUT_MS);

    // Tüm animasyonları ve timer'ları temizle
    return () => {
      spinLoop.stop();
      p1.stop(); p2.stop(); p3.stop();
      clearInterval(ticker);
      clearTimeout(timeout);
    };
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const pulseStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
  });

  const elapsedStr = elapsed >= 60
    ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
    : `${elapsed}s`;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* ── Başlık ── */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {waitingForOpponent ? 'Rakip Bekleniyor' : 'Rakip Aranıyor'}
            </Text>
            <Text style={styles.subtitle}>
              {timedOut
                ? 'Uygun rakip bulunamadı. Tekrar denemek ister misin?'
                : waitingForOpponent
                  ? 'Rakibinin oyunu bitirmesini bekliyorsun…'
                  : 'Seninle eşleşecek biri aranıyor…'}
            </Text>
            {!timedOut && (
              <Text style={styles.elapsed}>{elapsedStr}</Text>
            )}
          </View>

          {/* ── Nabız animasyonu ── */}
          <View style={styles.pulseWrapper}>
            <Animated.View style={[styles.pulseRing, pulseStyle(pulse1)]} />
            <Animated.View style={[styles.pulseRing, pulseStyle(pulse2)]} />
            <Animated.View style={[styles.pulseRing, pulseStyle(pulse3)]} />
            <View style={styles.centerCircle}>
              <Animated.Text style={[styles.centerEmoji, { transform: [{ rotate: spin }] }]}>
                {timedOut ? '⏱️' : '⚔️'}
              </Animated.Text>
            </View>
          </View>

          {/* ── Kupa / kademe bilgisi ── */}
          <View style={[styles.trophyCard, { borderColor: tier.color + '55' }]}>
            <Text style={styles.trophyEmoji}>{tier.emoji}</Text>
            <View>
              <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
              <Text style={styles.trophyCount}>{trophies} kupa</Text>
            </View>
            {!timedOut && <SearchingDots />}
          </View>

          {/* ── İptal / Tekrar Dene ── */}
          <TouchableOpacity onPress={onCancel} activeOpacity={0.75} style={styles.cancelButton}>
            <Text style={styles.cancelText}>
              {timedOut ? 'Geri Dön' : 'İptal'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

/** Animasyonlu bekleme noktaları */
const SearchingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const bounce = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );

    const b1 = bounce(dot1, 0);
    const b2 = bounce(dot2, 200);
    const b3 = bounce(dot3, 400);
    b1.start(); b2.start(); b3.start();

    return () => { b1.stop(); b2.stop(); b3.stop(); };
  }, []);

  return (
    <View style={dotStyles.row}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[dotStyles.dot, { opacity: d }]} />
      ))}
    </View>
  );
};

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, marginLeft: 'auto', alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.textMuted },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe:      { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
  },

  header:   { alignItems: 'center', gap: SPACING.xs },
  title:    { color: COLORS.text, fontSize: FONT_SIZE.xl, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center' },
  elapsed:  { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, fontWeight: '700', marginTop: 4 },

  pulseWrapper: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  pulseRing: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: '#FF6B35',
  },
  centerCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FF6B3522', borderWidth: 2, borderColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center',
  },
  centerEmoji: { fontSize: 32 },

  trophyCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, width: '100%',
  },
  trophyEmoji: { fontSize: 32 },
  tierName:    { fontSize: FONT_SIZE.md, fontWeight: '800', letterSpacing: 0.3 },
  trophyCount: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 2 },

  cancelButton: {
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.round, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, fontWeight: '700' },
});

export default MatchmakingScreen;
