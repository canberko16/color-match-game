import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { AppSettings, saveSettings } from '../utils/settings';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

interface Props {
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
  onBack: () => void;
}

const SettingsScreen: React.FC<Props> = ({ settings, onSettingsChange, onBack }) => {

  const toggle = useCallback((key: keyof AppSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    onSettingsChange(updated);
    saveSettings(updated).catch(() => {});
  }, [settings, onSettingsChange]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ayarlar</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Ses & Titreşim */}
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

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>🔊</Text>
                <View>
                  <Text style={styles.rowTitle}>Ses Efektleri</Text>
                  <Text style={styles.rowSub}>Yakında eklenecek</Text>
                </View>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={() => toggle('soundEnabled')}
                trackColor={{ false: COLORS.border, true: '#6C63FF' }}
                thumbColor="#FFF"
                disabled
              />
            </View>
          </View>

          {/* Uygulama bilgisi */}
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
  backBtn:  { width: 70 },
  backText: { color: '#6C63FF', fontSize: FONT_SIZE.md, fontWeight: '700' },
  title:    { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: '800' },

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
  rowLeft:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  rowIcon:  { fontSize: 22 },
  rowTitle: { color: COLORS.text, fontSize: FONT_SIZE.md, fontWeight: '600' },
  rowSub:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  rowValue: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  divider:  { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.lg },
});

export default SettingsScreen;
