import { apiClient } from './client';

export async function updatePushToken(token: string): Promise<void> {
  await apiClient.patch('/users/push-token', { token });
}

export async function triggerPoll(): Promise<void> {
  await apiClient.post('/users/poll-trigger');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/users/password', { currentPassword, newPassword });
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete('/users/me');
}

export async function updateSettings(settings: {
  defaultThresholdPercent?: number;
  emailNotificationsEnabled?: boolean;
  notificationEmail?: string;
}): Promise<void> {
  await apiClient.patch('/users/settings', settings);
}
