import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategoryWatches,
  createCategoryWatch,
  createKeywordWatch,
  deleteCategoryWatch,
  updateCategoryWatch,
  CATEGORIES,
  CategoryWatch,
} from '../api/categories';
import EmptyState from '../components/EmptyState';
import ScreenBackground from '../components/ScreenBackground';
import GradientButton from '../components/GradientButton';
import { colors, spacing, radius, typography, shadow } from '../theme';

type WatchMode = 'category' | 'keyword';

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<WatchMode>('category');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [threshold, setThreshold] = useState('10');

  const { data: watches = [], isLoading } = useQuery({
    queryKey: ['category-watches'],
    queryFn: getCategoryWatches,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      mode === 'keyword'
        ? createKeywordWatch(keyword.trim(), parseFloat(threshold) || 10)
        : createCategoryWatch(selectedKey!, parseFloat(threshold) || 10),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-watches'] });
      resetForm();
    },
    onError: (err: Error) => window.alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryWatch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['category-watches'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, notifyEnabled }: { id: string; notifyEnabled: boolean }) =>
      updateCategoryWatch(id, { notifyEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['category-watches'] }),
  });

  const thresholdMutation = useMutation({
    mutationFn: ({ id, thresholdPercent }: { id: string; thresholdPercent: number }) =>
      updateCategoryWatch(id, { thresholdPercent }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['category-watches'] }),
  });

  const watchedKeys = new Set(watches.map((w) => w.category_key));

  function resetForm() {
    setShowForm(false);
    setMode('category');
    setSelectedKey(null);
    setKeyword('');
    setThreshold('10');
  }

  const canSave = mode === 'keyword' ? keyword.trim().length >= 2 : !!selectedKey;

  return (
    <ScreenBackground>
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Watchlists</Text>
        <Text style={styles.subheading}>
          Get alerted when prices drop by your threshold in a category or keyword search.
        </Text>
      </View>

      {/* Active watches */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : watches.length === 0 && !showForm ? (
        <EmptyState
          icon="eye-outline"
          title="No watchlists yet"
          subtitle="Add a category or keyword below to start getting price drop alerts."
        />
      ) : (
        watches.map((watch) => (
          <WatchCard
            key={watch.id}
            watch={watch}
            onDelete={() => deleteMutation.mutate(watch.id)}
            onToggle={(val) => toggleMutation.mutate({ id: watch.id, notifyEnabled: val })}
            onUpdateThreshold={(val) => thresholdMutation.mutate({ id: watch.id, thresholdPercent: val })}
          />
        ))
      )}

      {/* Add form */}
      {showForm ? (
        <View style={styles.form}>
          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'category' && styles.modeBtnActive]}
              onPress={() => { setMode('category'); setKeyword(''); }}
            >
              <Ionicons name="grid-outline" size={15} color={mode === 'category' ? '#fff' : colors.textMuted} />
              <Text style={[styles.modeBtnText, mode === 'category' && styles.modeBtnTextActive]}>Category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'keyword' && styles.modeBtnActive]}
              onPress={() => { setMode('keyword'); setSelectedKey(null); }}
            >
              <Ionicons name="search-outline" size={15} color={mode === 'keyword' ? '#fff' : colors.textMuted} />
              <Text style={[styles.modeBtnText, mode === 'keyword' && styles.modeBtnTextActive]}>Keyword</Text>
            </TouchableOpacity>
          </View>

          {mode === 'category' ? (
            <>
              <Text style={styles.formTitle}>Choose a Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isWatched = watchedKeys.has(cat.key);
                  const isSelected = selectedKey === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.catChip, isSelected && styles.catChipSelected, isWatched && styles.catChipWatched]}
                      onPress={() => !isWatched && setSelectedKey(cat.key)}
                      disabled={isWatched}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={18}
                        color={isSelected ? '#fff' : isWatched ? colors.textMuted : colors.text}
                      />
                      <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected, isWatched && styles.catChipTextMuted]}>
                        {cat.name}
                      </Text>
                      {isWatched && <Ionicons name="checkmark-circle" size={13} color={colors.success} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.formTitle}>Enter a Keyword</Text>
              <TextInput
                style={styles.keywordInput}
                value={keyword}
                onChangeText={setKeyword}
                placeholder="e.g. airpods, gaming chair, ps5…"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoFocus
              />
            </>
          )}

          {/* Threshold */}
          <View style={styles.thresholdRow}>
            <Text style={styles.label}>Alert when price drops by</Text>
            <View style={styles.thresholdBox}>
              <TextInput
                style={styles.thresholdField}
                value={threshold}
                onChangeText={setThreshold}
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.thresholdPct}>%</Text>
            </View>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <GradientButton
              label="Add Watchlist"
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!canSave}
              style={styles.saveBtn}
            />
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Watchlist</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
    </ScreenBackground>
  );
}

