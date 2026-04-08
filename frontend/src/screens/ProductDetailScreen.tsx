import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Svg, { Path, Polyline, Line, Text as SvgText } from 'react-native-svg';
import { getTrackedProducts, getPriceHistory, updateProductSettings } from '../api/products';
import { colors, spacing, radius, typography, shadow } from '../theme';
import { formatPrice, timeAgo } from '../utils/format';
import { DashboardStackParamList } from '../navigation';

type Props = NativeStackScreenProps<DashboardStackParamList, 'ProductDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - spacing.lg * 2;
const CHART_H = 140;
const PAD = { top: 16, bottom: 24, left: 48, right: 12 };

export default function ProductDetailScreen({ route }: Props) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({ queryKey: ['products'], queryFn: getTrackedProducts });
  const product = products?.find((p) => p.id === productId);

  const { data: history } = useQuery({
    queryKey: ['history', productId],
    queryFn: () => getPriceHistory(productId, 60),
  });

  const [threshold, setThreshold] = useState(
    String(product?.threshold_percent ?? '10')
  );
  const [targetPrice, setTargetPrice] = useState(
    product?.target_price ? String(product.target_price) : ''
  );
  const [notifyEnabled, setNotifyEnabled] = useState(
    product?.notify_enabled ?? true
  );

  const mutation = useMutation({
    mutationFn: () =>
      updateProductSettings(productId, {
        thresholdPercent: parseFloat(threshold),
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        notifyEnabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Saved', 'Alert settings updated.');
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  if (!product) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const prices = history?.map((h) => parseFloat(h.price)) ?? [];
  const currentPrice = product.current_price ? parseFloat(product.current_price) : null;
  const highPrice = prices.length ? Math.max(...prices) : null;
  const lowPrice = prices.length ? Math.min(...prices) : null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      {/* Product info */}
      <View style={styles.productRow}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : null}
        <View style={styles.productInfo}>
          {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
          <Text style={styles.title}>{product.title}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(product.product_url)}>
            <Text style={styles.amazonLink}>View on Amazon ↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Price summary */}
      <View style={styles.priceRow}>
        <Stat label="Current" value={currentPrice !== null ? formatPrice(currentPrice) : '—'} accent />
        <Stat label="High" value={highPrice !== null ? formatPrice(highPrice) : '—'} />
        <Stat label="Low" value={lowPrice !== null ? formatPrice(lowPrice) : '—'} />
      </View>

      {/* Price history chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Price History</Text>
        {prices.length >= 2 ? (
          <PriceChart prices={prices} labels={history!.map((h) => h.recorded_at)} />
        ) : (
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>
              Not enough data yet — check back after the next poll.
            </Text>
          </View>
        )}
        {product.last_checked_at && (
          <Text style={styles.lastChecked}>
            Last updated {timeAgo(product.last_checked_at)}
          </Text>
        )}
      </View>

      {/* Alert settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Alert Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Switch
            value={notifyEnabled}
            onValueChange={setNotifyEnabled}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Drop threshold (%)</Text>
          <TextInput
            style={styles.settingInput}
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="numeric"
            placeholder="e.g. 20"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Target price (optional)</Text>
          <TextInput
            style={styles.settingInput}
            value={targetPrice}
            onChangeText={setTargetPrice}
            keyboardType="decimal-pad"
            placeholder="e.g. 49.99"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, mutation.isPending && styles.saveBtnDisabled]}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
    </View>
  );
}

function PriceChart({ prices, labels }: { prices: number[]; labels: string[] }) {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const pts = prices.map((p, i) => ({
    x: PAD.left + (i / (prices.length - 1)) * innerW,
    y: PAD.top + ((max - p) / range) * innerH,
  }));

  const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(' ');

  // Y-axis labels (3 ticks)
  const ticks = [max, (max + min) / 2, min];

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Grid lines + y labels */}
      {ticks.map((tick, i) => {
        const y = PAD.top + (i / (ticks.length - 1)) * innerH;
        return (
          <React.Fragment key={i}>
            <Line
              x1={PAD.left}
              y1={y}
              x2={CHART_W - PAD.right}
              y2={y}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
            <SvgText
              x={PAD.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill={colors.textMuted}
            >
              ${tick.toFixed(0)}
            </SvgText>
          </React.Fragment>
        );
      })}
      {/* Line */}
      <Polyline
        points={polyPoints}
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current price dot */}
      {pts.length > 0 && (
        <React.Fragment>
          <Path
            d={`M${pts[pts.length - 1].x},${pts[pts.length - 1].y} m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0`}
            fill={colors.primary}
          />
        </React.Fragment>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  productRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  image: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.surface },
  productInfo: { flex: 1, gap: 4 },
  brand: { fontSize: typography.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text, lineHeight: 21 },
  amazonLink: { fontSize: typography.sm, color: colors.primary, marginTop: 4 },
  priceRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: typography.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: typography.md, fontWeight: typography.bold, color: colors.text },
  statValueAccent: { color: colors.success },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  sectionTitle: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  chartPlaceholder: { height: CHART_H, justifyContent: 'center', alignItems: 'center' },
  chartPlaceholderText: { fontSize: typography.sm, color: colors.textMuted, textAlign: 'center' },
  lastChecked: { fontSize: typography.xs, color: colors.textMuted, textAlign: 'right' },
  settingsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  settingLabel: { fontSize: typography.sm, color: colors.text, flex: 1 },
  settingInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: typography.sm,
    color: colors.text,
    minWidth: 90,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: typography.base, fontWeight: typography.semibold, color: '#fff' },
});
