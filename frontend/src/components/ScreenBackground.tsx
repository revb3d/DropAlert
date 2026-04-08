import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScreenBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={['#0A0A12', '#0F0F1E', '#13101F']}
      style={styles.root}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