function WatchCard({
  watch, onDelete, onToggle, onUpdateThreshold,
}: {
  watch: CategoryWatch;
  onDelete: () => void;
  onToggle: (val: boolean) => void;
  onUpdateThreshold: (val: number) => void;
}) {
  const cat = CATEGORIES.find((c) => c.key === watch.category_key);
  const isKeyword = watch.watch_type === 'keyword';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(parseFloat(watch.threshold_percent).toFixed(0));

  function saveThreshold() {
    const val = parseFloat(draft);
    if (!isNaN(val) && val >= 1 && val <= 99) onUpdateThreshold(val);
    setEditing(false);
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardIconWrap}>
        <Ionicons
          name={(isKeyword ? 'search-outline' : (cat?.icon ?? 'pricetag-outline')) as any}
          size={22}
          color={colors.primary}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{watch.category_name}</Text>
        {editing ? (
          <View style={styles.editRow}>
            <Text style={styles.cardSub}>Alert on ≥</Text>
            <TextInput
              style={styles.editField}
              value={draft}
              onChangeText={setDraft}
              keyboardType="numeric"
              maxLength={2}
              autoFocus
            />
            <Text style={styles.cardSub}>%</Text>
            <TouchableOpacity onPress={saveThreshold} style={{ marginLeft: 4 }}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editRow}>
            <Text style={styles.cardSub}>Alert on ≥{parseFloat(watch.threshold_percent).toFixed(0)}%  </Text>
            <Ionicons name="pencil-outline" size={13} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <Switch
        value={watch.notify_enabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
      <TouchableOpacity onPress={onDelete} style={{ padding: spacing.xs }}>
        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: spacing.lg },
  header: { paddingTop: spacing.md, paddingBottom: spacing.md },
  heading: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.text },
  subheading: { fontSize: typography.sm, color: colors.textMuted, marginTop: 4 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    gap: spacing.sm, ...shadow.card,
  },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  cardSub: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  editRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 },
  editField: {
    fontSize: typography.sm, color: colors.text, fontWeight: typography.semibold,
    borderBottomWidth: 1, borderColor: colors.primary, width: 28, textAlign: 'center', padding: 0,
  },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, gap: spacing.xs, marginTop: spacing.md,
  },
  addBtnText: { fontSize: typography.base, fontWeight: typography.semibold, color: '#fff' },

  form: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.lg, marginTop: spacing.md,
    gap: spacing.md, ...shadow.card,
  },

  modeToggle: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 3, gap: 3,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: radius.sm,
  },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: typography.medium },
  modeBtnTextActive: { color: '#fff' },

  formTitle: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 9,
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  catChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipWatched: { opacity: 0.45 },
  catChipText: { fontSize: typography.sm, color: colors.text, fontWeight: typography.medium },
  catChipTextSelected: { color: '#fff' },
  catChipTextMuted: { color: colors.textMuted },

  keywordInput: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: typography.base, color: colors.text,
  },

  thresholdRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: typography.sm, color: colors.text },
  thresholdBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm,
  },
  thresholdField: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.text, width: 44, textAlign: 'center', paddingVertical: 8,
  },
  thresholdPct: { fontSize: typography.base, color: colors.textMuted },

  formActions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: typography.base, color: colors.textMuted, fontWeight: typography.medium },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: typography.base, fontWeight: typography.semibold, color: '#fff' },
});
