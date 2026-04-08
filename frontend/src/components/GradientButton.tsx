import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, radius } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function GradientButton({ label, onPress, loading, disabled, style }: Props) {
  return (
    <LinearGradient
      colors={['#8B7FFF', '#6C63FF', '#4F46E5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradient, (disabled || loading) && styles.disabled, style]}
    >
      <TouchableOpacity style={styles.btn} onPress={onPress} disabled={disabled || loading}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.text}>{label}</Text>
        }
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { borderRadius: radius.md },
  disabled: { opacity: 0.6 },
  btn: { paddingVertical: 13, alignItems: 'center' },
  text: { fontSize: 15, fontWeight: '600' as const, color: '#fff' },
});
