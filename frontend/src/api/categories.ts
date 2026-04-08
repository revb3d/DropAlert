import { apiClient } from './client';

export interface CategoryWatch {
  id: string;
  category_key: string;
  category_name: string;
  threshold_percent: string;
  notify_enabled: boolean;
  watch_type: 'category' | 'keyword';
  search_term: string | null;
  created_at: string;
}

export const CATEGORIES = [
  { key: 'electronics', name: 'Electronics',    icon: 'laptop-outline'          },
  { key: 'clothing',    name: 'Clothing',        icon: 'shirt-outline'           },
  { key: 'sports',      name: 'Sports',          icon: 'football-outline'        },
  { key: 'home',        name: 'Home & Kitchen',  icon: 'home-outline'            },
  { key: 'books',       name: 'Books',           icon: 'book-outline'            },
  { key: 'toys',        name: 'Toys & Games',    icon: 'game-controller-outline' },
  { key: 'beauty',      name: 'Beauty',          icon: 'sparkles-outline'        },
] as const;

export async function getCategoryWatches(): Promise<CategoryWatch[]> {
  const { data } = await apiClient.get<{ watches: CategoryWatch[] }>('/categories');
  return data.watches;
}

export async function createCategoryWatch(
  categoryKey: string,
  thresholdPercent: number
): Promise<CategoryWatch> {
  const { data } = await apiClient.post<{ watch: CategoryWatch }>('/categories', {
    watchType: 'category',
    categoryKey,
    thresholdPercent,
  });
  return data.watch;
}

export async function createKeywordWatch(
  keyword: string,
  thresholdPercent: number
): Promise<CategoryWatch> {
  const { data } = await apiClient.post<{ watch: CategoryWatch }>('/categories', {
    watchType: 'keyword',
    keyword,
    thresholdPercent,
  });
  return data.watch;
}

export async function deleteCategoryWatch(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

export async function updateCategoryWatch(
  id: string,
  fields: { thresholdPercent?: number; notifyEnabled?: boolean }
): Promise<CategoryWatch> {
  const { data } = await apiClient.patch<{ watch: CategoryWatch }>(`/categories/${id}`, fields);
  return data.watch;
}
