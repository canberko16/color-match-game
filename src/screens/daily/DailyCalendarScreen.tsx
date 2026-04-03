import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { DailyCalendarDay } from '../../types';
import { getCalendarData, isDayPlayable } from '../../utils/dailyStorage';
import { adService } from '../../services/adService';
import { unlockDay } from '../../utils/dailyStorage';
import CalendarGrid from '../../components/CalendarGrid';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../constants/theme';

interface Props {
  onPlayDay: (dateKey: string) => void;
  onViewResult: (dateKey: string) => void;
  onBack: () => void;
}

const MONTH_NAMES = [
  'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
  'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik',
];

const DailyCalendarScreen: React.FC<Props> = ({ onPlayDay, onViewResult, onBack }) => {
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [days, setDays]     = useState<DailyCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [adLoading, setAdLoading] = useState(false);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    const data = await getCalendarData(year, month);
    setDays(data);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const handlePrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const handleNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const handleDayPress = useCallback(async (day: DailyCalendarDay) => {
    // Oynanmis gun → sonucu goster
    if (day.status === 'played' || day.status === 'today_played') {
      onViewResult(day.dateKey);
      return;
    }

    const { playable, needsAd } = await isDayPlayable(day.dateKey);
    if (!playable) return;

    if (needsAd) {
      Alert.alert(
        'Gecmis Challenge',
        'Bu gunu acmak icin kisa bir reklam izlemen gerekiyor.',
        [
          { text: 'Vazgec', style: 'cancel' },
          {
            text: 'Reklam Izle',
            onPress: async () => {
              setAdLoading(true);
              const rewarded = await adService.showRewardedAd();
              setAdLoading(false);
              if (rewarded) {
                await unlockDay(day.dateKey);
                onPlayDay(day.dateKey);
              }
            },
          },
        ]
      );
      return;
    }

    onPlayDay(day.dateKey);
  }, [onPlayDay, onViewResult]);

  // Oynanmis gun sayisi
  const playedCount = days.filter(
    (d) => d.status === 'played' || d.status === 'today_played'
  ).length;
  const totalDays = days.filter((d) => d.dayNum > 0 && d.status !== 'future' && d.status !== 'locked').length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Gunluk Challenge</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Ay navigasyonu */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
            <Text style={styles.navText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
            <Text style={styles.navText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: totalDays > 0 ? `${(playedCount / totalDays) * 100}%` : '0%' },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {playedCount} / {totalDays} gun oynandi
          </Text>
        </View>

        {/* Takvim */}
        {loading ? (
          <ActivityIndicator color="#6C63FF" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.calendarWrapper}>
            <CalendarGrid days={days} onDayPress={handleDayPress} />
          </View>
        )}

        {/* Lejant */}
        <View style={styles.legend}>
          <LegendItem color="#6C63FF" label="Bugun" />
          <LegendItem color="#4CAF50" label="Oynandi" />
          <LegendItem color="#FF6B35" label="Kacirildi" />
          <LegendItem color={COLORS.textMuted} label="Kilitli" />
        </View>

        {/* Reklam yukleniyor overlay */}
        {adLoading && (
          <View style={styles.adOverlay}>
            <View style={styles.adBox}>
              <ActivityIndicator color="#FFF" size="large" />
              <Text style={styles.adText}>Reklam yukleniyor...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1, paddingHorizontal: SPACING.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  backText: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  title: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: '800' },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  navText: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginTop: -2 },
  monthLabel: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: '800' },

  progressSection: { marginBottom: SPACING.md, gap: SPACING.xs },
  progressTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.round, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: RADIUS.round },
  progressText: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600', textAlign: 'center' },

  calendarWrapper: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },

  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg,
    marginTop: SPACING.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600' },

  adOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  adBox: { alignItems: 'center', gap: SPACING.md },
  adText: { color: '#FFF', fontSize: FONT_SIZE.md, fontWeight: '700' },
});

export default DailyCalendarScreen;
