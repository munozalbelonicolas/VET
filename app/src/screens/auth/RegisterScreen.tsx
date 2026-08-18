// ============================================================
// Veterinaria La Plata — Register Screen
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, fontSizes, spacing, shadows } from '../../config/theme';
import { Button, Input, Logo } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { registerWithEmail } from '../../services/authService';
import { AuthStackParamList } from '../../types';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const { setUser } = useAuthStore();

  const validate = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};

    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Ingresá un email válido';
    }
    if (!phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    if (!password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await registerWithEmail(email, password, name, phone);
      setUser(user);
    } catch (error: any) {
      const message =
        error.code === 'auth/email-already-in-use'
          ? 'Ya existe una cuenta con ese email'
          : error.code === 'auth/weak-password'
          ? 'La contraseña es muy débil'
          : 'Error al registrarse. Intentá de nuevo.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Logo size={100} showText={false} />
        </View>

        <Text style={styles.title}>Creá tu cuenta</Text>
        <Text style={styles.subtitle}>
          Registrate para cuidar de tu mascota
        </Text>

        <View style={styles.formContainer}>
          <Input
            label="Nombre completo"
            placeholder="Ej: María González"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            error={errors.name}
            leftIcon="account-outline"
            autoCapitalize="words"
          />

          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            error={errors.email}
            leftIcon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Teléfono"
            placeholder="+54 221 555-1234"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors({ ...errors, phone: undefined });
            }}
            error={errors.phone}
            leftIcon="phone-outline"
            keyboardType="phone-pad"
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            leftIcon="lock-outline"
            isPassword
          />

          <Input
            label="Confirmar contraseña"
            placeholder="Repetí la contraseña"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
            }}
            error={errors.confirmPassword}
            leftIcon="lock-check-outline"
            isPassword
          />

          <Button
            title="Crear cuenta"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            variant="accent"
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tenés cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMain,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  },
  formContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: spacing.xl,
    ...shadows.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  loginLink: {
    fontFamily: fonts.nunito.bold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
});

export default RegisterScreen;
