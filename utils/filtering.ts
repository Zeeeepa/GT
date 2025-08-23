import { AgentRun, AgentRunStatus, SortOption } from "../types";

// Define the interfaces that were missing
export interface AgentRunFilters {
  status?: AgentRunStatus[];
  searchQuery?: string;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export function filterAgentRuns(runs: AgentRun[], filters: AgentRunFilters): AgentRun[] {
  let filteredRuns = [...runs];

  if (filters.status && filters.status.length > 0) {
    const statusSet = new Set(filters.status.map(s => s.toLowerCase()));
    filteredRuns = filteredRuns.filter(run => run.status && statusSet.has(run.status.toLowerCase()));
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase().trim();
    filteredRuns = filteredRuns.filter(run => 
      run.prompt?.toLowerCase().includes(query) || run.id.toString().includes(query)
    );
  }

  return filteredRuns;
}

export function sortAgentRuns(runs: AgentRun[], sortOptions: SortOptions): AgentRun[] {
  return [...runs].sort((a, b) => {
    let comparison = 0;
    if (sortOptions.field === "created_at") {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      // Add other sort fields if necessary
    }
    return sortOptions.direction === "desc" ? -comparison : comparison;
  });
}

export function getDateRanges(): Record<string, { start: Date; end: Date }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { today: { start: today, end: now } };
}

export function getStatusFilterOptions(runs: AgentRun[]): Array<{ status: AgentRunStatus; count: number; label: string }> {
    const statusCounts = runs.reduce((acc, run) => {
        if (run.status) {
            const status = run.status.toUpperCase() as AgentRunStatus;
            if (Object.values(AgentRunStatus).includes(status)) {
                acc[status] = (acc[status] || 0) + 1;
            }
        }
        return acc;
    }, {} as Record<AgentRunStatus, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
        status: status as AgentRunStatus,
        count: count as number,
        label: status.charAt(0) + status.slice(1).toLowerCase(),
    }));
}

export function hasActiveFilters(filters: AgentRunFilters): boolean {
  return !!((filters.status && filters.status.length > 0) || (filters.searchQuery && filters.searchQuery.trim()));
}

export function clearFilters(): AgentRunFilters {
  return {};
}
