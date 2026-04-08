import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getTrackedProducts, untrackProduct, Product } from '../api/products';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { ProductCardSkeleton } from '../components/Skeleton';
import { colors, spacing, typography, radius } from '../theme';
import { DashboardStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products'],
    queryFn: getTrackedProducts,
  });

  const untrackMutation = useMutation({
    mutationFn: untrackProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const handleUntrack = useCallback(
    (product: Product) => {
      untrackMutation.mutate(product.id);
    },
    [untrackMutation]
  );

  const [sortBy, setSortBy] = React.useState<'date' | 'price' | 'drop'>('date');

  const products = React.useMemo(() => {
    const list = data ?? [];
    if (sortBy === 'price') {
      return [...list].sort((a, b) => {
        const pa = a.current_price ? parseFloat(a.current_price) : Infinity;
        const pb = b.current_price ? parseFloat(b.current_price) : Infinity;
        return pa - pb;
      });
    }
    if (sortBy === 'drop') {
      return [...list].sort((a, b) => {
        const ta = parseFloat(a.threshold_percent ?? '0');
        const tb = parseFloat(b.threshold_percent ?? '0');
        return tb - ta;
      });
    }
    return list;
  }, [data, sortBy]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Dashboard</Text>
        <Text style={styles.subheading}>
          {products.length} product{products.length !== 1 ? 's' : ''} tracked
        </Text>
      </View>

      {/* Sort bar */}
      <View style={styles.sortBar}>
        {(['date', 'price', 'drop'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.sortBtnText, sortBy === s && styles.sortBtnTextActive]}>
              {s === 'date' ? 'Recent' : s === 'price' ? 'Price' : 'Threshold'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.skeletons}>
          {[1,2,3].map((i) => <ProductCardSkeleton key={i} />)}
        </View>
      ) : null}

      <FlatList
        data={isLoading ? [] : products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          products.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              navigation.navigate('ProductDetail', {
                productId: item.id,
                title: item.title.slice(0, 40),
              })
            }
            onUntrack={() => handleUntrack(item)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="pricetag-outline"
              title="No products yet"
              subtitle="Search for an Amazon product and tap Track to add it here."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  heading: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
  },
  subheading: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  listEmpty: {
    flexGrow: 1,
  },
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  sortBtn: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortBtnActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  sortBtnText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: typography.medium,
  },
  sortBtnTextActive: {
    color: colors.primary,
  },
  skeletons: {
    paddingHorizontal: spacing.lg,
  },
});
