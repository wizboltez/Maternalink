/** Shared time/duration formatting for consistent UI across monitoring screens */

export function formatSessionTimer(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDurationSeconds(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return 'N/A';
  return `${Math.round(seconds)}s`;
}

export function formatInterval(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return 'N/A';
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function formatSessionLength(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  return `${minutes} min`;
}

export function formatClockTime(
  value: Date | string | number,
  options?: { withSeconds?: boolean }
): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    ...(options?.withSeconds ? { second: '2-digit' } : {}),
  });
}

export function formatSessionDate(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortChartDate(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatConfidenceLabel(confidence: number): string {
  if (confidence >= 75) return 'Good';
  if (confidence >= 50) return 'Fair';
  return 'Low';
}
