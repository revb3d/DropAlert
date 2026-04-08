import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Alert } from '../api/alerts';
import { colors, spacing, radius, typography } from '../theme';
import { formatPrice, formatDrop, timeAgo, truncate } from '../utils/format';

interface Props {
  alert: Alert;
  onPress: () => void;
}

export default function AlertItem({ alert, onPress }: Props) {
  const drop = parseFloat(alert.drop_percent);
  const oldPrice = parseFloat(alert.old_price);
  const newPrice = parseFloat(alert.new_price);

  const amazonUrl = alert.product_url
    ?? (alert.product_asin ? `https://www.amazon.com/dp/${alert.product_asin}` : null);

  function openAmazon() {
    if (amazonUrl) Linking.openURL(amazonUrl);
  }

  return (
    <TouchableOpacity
      style={[styles.row, !alert.is_read && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Unread dot */}
      {!alert.is_read && <View style={styles.dot} />}

      {/* Thumbnail */}
      {alert.product_image_url ? (
        <Image source={{ uri: alert.product_image_url }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      {/* Content */}
      <View style={styles.content}>
        <TouchableOpacity onPress={openAmazon} disabled={!amazonUrl}>
          <Text style={[styles.title, amazonUrl && styles.titleLink]} numberOfLines={2}>
            {truncate(alert.product_title, 70)}
          </Text>
        </TouchableOpacity>

        <View style={styles.priceRow}>
          <Text style={styles.oldPrice}>{formatPrice(oldPrice)}</Text>
          <Text style={styles.arrow}> → </Text>
          <Text style={styles.newPrice}>{formatPrice(newPrice)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatDrop(drop)}</Text>
          </View>
        </View>

        <Text style={styles.time}>{timeAgo(alert.sent_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  unread: {
    backgroundColor: colors.primaryDim,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.primary,
    position: 'absolute',
    left: 6,
    top: '50%',
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  imagePlaceholder: {
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: typography.sm,
    color: colors.text,
    fontWeight: typography.medium,
    lineHeight: 17,
  },
  titleLink: {
    textDecorationLine: 'underline',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  oldPrice: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  arrow: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
  newPrice: {
    fontSize: typography.sm,
    color: colors.success,
    fontWeight: typography.semibold,
  },
  badge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.successDim,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: typography.xs,
    color: colors.success,
    fontWeight: typography.bold,
  },
  time: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
});
