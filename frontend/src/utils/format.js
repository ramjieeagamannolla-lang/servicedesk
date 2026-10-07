export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(date) {
  if (!date) return '—';
  const diffMs = new Date(date).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const abs = Math.abs(diffMin);

  if (abs < 1) return 'just now';
  if (abs < 60) return `${diffMin > 0 ? 'in ' : ''}${abs} min${abs !== 1 ? 's' : ''}${diffMin < 0 ? ' ago' : ''}`;
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return `${diffHr > 0 ? 'in ' : ''}${Math.abs(diffHr)} hr${Math.abs(diffHr) !== 1 ? 's' : ''}${diffHr < 0 ? ' ago' : ''}`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay > 0 ? 'in ' : ''}${Math.abs(diffDay)} day${Math.abs(diffDay) !== 1 ? 's' : ''}${diffDay < 0 ? ' ago' : ''}`;
}

export function formatMinutesToDuration(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  const abs = Math.abs(minutes);
  const sign = minutes < 0 ? 'overdue by ' : '';
  if (abs < 60) return `${sign}${abs}m`;
  const hrs = Math.floor(abs / 60);
  const mins = abs % 60;
  if (hrs < 24) return `${sign}${hrs}h ${mins}m`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return `${sign}${days}d ${remHrs}h`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
