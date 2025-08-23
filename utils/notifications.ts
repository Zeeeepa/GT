import { AgentRun } from '../types';

const SEEN_KEY = 'agent_unseen_count';
const LAST_STATUSES_KEY = 'agent_last_statuses';

function readNumber(key: string, def: number = 0): number {
  try {
    const v = localStorage.getItem(key);
    if (!v) return def;
    const n = parseInt(v, 10);
    return isNaN(n) ? def : n;
  } catch {
    return def;
  }
}

function writeNumber(key: string, val: number): void {
  try { localStorage.setItem(key, String(val)); } catch {}
}

function readStatuses(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LAST_STATUSES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStatuses(map: Record<string, string>): void {
  try { localStorage.setItem(LAST_STATUSES_KEY, JSON.stringify(map)); } catch {}
}

export function getUnseenCount(): number {
  return readNumber(SEEN_KEY, 0);
}

export function clearUnseen(): void {
  writeNumber(SEEN_KEY, 0);
}

export function setUnseenCount(n: number): void {
  writeNumber(SEEN_KEY, Math.max(0, n));
}

export function incrementUnseen(by: number = 1): void {
  const cur = getUnseenCount();
  setUnseenCount(cur + Math.max(0, by));
}

export function updateWithRuns(runs: AgentRun[]): number {
  const last = readStatuses();
  let changes = 0;
  const next: Record<string, string> = { ...last };

  for (const r of runs) {
    const id = String(r.id);
    const prev = last[id];
    const now = r.status;
    if (prev && prev !== now) {
      changes += 1;
    }
    next[id] = now;
  }

  if (changes > 0) incrementUnseen(changes);
  writeStatuses(next);
  return getUnseenCount();
}


