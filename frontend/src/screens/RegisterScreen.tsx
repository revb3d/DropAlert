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
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { AuthStackParamList } from '../navigation';
import { colors, spacing, radius, typography } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signIn = useAuthStore((s) => s.signIn);

  const mutation = useMutation({
    mutationFn: () => register(email.trim(), password, name.trim() || undefined),
    onSuccess: async ({ token, user }) => {
      await signIn(token, user);
    },
    onError: (err: Error) => {
      Alert.alert('Registration failed', err.message);
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headline}>
          <Text style={styles.logo}>DropAlert</Text>
          <Text style={styles.tagline}>Create your account to start tracking.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Display name (optional)"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
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
            placeholder="Password (min 8 characters)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => mutation.mutate()}
          />

          <TouchableOpacity
            style={[styles.btn, mutation.isPending && styles.btnDisabled]}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create account</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already have an account?{' '}
            <Text style={styles.linkAccent}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  headline: { gap: spacing.xs },
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
  form: { gap: spacing.md },
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
  btnDisabled: { opacity: 0.6 },
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
  linkAccent: { color: colors.primary, fontWeight: typography.semibold },
});
