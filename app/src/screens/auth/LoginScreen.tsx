// ============================================================
// Veterinaria La Plata — Login Screen
// ============================================================
import React, { useState, useEffect } from 'react';
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
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { colors, fonts, fontSizes, spacing, shadows } from '../../config/theme';
import { Button, Input, Logo } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { loginWithEmail, loginWithGoogleCredential, mockLogin } from '../../services/authService';
import { AuthStackParamList } from '../../types';
import { auth } from '../../config/firebase';
import { signInAnonymously } from 'firebase/auth';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { setUser } = useAuthStore();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Ingresá un email válido';
    }

    if (!password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Try mock login first (for development)
      const mockUser = mockLogin(email);
      if (mockUser) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.log('Error in anonymous auth:', e);
        }
        setUser(mockUser);
        return;
      }

      // Try Firebase login
      const user = await loginWithEmail(email, password);
      setUser(user);
    } catch (error: any) {
      const message =
        error.code === 'auth/user-not-found'
          ? 'No existe una cuenta con ese email'
          : error.code === 'auth/wrong-password'
          ? 'Contraseña incorrecta'
          : error.code === 'auth/invalid-credential'
          ? 'Credenciales inválidas'
          : 'Error al iniciar sesión. Intentá de nuevo.';

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) {
        throw new Error('No se obtuvo el token de Google');
      }

      const user = await loginWithGoogleCredential(idToken);
      setUser(user);
    } catch (error: any) {
      if (error.code !== 'ASYNC_OP_IN_PROGRESS' && error.code !== '12501') {
        Alert.alert('Error con Google Sign-In', error.message || 'Ocurrió un error al iniciar sesión con Google.');
      }
    } finally {
      setGoogleLoading(false);
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Logo size={140} showText={true} />
        </View>

        {/* Welcome text */}
        <Text style={styles.welcomeTitle}>¡Hola de nuevo! 🐾</Text>
        <Text style={styles.welcomeSubtitle}>
          Iniciá sesión para cuidar a tu mascota
        </Text>

        {/* Form */}
        <View style={styles.formContainer}>
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
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            placeholder="Tu contraseña"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            leftIcon="lock-outline"
            isPassword
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <Button
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.loginButton}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <Button
            title="Continuar con Google"
            onPress={handleGoogleLogin}
            loading={googleLoading}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>

        {/* Register link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>¿No tenés cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Registrate</Text>
          </TouchableOpacity>
        </View>

        {/* Dev accounts info */}
        <View style={styles.devInfo}>
          <Text style={styles.devInfoTitle}>🧪 Cuentas de prueba:</Text>
          <Text style={styles.devInfoText}>cliente@mascota.com (cliente)</Text>
          <Text style={styles.devInfoText}>vet@soyvet.com (veterinario)</Text>
          <Text style={styles.devInfoText}>peluquero@pelu.com (peluquero)</Text>
          <Text style={styles.devInfoText}>recep@admin.com (recepcionista)</Text>
          <Text style={styles.devInfoText}>admin@soyveterinario.com (admin)</Text>
          <Text style={styles.devInfoHint}>Contraseña: cualquiera (6+ chars)</Text>
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
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    fontFamily: fonts.quicksand.bold,
    fontSize: fontSizes['2xl'],
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  formContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: spacing.xl,
    ...shadows.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontFamily: fonts.nunito.semiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginHorizontal: spacing.lg,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerText: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  registerLink: {
    fontFamily: fonts.nunito.bold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  devInfo: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    alignItems: 'center',
  },
  devInfoTitle: {
    fontFamily: fonts.nunito.bold,
    fontSize: fontSizes.sm,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  devInfoText: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  devInfoHint: {
    fontFamily: fonts.nunito.semiBold,
    fontSize: fontSizes.xs,
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
});

export default LoginScreen;
