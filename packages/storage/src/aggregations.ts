import type { AggregationTemplate } from './types';
import {
  ensureDB,
  getAllFromStore,
  getFromStore,
  putInStore,
  deleteFromStore,
  queryByIndex,
} from './db';

const STORE_NAME = 'aggregation-templates';

/**
 * Generate a UUID for aggregation templates
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get all aggregation templates
 */
export async function getAllAggregationTemplates(): Promise<AggregationTemplate[]> {
  return getAllFromStore<AggregationTemplate>(STORE_NAME);
}

/**
 * Get aggregation templates by category
 */
export async function getAggregationTemplatesByCategory(category: string): Promise<AggregationTemplate[]> {
  return queryByIndex<AggregationTemplate>(STORE_NAME, 'category', category);
}

/**
 * Get aggregation templates by type
 */
export async function getAggregationTemplatesByType(aggType: string): Promise<AggregationTemplate[]> {
  return queryByIndex<AggregationTemplate>(STORE_NAME, 'agg_type', aggType);
}

/**
 * Get aggregation template by ID
 */
export async function getAggregationTemplateById(id: string): Promise<AggregationTemplate | undefined> {
  return getFromStore<AggregationTemplate>(STORE_NAME, id);
}

/**
 * Save a new aggregation template
 */
export async function saveAggregationTemplate(
  template: Omit<AggregationTemplate, 'id' | 'created_at'>
): Promise<string> {
  const id = generateId();
  const now = new Date();

  const newTemplate: AggregationTemplate = {
    ...template,
    id,
    created_at: now,
  };

  await putInStore(STORE_NAME, newTemplate);
  return id;
}

/**
 * Update an existing aggregation template
 */
export async function updateAggregationTemplate(
  id: string,
  updates: Partial<AggregationTemplate>
): Promise<void> {
  const existing = await getAggregationTemplateById(id);
  if (!existing) {
    throw new Error(`Aggregation template with id ${id} not found`);
  }

  const updated: AggregationTemplate = {
    ...existing,
    ...updates,
    id: existing.id, // Don't allow changing ID
    created_at: existing.created_at, // Don't allow changing created_at
  };

  await putInStore(STORE_NAME, updated);
}

/**
 * Delete an aggregation template
 */
export async function deleteAggregationTemplate(id: string): Promise<void> {
  const template = await getAggregationTemplateById(id);
  if (!template) {
    throw new Error(`Aggregation template with id ${id} not found`);
  }

  if (template.isBuiltIn) {
    throw new Error('Cannot delete built-in aggregation templates');
  }

  await deleteFromStore(STORE_NAME, id);
}

/**
 * Get custom aggregation templates (user-created)
 */
export async function getCustomAggregationTemplates(): Promise<AggregationTemplate[]> {
  const allTemplates = await getAllAggregationTemplates();
  return allTemplates.filter((template) => !template.isBuiltIn);
}

/**
 * Get built-in aggregation templates
 */
export async function getBuiltInAggregationTemplates(): Promise<AggregationTemplate[]> {
  const allTemplates = await getAllAggregationTemplates();
  return allTemplates.filter((template) => template.isBuiltIn);
}

/**
 * Duplicate an aggregation template
 */
export async function duplicateAggregationTemplate(id: string, newName: string): Promise<string> {
  const original = await getAggregationTemplateById(id);
  if (!original) {
    throw new Error(`Aggregation template with id ${id} not found`);
  }

  const duplicate: Omit<AggregationTemplate, 'id' | 'created_at'> = {
    ...original,
    name: newName,
    isBuiltIn: false, // Duplicated templates are always custom
  };

  return saveAggregationTemplate(duplicate);
}

/**
 * Export aggregation template as JSON
 */
export async function exportAggregationTemplate(id: string): Promise<string> {
  const template = await getAggregationTemplateById(id);
  if (!template) {
    throw new Error(`Aggregation template with id ${id} not found`);
  }

  return JSON.stringify(template, null, 2);
}

/**
 * Import aggregation template from JSON
 */
export async function importAggregationTemplate(jsonString: string): Promise<string> {
  try {
    const template = JSON.parse(jsonString) as Omit<AggregationTemplate, 'id' | 'created_at'>;

    // Validate required fields
    if (!template.name || !template.agg_type || !template.config) {
      throw new Error('Invalid aggregation template format: missing required fields');
    }

    // Mark imported templates as custom
    return saveAggregationTemplate({
      ...template,
      isBuiltIn: false,
    });
  } catch (error) {
    throw new Error(
      `Failed to import aggregation template: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
