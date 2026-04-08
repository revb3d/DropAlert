import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../api/auth';
import { triggerPoll, changePassword, deleteAccount, updateSettings } from '../api/users';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { colors, spacing, radius, typography, shadow } from '../theme';
import ScreenBackground from '../components/ScreenBackground';
import GradientButton from '../components/GradientButton';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((s) => s.signOut);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Default threshold state
  const [threshold, setThreshold] = useState<string>('');

  // Email notifications state
  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null);
  const [notifEmail, setNotifEmail] = useState('');

  // Sync local state from server data
  React.useEffect(() => {
    if (user) {
      setThreshold(String(user.default_threshold_percent ?? 10));
      setEmailEnabled(user.email_notifications_enabled ?? false);
      setNotifEmail(user.notification_email ?? '');
    }
  }, [user]);

  const pollMutation = useMutation({
    mutationFn: triggerPoll,
    onSuccess: () => toast('Price check started in background.', 'success'),
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const changePwMutation = useMutation({
    mutationFn: () => changePassword(currentPw, newPw),
    onSuccess: () => {
      toast('Password changed successfully!', 'success');
      setShowChangePassword(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: signOut,
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const settingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast('Settings saved!', 'success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const handleChangePw = () => {
    if (newPw.length < 8) { toast('New password must be at least 8 characters', 'error'); return; }
    if (newPw !== confirmPw) { toast('Passwords do not match', 'error'); return; }
    changePwMutation.mutate();
  };

  const handleSaveSettings = () => {
    const t = parseInt(threshold);
    if (isNaN(t) || t < 1 || t > 99) { toast('Threshold must be 1–99%', 'error'); return; }
    settingsMutation.mutate({
      defaultThresholdPercent: t,
      emailNotificationsEnabled: emailEnabled ?? false,
      notificationEmail: notifEmail || undefined,
    });
  };

  const handleSignOut = () => {
    if (window.confirm('Sign out of DropAlert?')) signOut();
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Delete your account? This cannot be undone.')) {
      deleteAccountMutation.mutate();
    }
  };

  return (
    <ScreenBackground>
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
                month: 'long', year: 'numeric',
              })}
            />
          </>
        ) : null}

        {/* Change password toggle */}
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setShowChangePassword((v) => !v)}
        >
          <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
          <Text style={styles.actionText}>Change Password</Text>
          <Ionicons
            name={showChangePassword ? 'chevron-up' : 'chevron-down'}
            size={16} color={colors.textMuted}
          />
        </TouchableOpacity>

        {showChangePassword && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={currentPw}
              onChangeText={setCurrentPw}
            />
            <TextInput
              style={styles.input}
              placeholder="New password (min 8 chars)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
            />
            <GradientButton
              label="Update Password"
              onPress={handleChangePw}
              loading={changePwMutation.isPending}
            />
          </View>
        )}
      </View>

      {/* Preferences card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>

        <View style={styles.row}>
          <Ionicons name="trending-down-outline" size={16} color={colors.textMuted} />
          <Text style={styles.rowLabel}>Default alert threshold</Text>
          <View style={styles.thresholdInput}>
            <TextInput
              style={styles.thresholdField}
              value={threshold}
              onChangeText={setThreshold}
              keyboardType="numeric"
              maxLength={2}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.thresholdPct}>%</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
          <Text style={styles.rowLabel}>Email notifications</Text>
          <Switch
            value={emailEnabled ?? false}
            onValueChange={setEmailEnabled}
            trackColor={{ false: colors.border, true: colors.primaryDim }}
            thumbColor={emailEnabled ? colors.primary : colors.textMuted}
          />
        </View>

        {emailEnabled && (
          <TextInput
            style={[styles.input, { marginTop: 4 }]}
            placeholder="Notification email (optional)"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={notifEmail}
            onChangeText={setNotifEmail}
          />
        )}

        <GradientButton
          label="Save Preferences"
          onPress={handleSaveSettings}
          loading={settingsMutation.isPending}
        />
      </View>

      {/* Notifications card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Push Notifications</Text>
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

      {/* Delete account */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>

      <Text style={styles.version}>DropAlert v1.0.0</Text>
    </ScrollView>
    </ScreenBackground>
  );
}

function Row({
  icon, label, value, valueColor,
}: {
  icon: string; label: string; value: string; valueColor?: string;
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
  root: { flex: 1, backgroundColor: 'transparent' },
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

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionText: { flex: 1, fontSize: typography.sm, color: colors.primary, fontWeight: typography.medium },

  form: { gap: spacing.sm, marginTop: 4 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: typography.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: typography.sm, fontWeight: typography.semibold },

  thresholdInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
  },
  thresholdField: {
    color: colors.text,
    fontSize: typography.sm,
    width: 36,
    textAlign: 'center',
    paddingVertical: 4,
  },
  thresholdPct: { color: colors.textMuted, fontSize: typography.sm },

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
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  deleteText: {
    fontSize: typography.sm,
    color: colors.danger,
    textDecorationLine: 'underline',
  },
  version: {
    textAlign: 'center',
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
