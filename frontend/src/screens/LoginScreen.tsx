import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { GoogleLogin } from '@react-oauth/google';
import { login } from '../api/auth';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AuthStackParamList } from '../navigation';
import { colors, spacing, radius, typography } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const signIn = useAuthStore((s) => s.signIn);

  const mutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: async ({ token, user }) => {
      setError('');
      await signIn(token, user);
    },
    onError: (err: Error) => {
      if (err.message.includes('422') || err.message.includes('validation')) {
        setError('Please enter a valid email and password.');
      } else {
        setError('Invalid email or password.');
      }
    },
  });

  const googleMutation = useMutation({
    mutationFn: async (credential: string) => {
      const { data } = await apiClient.post('/auth/google', { credential });
      return data;
    },
    onSuccess: async ({ token, user }) => {
      setError('');
      await signIn(token, user);
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = () => {
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setError('');
    mutation.mutate();
  };

  return (
    <LinearGradient colors={['#0A0A12', '#0F0F1E', '#13101F']} style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient colors={['#8B7FFF', '#6C63FF', '#4F46E5']} style={styles.logoIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="trending-down" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.logoText}>DropAlert</Text>
            <Text style={styles.tagline}>Track Amazon prices. Get notified when they drop.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={17} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <LinearGradient colors={['#8B7FFF', '#6C63FF', '#4F46E5']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Sign in</Text>
                }
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.googleWrap}>
              <GoogleLogin
                onSuccess={(res) => { if (res.credential) googleMutation.mutate(res.credential); }}
                onError={() => setError('Google sign-in failed. Please try again.')}
                theme="filled_black"
                shape="rectangular"
                width="340"
                text="signin_with"
              />
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>
              Don't have an account?{' '}
              <Text style={styles.linkAccent}>Create one</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
  },
  logoSection: { alignItems: 'center', gap: spacing.sm },
  logoIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  logoText: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    backgroundColor: '#1C1C28',
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#2E2E42',
    width: '100%',
    maxWidth: 400,
  },
  cardTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerDim,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: typography.sm },
  inputGroup: { gap: 6 },
  label: { fontSize: typography.sm, fontWeight: typography.medium, color: colors.textSecondary },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131E',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#2A2A3A',
    paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: typography.base, color: colors.text, paddingVertical: 12, outlineStyle: 'none' } as any,
  eyeBtn: { padding: 4 },
  btnGradient: { borderRadius: radius.md, marginTop: spacing.xs },
  btn: { paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: typography.base, fontWeight: typography.semibold, color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A3A' },
  dividerText: { fontSize: typography.xs, color: colors.textMuted } as any,
  googleWrap: { alignItems: 'center' },
  link: { textAlign: 'center', fontSize: typography.sm, color: colors.textSecondary },
  linkAccent: { color: '#8B7FFF', fontWeight: typography.semibold },
});
