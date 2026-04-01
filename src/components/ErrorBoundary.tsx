import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants/theme';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Uygulama genelinde beklenmeyen hataları yakalar.
 * Kullanıcıya düzgün bir hata ekranı gösterir, crash'i önler.
 * App Store red riskini azaltır.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Yakalandı:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <SafeAreaView style={styles.safe}>
            <View style={styles.content}>
              <Text style={styles.emoji}>😵</Text>
              <Text style={styles.title}>Bir şeyler ters gitti</Text>
              <Text style={styles.message}>
                Beklenmeyen bir hata oluştu. Lütfen tekrar dene.
              </Text>
              <TouchableOpacity
                onPress={this.handleReset}
                style={styles.button}
                activeOpacity={0.75}
              >
                <Text style={styles.buttonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe:      { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emoji:   { fontSize: 64 },
  title:   { color: COLORS.text, fontSize: FONT_SIZE.xl, fontWeight: '800' },
  message: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, textAlign: 'center', lineHeight: 22 },
  button: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
  },
  buttonText: { color: COLORS.text, fontSize: FONT_SIZE.md, fontWeight: '700' },
});

export default ErrorBoundary;
