import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { getSettings, updateSetting, AppSettings } from '../utils/settings';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

interface Props {
  onBack: () => void;
}

const SettingsScreen: React.FC<Props> = ({ onBack }) => {
  // Cache'den senkron oku — initSettings() uygulama başında çağrıldığı için güncel
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  const toggle = useCallback((key: keyof AppSettings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    updateSetting(key, newValue).catch(() => {});
  }, [settings]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtnArea} activeOpacity={0.7}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ayarlar</Text>
          <View style={styles.backBtnArea} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Text style={styles.sectionLabel}>Ses ve Geri Bildirim</Text>
          <View style={styles.card}>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>📳</Text>
                <View>
                  <Text style={styles.rowTitle}>Titreşim</Text>
                  <Text style={styles.rowSub}>Buton ve puan geri bildirimi</Text>
                </View>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={() => toggle('hapticsEnabled')}
                trackColor={{ false: COLORS.border, true: '#6C63FF' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={[styles.row, styles.rowDisabled]}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>🔊</Text>
                <View>
                  <Text style={styles.rowTitle}>Ses Efektleri</Text>
                  <Text style={styles.rowSub}>Yakında eklenecek</Text>
                </View>
              </View>
              <Switch
                value={false}
                disabled
                trackColor={{ false: COLORS.border, true: '#6C63FF' }}
                thumbColor="#FFF"
              />
            </View>

          </View>

          <Text style={styles.sectionLabel}>Uygulama</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>🎮</Text>
                <Text style={styles.rowTitle}>Color Match</Text>
              </View>
              <Text style={styles.rowValue}>v1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>👤</Text>
                <Text style={styles.rowTitle}>Geliştirici</Text>
              </View>
              <Text style={styles.rowValue}>Canberk Akatay</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe:      { flex: 1 },
  scroll:    { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtnArea: { width: 70 },
  backText:    { color: '#6C63FF', fontSize: FONT_SIZE.md, fontWeight: '700' },
  title:       { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: '800' },

  sectionLabel: {
    color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase',
    marginTop: SPACING.xl, marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  rowDisabled: { opacity: 0.45 },
  rowLeft:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  rowIcon:  { fontSize: 22 },
  rowTitle: { color: COLORS.text, fontSize: FONT_SIZE.md, fontWeight: '600' },
  rowSub:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  rowValue: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  divider:  { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.lg },
});

export default SettingsScreen;
