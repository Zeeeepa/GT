import { AgentRun, AgentRunStatus } from '../types';

export interface AgentRunFilters {
  status?: AgentRunStatus[];
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
}

export type SortField = 'created_at' | 'status' | 'id';
export interface SortOptions {
  field: SortField;
  direction: 'asc' | 'desc';
}

export function filterAgentRuns(runs: AgentRun[], filters: AgentRunFilters): AgentRun[] {
  let filtered = [...runs];

  if (filters.status && filters.status.length > 0) {
    const set = new Set(filters.status);
    filtered = filtered.filter(run => set.has(run.status));
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(run => {
      const d = new Date(run.created_at);
      return d >= start && d <= end;
    });
  }

  if (filters.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(run => {
      const text = [
        String(run.id),
        run.status,
        run.prompt || '',
      ]
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    });
  }

  return filtered;
}

export function sortAgentRuns(runs: AgentRun[], sort: SortOptions): AgentRun[] {
  const sorted = [...runs];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case 'created_at':
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'id':
        cmp = a.id - b.id;
        break;
      default:
        cmp = 0;
    }
    return sort.direction === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

export function getDateRanges(): Record<string, { start: Date; end: Date }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);

  return {
    today: { start: today, end: now },
    yesterday: { start: yesterday, end: today },
    thisWeek: { start: thisWeekStart, end: now },
    lastWeek: { start: lastWeekStart, end: lastWeekEnd },
    thisMonth: { start: thisMonthStart, end: now },
    lastMonth: { start: lastMonthStart, end: lastMonthEnd },
    last30Days: { start: last30Days, end: now },
  };
}

export function getStatusFilterOptions(
  runs: AgentRun[]
): Array<{ status: AgentRunStatus; count: number; label: string }> {
  const counts: Record<string, number> = {};
  for (const r of runs) counts[r.status] = (counts[r.status] || 0) + 1;

  const labelMap: Record<AgentRunStatus, string> = {
    [AgentRunStatus.PENDING]: 'Pending',
    [AgentRunStatus.RUNNING]: 'Running',
    [AgentRunStatus.COMPLETED]: 'Completed',
    [AgentRunStatus.FAILED]: 'Failed',
    [AgentRunStatus.CANCELLED]: 'Cancelled',
    [AgentRunStatus.PAUSED]: 'Paused',
  } as const;

  return Object.entries(counts).map(([status, count]) => ({
    status: status as AgentRunStatus,
    count,
    label: labelMap[status as AgentRunStatus] || status,
  }));
}

export function hasActiveFilters(filters: AgentRunFilters): boolean {
  return !!(
    (filters.status && filters.status.length > 0) ||
    filters.dateRange ||
    (filters.searchQuery && filters.searchQuery.trim())
  );
}

export function clearFilters(): AgentRunFilters { return {}; }

export function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}


