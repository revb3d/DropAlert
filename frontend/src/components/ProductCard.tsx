import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Product, getPriceHistory } from '../api/products';
import SparkLine from './SparkLine';
import { colors, spacing, radius, typography, shadow } from '../theme';
import { formatPrice, formatDrop, truncate } from '../utils/format';

interface Props {
  product: Product;
  onPress: () => void;
  onUntrack: () => void;
}

export default function ProductCard({ product, onPress, onUntrack }: Props) {
  const { data: history } = useQuery({
    queryKey: ['history', product.id],
    queryFn: () => getPriceHistory(product.id, 30),
    staleTime: 5 * 60_000,
  });

  const prices = history?.map((h) => parseFloat(h.price)) ?? [];
  const currentPrice = product.current_price ? parseFloat(product.current_price) : null;

  // Calculate drop vs first history point
  const firstPrice = prices.length > 1 ? prices[0] : null;
  const dropPercent =
    firstPrice && currentPrice && currentPrice < firstPrice
      ? ((firstPrice - currentPrice) / firstPrice) * 100
      : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Header row: image + title + untrack */}
      <View style={styles.header}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={20} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.titleBlock}>
          {product.brand && (
            <Text style={styles.brand} numberOfLines={1}>
              {product.brand}
            </Text>
          )}
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
        </View>

        <TouchableOpacity
          onPress={(e: any) => { e?.stopPropagation?.(); onUntrack(); }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sparkline + price row */}
      <View style={styles.bottom}>
        <View style={styles.sparkWrap}>
          {prices.length >= 2 ? (
            <SparkLine data={prices} width={110} height={38} />
          ) : (
            <View style={styles.sparkEmpty}>
              <Text style={styles.sparkEmptyText}>Collecting data…</Text>
            </View>
          )}
        </View>

        <View style={styles.priceBlock}>
          {dropPercent !== null && (
            <View style={styles.dropBadge}>
              <Text style={styles.dropText}>{formatDrop(dropPercent)}</Text>
            </View>
          )}
          <Text style={styles.price}>
            {currentPrice !== null ? formatPrice(currentPrice, product.currency) : 'N/A'}
          </Text>
          <Text style={styles.threshold}>
            Alert at {product.threshold_percent ?? '10'}% drop
          </Text>
        </View>
      </View>

      {/* Muted availability */}
      {product.availability && product.availability !== 'In Stock' && (
        <Text style={styles.availability}>{product.availability}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  brand: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginBottom: 2,
    fontWeight: typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.sm,
    color: colors.text,
    fontWeight: typography.medium,
    lineHeight: 18,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sparkWrap: {
    flex: 1,
  },
  sparkEmpty: {
    height: 38,
    justifyContent: 'center',
  },
  sparkEmptyText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dropBadge: {
    backgroundColor: colors.successDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: 2,
  },
  dropText: {
    fontSize: typography.xs,
    color: colors.success,
    fontWeight: typography.bold,
  },
  price: {
    fontSize: typography.lg,
    color: colors.text,
    fontWeight: typography.bold,
  },
  threshold: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  availability: {
    marginTop: spacing.xs,
    fontSize: typography.xs,
    color: colors.warning,
  },
});
