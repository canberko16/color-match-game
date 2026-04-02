import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  ScrollView,
  Modal,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoundResult, RGB } from '../types';
import {
  rgbToHex,
  rgbToString,
  getScoreComment,
  getScoreEmoji,
  getScoreColor,
} from '../utils/colorUtils';
import ColorSwatch from '../components/ColorSwatch';
import RoundHistory from '../components/RoundHistory';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

const { height: SCREEN_H } = Dimensions.get('window');

type ZoomSide = 'target' | 'guess';

interface Props {
  result: RoundResult;
  allRounds: RoundResult[];
  totalRounds: number;
  isLastRound: boolean;
  onNext: () => void;
  onHome: () => void;
}

const RoundResultScreen: React.FC<Props> = ({
  result,
  allRounds,
  totalRounds,
  isLastRound,
  onNext,
  onHome,
}) => {
  const { targetColor, guessedColor, score, round } = result;

  const [displayScore, setDisplayScore] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Zoom state
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomSide, setZoomSide]       = useState<ZoomSide>('target');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const zoomSlide = useRef(new Animated.Value(SCREEN_H)).current;

  // Ref'ler sayesinde panResponder oluşturma sırasındaki closure sorunu çözülür
  const zoomSlideRef = useRef(zoomSlide);

  const closeZoom = useCallback(() => {
    Animated.timing(zoomSlide, {
      toValue: SCREEN_H, duration: 280, useNativeDriver: true,
    }).start(() => setZoomVisible(false));
  }, [zoomSlide]);

  const closeZoomRef = useRef(closeZoom);
  useEffect(() => { closeZoomRef.current = closeZoom; }, [closeZoom]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) zoomSlideRef.current.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          closeZoomRef.current();
        } else {
          Animated.spring(zoomSlideRef.current, {
            toValue: 0, useNativeDriver: true, tension: 60, friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const openZoom = useCallback((side: ZoomSide) => {
    setZoomSide(side);
    setZoomVisible(true);
    zoomSlide.setValue(SCREEN_H);
    Animated.spring(zoomSlide, {
      toValue: 0, useNativeDriver: true, tension: 55, friction: 9,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [zoomSlide]);

  const toggleZoomSide = useCallback(() => {
    setZoomSide(prev => prev === 'target' ? 'guess' : 'target');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

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

  useEffect(() => {
    if (score >= 80) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else if (score >= 50) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
    ]).start();

    if (score === 0) { setDisplayScore(0); return; }

    let current = 0;
    const step = Math.max(1, Math.ceil(score / 30));
    const interval = setInterval(() => {
      current += step;
      if (current >= score) { setDisplayScore(score); clearInterval(interval); }
      else setDisplayScore(current);
    }, 20);
    return () => clearInterval(interval);
  }, [score]);

  const handleNext = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    onNext();
  }, [isNavigating, onNext]);

  const scoreColor   = getScoreColor(score);
  const zoomColor    = zoomSide === 'target' ? targetColor : guessedColor;
  const zoomLabel    = zoomSide === 'target' ? 'Gerçek Renk' : 'Tahminin';
  const swapLabel    = zoomSide === 'target' ? 'Tahmini Gör' : 'Gerçeği Gör';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.roundLabel}>Round {round} / {totalRounds}</Text>
              <Text style={styles.title}>Sonuç</Text>
              <TouchableOpacity onPress={handleHome} style={styles.homeBtn} activeOpacity={0.7}>
                <Text style={styles.homeBtnText}>🏠</Text>
              </TouchableOpacity>
            </View>

            {/* ── Skor kartı ── */}
            <Animated.View style={[styles.scoreCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={[styles.scoreBadge, { borderColor: scoreColor + '60' }]}>
                <Text style={[styles.scoreNumber, { color: scoreColor }]}>{displayScore}</Text>
                <Text style={[styles.scoreMax,    { color: scoreColor + 'AA' }]}> / 100</Text>
              </View>
              <Text style={styles.scoreEmoji}>{getScoreEmoji(score)}</Text>
              <Text style={[styles.scoreComment, { color: scoreColor }]}>{getScoreComment(score)}</Text>
            </Animated.View>

            {/* ── Renk karşılaştırması ── */}
            <View style={styles.comparisonSection}>
              <Text style={styles.sectionTitle}>Renk karşılaştırması</Text>
              <View style={styles.swatchRow}>
                <TouchableOpacity style={styles.swatchItem} activeOpacity={0.8}
                  onPress={() => openZoom('target')}>
                  <ColorSwatch color={targetColor} size={130} animateIn />
                  <Text style={styles.swatchLabel}>Gerçek</Text>
                  <Text style={styles.swatchHex}>{rgbToHex(targetColor)}</Text>
                  <Text style={styles.swatchRGB}>{targetColor.r} · {targetColor.g} · {targetColor.b}</Text>
                  <Text style={styles.swatchTap}>büyüt →</Text>
                </TouchableOpacity>

                <View style={styles.vsDivider}>
                  <Text style={styles.vsText}>vs</Text>
                </View>

                <TouchableOpacity style={styles.swatchItem} activeOpacity={0.8}
                  onPress={() => openZoom('guess')}>
                  <ColorSwatch color={guessedColor} size={130} animateIn />
                  <Text style={styles.swatchLabel}>Tahminin</Text>
                  <Text style={styles.swatchHex}>{rgbToHex(guessedColor)}</Text>
                  <Text style={styles.swatchRGB}>{guessedColor.r} · {guessedColor.g} · {guessedColor.b}</Text>
                  <Text style={styles.swatchTap}>büyüt →</Text>
                </TouchableOpacity>
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
                colors={['#6C63FF', '#4ECDC4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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

      {/* ── Renk Zoom Modal ── */}
      <Modal visible={zoomVisible} transparent animationType="none" onRequestClose={closeZoom}>
        <Animated.View
          style={[styles.zoomOverlay, { transform: [{ translateY: zoomSlide }] }]}
          {...panResponder.panHandlers}
        >
          <SafeAreaView style={styles.zoomSafe}>
            {/* Top bar */}
            <View style={styles.zoomTopBar}>
              <View style={styles.zoomHandle} />
              <TouchableOpacity onPress={closeZoom} style={styles.zoomCloseBtn}>
                <Text style={styles.zoomCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Renk bloğu */}
            <View style={styles.zoomColorWrapper}>
              <View style={[styles.zoomColorBlock, { backgroundColor: rgbToString(zoomColor) }]} />

              {/* Swap butonu — sağ alt köşe */}
              <TouchableOpacity style={styles.swapBtn} onPress={toggleZoomSide} activeOpacity={0.85}>
                <Text style={styles.swapBtnText}>⇄ {swapLabel}</Text>
              </TouchableOpacity>
            </View>

            {/* Bilgiler */}
            <View style={styles.zoomInfo}>
              <Text style={styles.zoomLabel}>{zoomLabel}</Text>
              <Text style={styles.zoomHex}>{rgbToHex(zoomColor)}</Text>
              <Text style={styles.zoomRGB}>
                R {zoomColor.r}  ·  G {zoomColor.g}  ·  B {zoomColor.b}
              </Text>
            </View>
            <Text style={styles.zoomHint}>Aşağı kaydır veya ✕ ile kapat</Text>
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe:      { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },

  header: { alignItems: 'center', paddingTop: SPACING.lg, marginBottom: SPACING.lg, position: 'relative' },
  roundLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700', letterSpacing: 0.5, marginBottom: SPACING.xs },
  title:      { color: COLORS.text, fontSize: FONT_SIZE.xl, fontWeight: '800', letterSpacing: -0.3 },
  homeBtn: {
    position: 'absolute', right: 0, top: SPACING.lg,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  homeBtnText: { fontSize: 16 },

  scoreCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  scoreBadge: {
    flexDirection: 'row', alignItems: 'flex-end', marginBottom: SPACING.md,
    borderWidth: 2, borderRadius: RADIUS.round, paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm, backgroundColor: COLORS.surfaceElevated,
  },
  scoreNumber:  { fontSize: FONT_SIZE.giant, fontWeight: '900', lineHeight: 80 },
  scoreMax:     { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: 10, marginLeft: 4 },
  scoreEmoji:   { fontSize: 36, marginBottom: SPACING.xs },
  scoreComment: { fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.3 },

  comparisonSection: { marginBottom: SPACING.lg },
  sectionTitle: {
    color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '700',
    letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: SPACING.lg,
  },
  swatchRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  swatchItem:  { alignItems: 'center', flex: 1, gap: SPACING.xs },
  swatchLabel: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: '700', marginTop: SPACING.xs },
  swatchHex:   { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  swatchRGB:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
  swatchTap:   { color: '#6C63FF99', fontSize: 10, fontWeight: '700' },
  vsDivider:   { width: 36, alignItems: 'center' },
  vsText:      { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, fontWeight: '800', letterSpacing: 1 },

  historyCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  nextButton:     { height: 58, borderRadius: RADIUS.round, justifyContent: 'center', alignItems: 'center' },
  nextButtonText: { color: '#FFF', fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.5 },

  // Zoom modal
  zoomOverlay: { flex: 1, backgroundColor: COLORS.background },
  zoomSafe:    { flex: 1 },
  zoomTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, position: 'relative',
  },
  zoomHandle: {
    width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center',
  },
  zoomCloseBtn: {
    position: 'absolute', right: SPACING.lg,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  zoomCloseText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, fontWeight: '700' },

  zoomColorWrapper: {
    marginHorizontal: SPACING.xl, flex: 1, maxHeight: 380, minHeight: 220, position: 'relative',
  },
  zoomColorBlock: { flex: 1, borderRadius: RADIUS.xl },

  // Swap butonu — sağ alt köşe
  swapBtn: {
    position: 'absolute', bottom: SPACING.md, right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  swapBtnText: { color: '#FFF', fontSize: FONT_SIZE.xs, fontWeight: '800' },

  zoomInfo:  { alignItems: 'center', paddingVertical: SPACING.lg, gap: SPACING.xs },
  zoomLabel: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: '800' },
  zoomHex:   { color: COLORS.textSecondary, fontSize: FONT_SIZE.xl, fontWeight: '700', letterSpacing: 2 },
  zoomRGB:   { color: COLORS.textMuted, fontSize: FONT_SIZE.md, letterSpacing: 1 },
  zoomHint:  { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, textAlign: 'center', paddingBottom: SPACING.xl },
});

export default RoundResultScreen;
