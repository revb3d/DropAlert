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
import { colors, spacing, typography } from '../theme';
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

  const products = data ?? [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Dashboard</Text>
        <Text style={styles.subheading}>
          {products.length} product{products.length !== 1 ? 's' : ''} tracked
        </Text>
      </View>

      <FlatList
        data={products}
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
});
