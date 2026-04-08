import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

function SkeletonBox({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.box, style, { opacity }]} />;
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonBox style={styles.image} />
        <View style={styles.titleBlock}>
          <SkeletonBox style={styles.brandLine} />
          <SkeletonBox style={styles.titleLine} />
          <SkeletonBox style={styles.titleLineShort} />
        </View>
      </View>
      <View style={styles.cardBottom}>
        <SkeletonBox style={styles.sparkLine} />
        <SkeletonBox style={styles.priceLine} />
      </View>
    </View>
  );
}

export function AlertCardSkeleton({ height }: { height: number }) {
  const imageSize = height - 16;
  return (
    <View style={[styles.alertCard, { height }]}>
      <SkeletonBox style={{ width: imageSize, height: imageSize, borderRadius: radius.md }} />
      <View style={styles.alertDetails}>
        <View style={styles.alertTopRow}>
          <SkeletonBox style={styles.badge} />
          <SkeletonBox style={styles.timeLine} />
        </View>
        <SkeletonBox style={styles.alertTitleLine} />
        <SkeletonBox style={styles.alertTitleShort} />
        <SkeletonBox style={styles.alertPriceLine} />
      </View>
    </View>
  );
}

export function SearchCardSkeleton() {
  return (
    <View style={styles.searchCard}>
      <SkeletonBox style={styles.searchImage} />
      <View style={styles.searchContent}>
        <SkeletonBox style={styles.brandLine} />
        <SkeletonBox style={styles.titleLine} />
        <SkeletonBox style={styles.titleLineShort} />
        <SkeletonBox style={styles.priceLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  image: { width: 52, height: 52, borderRadius: radius.sm },
  titleBlock: { flex: 1, gap: 6 },
  brandLine: { height: 10, width: '40%' },
  titleLine: { height: 13, width: '90%' },
  titleLineShort: { height: 13, width: '65%' },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sparkLine: { height: 38, width: 110, borderRadius: radius.sm },
  priceLine: { height: 20, width: 70 },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingRight: 16,
    paddingLeft: 8,
    gap: 12,
  },
  alertDetails: { flex: 1, gap: 6 },
  alertTopRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  badge: { height: 20, width: 50, borderRadius: radius.full },
  timeLine: { height: 10, width: 60 },
  alertTitleLine: { height: 13, width: '95%' },
  alertTitleShort: { height: 13, width: '70%' },
  alertPriceLine: { height: 18, width: 80 },

  searchCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  searchImage: { width: 60, height: 60, borderRadius: radius.sm },
  searchContent: { flex: 1, gap: 6 },
});
