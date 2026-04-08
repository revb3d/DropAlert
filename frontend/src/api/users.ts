import { apiClient } from './client';

export async function updatePushToken(token: string): Promise<void> {
  await apiClient.patch('/users/push-token', { token });
}

export async function triggerPoll(): Promise<void> {
  await apiClient.post('/users/poll-trigger');
}
