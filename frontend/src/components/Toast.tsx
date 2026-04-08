import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, ToastType } from '../store/toastStore';
import { colors, spacing, radius, typography } from '../theme';

function ToastItem({ id, message, type }: { id: string; message: string; type: ToastType }) {
  const hide = useToastStore((s) => s.hide);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const bgColor = type === 'success' ? colors.success : type === 'error' ? colors.danger : colors.primary;
  const icon = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle';

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bgColor, opacity }]}>
      <Ionicons name={icon as any} size={18} color="#fff" />
      <Text style={styles.message} numberOfLines={3}>{message}</Text>
      <TouchableOpacity onPress={() => hide(id)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Ionicons name="close" size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    gap: spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  message: {
    flex: 1,
    fontSize: typography.sm,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 18,
  },
});
