// Type exports
export type { QueryTemplate, QueryHistoryEntry, AggregationTemplate, DBInitResult, StorageConfig } from './types';

// Database initialization
export { initDB, getDB, ensureDB, clearStore, clearDatabase } from './db';

// Template operations
export {
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateById,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  getCustomTemplates,
  getBuiltInTemplates,
  duplicateTemplate,
  exportTemplate,
  exportAllTemplates,
  importTemplate,
} from './templates';

// History operations
export {
  addToHistory,
  getAllHistory,
  getHistoryForIndex,
  getHistoryInRange,
  deleteHistoryEntry,
  clearHistory,
  getRecentHistory,
  exportHistory,
} from './history';

// Aggregation operations
export {
  getAllAggregationTemplates,
  getAggregationTemplatesByCategory,
  getAggregationTemplatesByType,
  getAggregationTemplateById,
  saveAggregationTemplate,
  updateAggregationTemplate,
  deleteAggregationTemplate,
  getCustomAggregationTemplates,
  getBuiltInAggregationTemplates,
  duplicateAggregationTemplate,
  exportAggregationTemplate,
  importAggregationTemplate,
} from './aggregations';

// Seed data
export { BUILT_IN_QUERY_TEMPLATES, BUILT_IN_AGGREGATION_TEMPLATES, seedTemplates } from './seed';
