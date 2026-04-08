/** Format a numeric price with currency symbol */
export function formatPrice(price: number | string | null, currency = 'USD'): string {
  if (price === null || price === undefined) return 'N/A';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
}

/** Format a drop percentage like "−32%" */
export function formatDrop(percent: number | string): string {
  const num = typeof percent === 'string' ? parseFloat(percent) : percent;
  return `−${Math.abs(num).toFixed(0)}%`;
}

/** Relative time string: "2 hours ago", "just now", etc. */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Truncate a string to maxLen chars */
export function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + '…';
}
