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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { AuthStackParamList } from '../navigation';
import { colors, spacing, radius, typography } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const signIn = useAuthStore((s) => s.signIn);

  const mutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: async ({ token, user }) => {
      setError('');
      await signIn(token, user);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo / headline */}
        <View style={styles.headline}>
          <Text style={styles.logo}>DropAlert</Text>
          <Text style={styles.tagline}>Track Amazon prices. Get notified when they drop.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => mutation.mutate()}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, mutation.isPending && styles.btnDisabled]}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>
            New to DropAlert?{' '}
            <Text style={styles.linkAccent}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  headline: {
    gap: spacing.xs,
  },
  logo: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: typography.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: '#fff',
  },
  link: {
    textAlign: 'center',
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  linkAccent: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sm,
    textAlign: 'center',
    backgroundColor: colors.dangerDim,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
