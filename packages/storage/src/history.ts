import type { QueryHistoryEntry } from './types';
import type { QueryState } from '@crystal-forge/query-dsl';
import {
  ensureDB,
  getAllFromStore,
  putInStore,
  deleteFromStore,
  queryByIndex,
  clearStore,
} from './db';

const STORE_NAME = 'query-history';
const MAX_HISTORY_SIZE = 50;

/**
 * Generate a UUID for history entries
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Add a query to history
 */
export async function addToHistory(
  query: QueryState,
  indexName: string,
  resultCount: number
): Promise<string> {
  const id = generateId();
  const now = new Date();

  const entry: QueryHistoryEntry = {
    id,
    query,
    index_name: indexName,
    result_count: resultCount,
    timestamp: now,
  };

  await putInStore(STORE_NAME, entry);

  // Keep history size under control
  await pruneHistory();

  return id;
}

/**
 * Get all history entries
 */
export async function getAllHistory(): Promise<QueryHistoryEntry[]> {
  const entries = await getAllFromStore<QueryHistoryEntry>(STORE_NAME);
  // Sort by timestamp descending (newest first)
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Get history for a specific index
 */
export async function getHistoryForIndex(indexName: string): Promise<QueryHistoryEntry[]> {
  const entries = await queryByIndex<QueryHistoryEntry>(STORE_NAME, 'index_name', indexName);
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Get history entries within a time range
 */
export async function getHistoryInRange(startDate: Date, endDate: Date): Promise<QueryHistoryEntry[]> {
  const allEntries = await getAllHistory();
  return allEntries.filter(
    (entry) => entry.timestamp >= startDate && entry.timestamp <= endDate
  );
}

/**
 * Delete a history entry
 */
export async function deleteHistoryEntry(id: string): Promise<void> {
  await deleteFromStore(STORE_NAME, id);
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await clearStore(STORE_NAME);
}

/**
 * Prune history to keep it under MAX_HISTORY_SIZE
 */
async function pruneHistory(): Promise<void> {
  const entries = await getAllHistory();

  if (entries.length > MAX_HISTORY_SIZE) {
    // Delete oldest entries
    const toDelete = entries.slice(MAX_HISTORY_SIZE);
    for (const entry of toDelete) {
      await deleteFromStore(STORE_NAME, entry.id);
    }
  }
}

/**
 * Get recent history (last N entries)
 */
export async function getRecentHistory(limit: number = 10): Promise<QueryHistoryEntry[]> {
  const allEntries = await getAllHistory();
  return allEntries.slice(0, limit);
}

/**
 * Export history as JSON
 */
export async function exportHistory(): Promise<string> {
  const entries = await getAllHistory();
  return JSON.stringify(entries, null, 2);
}
