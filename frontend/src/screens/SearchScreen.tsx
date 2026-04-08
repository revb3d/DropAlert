import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchAmazon, trackProduct, Product } from '../api/products';
import EmptyState from '../components/EmptyState';
import { colors, spacing, radius, typography, shadow } from '../theme';
import { formatPrice, truncate } from '../utils/format';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState<Product[]>([]);
  const [tracking, setTracking] = useState<Set<string>>(new Set());

  const { data, isFetching } = useQuery({
    queryKey: ['search', submitted, page],
    queryFn: () => searchAmazon(submitted, page),
    enabled: submitted.trim().length >= 2,
    staleTime: 2 * 60_000,
  });

  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      setAllResults(data);
    } else {
      setAllResults((prev) => {
        const existingAsins = new Set(prev.map((p) => p.asin));
        return [...prev, ...data.filter((p) => !existingAsins.has(p.asin))];
      });
    }
  }, [data]);

  const trackMutation = useMutation({
    mutationFn: (asin: string) => trackProduct(asin),
    onMutate: (asin) => setTracking((s) => new Set(s).add(asin)),
    onSuccess: (_data, asin) => {
      setTracking((s) => { const n = new Set(s); n.delete(asin); return n; });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Tracking started', 'The product has been added to your dashboard.');
    },
    onError: (err: Error, asin) => {
      setTracking((s) => { const n = new Set(s); n.delete(asin); return n; });
      Alert.alert('Error', err.message);
    },
  });

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    if (query.trim().length >= 2) {
      setPage(1);
      setAllResults([]);
      setSubmitted(query.trim());
    }
  }, [query]);

  const results = allResults;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Search Amazon</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Product name or keyword…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSubmitted(''); }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchBtn, query.trim().length < 2 && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={query.trim().length < 2}
        >
          {isFetching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchBtnText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.asin}
        contentContainerStyle={[styles.list, results.length === 0 && styles.listEmpty]}
        renderItem={({ item }) => (
          <SearchResultCard
            product={item}
            isTracking={tracking.has(item.asin)}
            onTrack={() => trackMutation.mutate(item.asin)}
          />
        )}
        ListFooterComponent={
          results.length > 0 ? (
            <TouchableOpacity
              style={styles.seeMoreBtn}
              onPress={() => setPage((p) => p + 1)}
              disabled={isFetching}
            >
              {isFetching
                ? <ActivityIndicator color={colors.primary} size="small" />
                : <>
                    <Ionicons name="chevron-down" size={16} color={colors.primary} />
                    <Text style={styles.seeMoreText}>See More</Text>
                  </>
              }
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          !isFetching ? (
            submitted ? (
              <EmptyState
                icon="search-outline"
                title="No results found"
                subtitle={`Try a different search term for "${submitted}".`}
              />
            ) : (
              <EmptyState
                icon="storefront-outline"
                title="Search for products"
                subtitle="Enter a product name or ASIN and tap Search."
              />
            )
          ) : null
        }
      />
    </View>
  );
}

function SearchResultCard({
  product,
  isTracking,
  onTrack,
}: {
  product: Product;
  isTracking: boolean;
  onTrack: () => void;
}) {
  const price = product.current_price ? parseFloat(product.current_price) : null;

  return (
    <View style={styles.card}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.cardImage} resizeMode="contain" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
      )}

      <View style={styles.cardContent}>
        {product.brand && <Text style={styles.cardBrand}>{product.brand}</Text>}
        <TouchableOpacity onPress={() => Linking.openURL(product.product_url)}>
          <Text style={[styles.cardTitle, styles.cardTitleLink]} numberOfLines={3}>
            {product.title}
          </Text>
        </TouchableOpacity>
        <Text style={styles.cardPrice}>
          {price !== null ? formatPrice(price, product.currency) : 'Price unavailable'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.trackBtn, isTracking && styles.trackBtnDisabled]}
        onPress={onTrack}
        disabled={isTracking}
      >
        {isTracking ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  heading: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.base,
    color: colors.text,
    paddingVertical: 13,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: '#fff',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listEmpty: { flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadow.card,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  cardImagePlaceholder: { backgroundColor: colors.border },
  cardContent: { flex: 1, gap: 3 },
  cardBrand: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: typography.sm,
    color: colors.text,
    fontWeight: typography.medium,
    lineHeight: 17,
  },
  cardTitleLink: {
    textDecorationLine: 'underline',
    color: colors.text,
  },
  cardPrice: {
    fontSize: typography.base,
    color: colors.success,
    fontWeight: typography.semibold,
    marginTop: 2,
  },
  trackBtn: {
    padding: spacing.xs,
  },
  trackBtnDisabled: { opacity: 0.5 },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },
  seeMoreText: {
    fontSize: typography.base,
    color: colors.primary,
    fontWeight: typography.semibold,
  },
});
