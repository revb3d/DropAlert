import { apiClient } from './client';

export interface Product {
  id: string;
  asin: string;
  title: string;
  brand: string | null;
  image_url: string | null;
  product_url: string;
  current_price: string | null;
  currency: string;
  availability: string | null;
  last_checked_at: string | null;
  // tracked_products join fields
  tracked_id?: string;
  threshold_percent?: string;
  target_price?: string | null;
  notify_enabled?: boolean;
}

export interface PricePoint {
  price: string;
  currency: string;
  recorded_at: string;
}

export async function getTrackedProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<{ products: Product[] }>('/products');
  return data.products;
}

export async function trackProduct(
  asin: string,
  thresholdPercent = 10,
  targetPrice?: number | null
): Promise<Product> {
  const { data } = await apiClient.post<{ product: Product }>('/products/track', {
    asin,
    thresholdPercent,
    targetPrice: targetPrice ?? null,
  });
  return data.product;
}

export async function untrackProduct(productId: string): Promise<void> {
  await apiClient.delete(`/products/${productId}/track`);
}

export async function updateProductSettings(
  productId: string,
  settings: { thresholdPercent?: number; targetPrice?: number | null; notifyEnabled?: boolean }
): Promise<void> {
  await apiClient.patch(`/products/${productId}/settings`, settings);
}

export async function getPriceHistory(productId: string, limit = 30): Promise<PricePoint[]> {
  const { data } = await apiClient.get<{ history: PricePoint[] }>(
    `/products/${productId}/history`,
    { params: { limit } }
  );
  return data.history;
}

export async function searchAmazon(q: string, page = 1, searchIndex?: string): Promise<Product[]> {
  const { data } = await apiClient.get<{ results: Product[] }>('/products/search', {
    params: { q, searchIndex, page },
  });
  return data.results;
}
