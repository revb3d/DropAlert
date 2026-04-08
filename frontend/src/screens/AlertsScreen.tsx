import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getAlerts, markAlertRead, markAllAlertsRead } from '../api/alerts';
import type { Alert } from '../api/alerts';
import { trackProduct } from '../api/products';
import { toast } from '../store/toastStore';
import EmptyState from '../components/EmptyState';
import { AlertCardSkeleton } from '../components/Skeleton';
import { colors, spacing, radius, typography, shadow } from '../theme';
import { formatPrice, formatDrop, timeAgo } from '../utils/format';

const HEADER_H = 70;
const TAB_BAR_H = 60;
const CARD_GAP = 8;
const LIST_PADDING = 12;
const VISIBLE_CARDS = 5;

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { height: screenHeight } = useWindowDimensions();

  const cardHeight = Math.floor(
    (screenHeight - insets.top - HEADER_H - TAB_BAR_H - LIST_PADDING * 2 - CARD_GAP * (VISIBLE_CARDS - 1)) / VISIBLE_CARDS
  );

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts({ limit: 99 }),
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markAlertRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'unread'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAlertsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'unread'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const trackMutation = useMutation({
    mutationFn: (asin: string) => trackProduct(asin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast('Added to your dashboard!', 'success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const alerts = data?.alerts ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={styles.subheading}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: 12, gap: 8 }}>
          {[1,2,3,4,5].map((i) => <AlertCardSkeleton key={i} height={cardHeight} />)}
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            alerts.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              cardHeight={cardHeight}
              onPress={() => { if (!item.is_read) markReadMutation.mutate(item.id); }}
              onTrack={item.product_asin ? () => trackMutation.mutate(item.product_asin!) : undefined}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="No alerts yet"
              subtitle="When a tracked product drops below your threshold, it will appear here."
            />
          }
        />
      )}
    </View>
  );
}

function AlertCard({ alert, cardHeight, onPress, onTrack }: { alert: Alert; cardHeight: number; onPress: () => void; onTrack?: () => void }) {
  const drop = parseFloat(alert.drop_percent);
  const oldPrice = parseFloat(alert.old_price);
  const newPrice = parseFloat(alert.new_price);
  const imageSize = cardHeight - 16;

  const amazonUrl = alert.product_url
    ?? (alert.product_asin ? `https://www.amazon.com/dp/${alert.product_asin}` : null);

  return (
    <TouchableOpacity
      style={[styles.card, { height: cardHeight }, !alert.is_read && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Unread indicator */}
      {!alert.is_read && <View style={styles.unreadBar} />}

      {/* Image */}
      {alert.product_image_url ? (
        <Image
          source={{ uri: alert.product_image_url }}
          style={[styles.image, { width: imageSize, height: imageSize }]}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder, { width: imageSize, height: imageSize }]}>
          <Ionicons name="image-outline" size={32} color={colors.textMuted} />
        </View>
      )}

      {/* Details */}
      <View style={styles.details}>
        {/* Drop badge + time */}
        <View style={styles.topRow}>
          <View style={styles.dropBadge}>
            <Text style={styles.dropText}>{formatDrop(drop)}</Text>
          </View>
          <Text style={styles.time}>{timeAgo(alert.sent_at)}</Text>
        </View>

        {/* Title */}
        <TouchableOpacity onPress={() => amazonUrl && Linking.openURL(amazonUrl)} disabled={!amazonUrl}>
          <Text style={[styles.title, amazonUrl && styles.titleLink]} numberOfLines={3}>
            {alert.product_title}
          </Text>
        </TouchableOpacity>

        {/* Prices + track button */}
        <View style={styles.priceRow}>
          <Text style={styles.newPrice}>{formatPrice(newPrice)}</Text>
          <Text style={styles.oldPrice}>{formatPrice(oldPrice)}</Text>
          {onTrack && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={(e: any) => { e?.stopPropagation?.(); onTrack(); }}
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    height: HEADER_H,
  },
  heading: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.text },
  subheading: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
  },
  markAllText: { fontSize: typography.sm, color: colors.primary, fontWeight: typography.medium },

  list: { padding: LIST_PADDING, gap: CARD_GAP },
  listEmpty: { flexGrow: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingRight: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  unreadBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: colors.primary,
  },

  image: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginLeft: 8,
    flexShrink: 0,
  },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },

  details: { flex: 1, gap: 5, justifyContent: 'center' },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dropBadge: {
    backgroundColor: colors.successDim,
    borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  dropText: { fontSize: 13, color: colors.success, fontWeight: typography.bold },
  time: { fontSize: typography.xs, color: colors.textMuted },

  title: {
    fontSize: 14,
    color: colors.text,
    fontWeight: typography.medium,
    lineHeight: 20,
  },
  titleLink: { textDecorationLine: 'underline' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  trackBtn: { marginLeft: 'auto' as any },
  newPrice: { fontSize: 18, color: colors.text, fontWeight: typography.bold },
  oldPrice: { fontSize: 18, color: '#888', textDecorationLine: 'line-through' },
});
