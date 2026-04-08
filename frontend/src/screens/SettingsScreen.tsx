import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMe } from '../api/auth';
import { triggerPoll } from '../api/users';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, radius, typography, shadow } from '../theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((s) => s.signOut);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const pollMutation = useMutation({
    mutationFn: triggerPoll,
    onSuccess: () => Alert.alert('Poll triggered', 'Price check started in background.'),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <Text style={styles.heading}>Settings</Text>

      {/* Account card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : user ? (
          <>
            <Row icon="person-outline" label="Name" value={user.display_name ?? '—'} />
            <Row icon="mail-outline" label="Email" value={user.email} />
            <Row
              icon="time-outline"
              label="Member since"
              value={new Date(user.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            />
          </>
        ) : null}
      </View>

      {/* Notifications card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>
        <Row
          icon="phone-portrait-outline"
          label="Push token"
          value={user?.expo_push_token ? 'Registered' : 'Not registered'}
          valueColor={user?.expo_push_token ? colors.success : colors.warning}
        />
      </View>

      {/* Dev tools (hidden in prod) */}
      {__DEV__ && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Developer</Text>
          <TouchableOpacity
            style={styles.devBtn}
            onPress={() => pollMutation.mutate()}
            disabled={pollMutation.isPending}
          >
            {pollMutation.isPending ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            )}
            <Text style={styles.devBtnText}>Trigger price poll now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>DropAlert v1.0.0</Text>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={16} color={colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  heading: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  cardTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  rowLabel: { flex: 1, fontSize: typography.sm, color: colors.text },
  rowValue: { fontSize: typography.sm, color: colors.textSecondary },
  devBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  devBtnText: { fontSize: typography.sm, color: colors.primary },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerDim,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  signOutText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.danger,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
