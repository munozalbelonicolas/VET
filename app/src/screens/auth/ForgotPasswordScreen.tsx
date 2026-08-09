// ============================================================
// Veterinaria La Plata — Forgot Password Screen
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { colors, fonts, fontSizes, spacing, shadows } from '../../config/theme';
import { Button, Input } from '../../components/ui';
import { resetPassword } from '../../services/authService';
import { AuthStackParamList } from '../../types';

type ForgotPasswordProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

const ForgotPasswordScreen: React.FC<ForgotPasswordProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Ingresá tu email');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Ingresá un email válido');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', 'No pudimos enviar el email. Verificá la dirección.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          {/* Check animation SVG */}
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Circle cx="60" cy="60" r="55" fill={colors.successSoft} stroke={colors.success} strokeWidth="3" />
            <G transform="translate(60, 60)">
              <Path
                d="M-20,5 L-8,17 L22,-15"
                stroke={colors.success}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </G>
          </Svg>

          <Text style={styles.successTitle}>¡Email enviado! 📧</Text>
          <Text style={styles.successText}>
            Revisá tu bandeja de entrada en{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
            {'\n\n'}Seguí las instrucciones para restablecer tu contraseña.
          </Text>

          <Button
            title="Volver al login"
            onPress={() => navigation.navigate('Login')}
            fullWidth
            size="lg"
            style={{ marginTop: spacing['2xl'] }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Lock illustration */}
        <View style={styles.illustrationContainer}>
          <Svg width={100} height={100} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill={colors.primarySoft} />
            <G transform="translate(50, 50)">
              <Path
                d="M-12,-8 L-12,-18 C-12,-28 -4,-35 0,-35 C4,-35 12,-28 12,-18 L12,-8"
                stroke={colors.primary}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M-18,-8 L18,-8 L18,18 Q18,22 14,22 L-14,22 Q-18,22 -18,18 Z"
                fill={colors.primary}
              />
              <Circle cx="0" cy="6" r="4" fill={colors.bgCard} />
              <Path d="M-2,6 L-2,14 L2,14 L2,6" fill={colors.bgCard} />
            </G>
          </Svg>
        </View>

        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
        <Text style={styles.subtitle}>
          Ingresá tu email y te enviaremos instrucciones para restablecerla.
        </Text>

        <View style={styles.formContainer}>
          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            error={error}
            leftIcon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button
            title="Enviar instrucciones"
            onPress={handleReset}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>

        <Button
          title="← Volver al login"
          onPress={() => navigation.goBack()}
          variant="ghost"
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMain,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.quicksand.bold,
    fontSize: fontSizes['2xl'],
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: spacing.xl,
    ...shadows.lg,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successTitle: {
    fontFamily: fonts.quicksand.bold,
    fontSize: fontSizes['2xl'],
    color: colors.textDark,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  successText: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailHighlight: {
    fontFamily: fonts.nunito.bold,
    color: colors.primary,
  },
});

export default ForgotPasswordScreen;
