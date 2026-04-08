import { apiClient } from './client';

export interface Alert {
  id: string;
  user_id: string;
  product_id: string | null;
  old_price: string;
  new_price: string;
  drop_percent: string;
  message: string | null;
  is_read: boolean;
  sent_at: string;
  product_title: string;
  product_asin: string | null;
  product_image_url: string | null;
  product_url: string | null;
  category_key: string | null;
}

export async function getAlerts(opts?: {
  page?: number;
  limit?: number;
  unread?: boolean;
}): Promise<{ alerts: Alert[]; unreadCount: number }> {
  const { data } = await apiClient.get('/alerts', { params: opts });
  return data;
}

export async function markAlertRead(alertId: string): Promise<void> {
  await apiClient.patch(`/alerts/${alertId}/read`);
}

export async function markAllAlertsRead(): Promise<void> {
  await apiClient.patch('/alerts/read-all');
}
