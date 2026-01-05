import type { QueryTemplate } from './types';
import {
  ensureDB,
  getAllFromStore,
  getFromStore,
  putInStore,
  deleteFromStore,
  queryByIndex,
} from './db';

const STORE_NAME = 'query-templates';

/**
 * Generate a UUID for new templates
 */
function generateId(): string {
  // Simple UUID v4 generation without external dependency
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<QueryTemplate[]> {
  return getAllFromStore<QueryTemplate>(STORE_NAME);
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string): Promise<QueryTemplate[]> {
  return queryByIndex<QueryTemplate>(STORE_NAME, 'category', category);
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string): Promise<QueryTemplate | undefined> {
  return getFromStore<QueryTemplate>(STORE_NAME, id);
}

/**
 * Save a new template
 */
export async function saveTemplate(
  template: Omit<QueryTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const id = generateId();
  const now = new Date();

  const newTemplate: QueryTemplate = {
    ...template,
    id,
    created_at: now,
    updated_at: now,
  };

  await putInStore(STORE_NAME, newTemplate);
  return id;
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: string, updates: Partial<QueryTemplate>): Promise<void> {
  const existing = await getTemplateById(id);
  if (!existing) {
    throw new Error(`Template with id ${id} not found`);
  }

  const updated: QueryTemplate = {
    ...existing,
    ...updates,
    id: existing.id, // Don't allow changing ID
    created_at: existing.created_at, // Don't allow changing created_at
    updated_at: new Date(),
  };

  await putInStore(STORE_NAME, updated);
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<void> {
  const template = await getTemplateById(id);
  if (!template) {
    throw new Error(`Template with id ${id} not found`);
  }

  if (template.isBuiltIn) {
    throw new Error('Cannot delete built-in templates');
  }

  await deleteFromStore(STORE_NAME, id);
}

/**
 * Search templates by name
 */
export async function searchTemplates(searchTerm: string): Promise<QueryTemplate[]> {
  const allTemplates = await getAllTemplates();
  const term = searchTerm.toLowerCase();

  return allTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(term) ||
      template.description.toLowerCase().includes(term) ||
      template.tags.some((tag) => tag.toLowerCase().includes(term))
  );
}

/**
 * Get custom templates only (user-created, not built-in)
 */
export async function getCustomTemplates(): Promise<QueryTemplate[]> {
  const allTemplates = await getAllTemplates();
  return allTemplates.filter((template) => !template.isBuiltIn);
}

/**
 * Get built-in templates only
 */
export async function getBuiltInTemplates(): Promise<QueryTemplate[]> {
  const allTemplates = await getAllTemplates();
  return allTemplates.filter((template) => template.isBuiltIn);
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(id: string, newName: string): Promise<string> {
  const original = await getTemplateById(id);
  if (!original) {
    throw new Error(`Template with id ${id} not found`);
  }

  const duplicate: Omit<QueryTemplate, 'id' | 'created_at' | 'updated_at'> = {
    name: newName,
    description: original.description,
    category: original.category,
    tags: original.tags,
    query: original.query,
    aggs: original.aggs,
    isBuiltIn: false, // Duplicated templates are always custom
  };

  return saveTemplate(duplicate);
}

/**
 * Export template as JSON string
 */
export async function exportTemplate(id: string): Promise<string> {
  const template = await getTemplateById(id);
  if (!template) {
    throw new Error(`Template with id ${id} not found`);
  }

  return JSON.stringify(template, null, 2);
}

/**
 * Export all templates as JSON array
 */
export async function exportAllTemplates(): Promise<string> {
  const templates = await getAllTemplates();
  return JSON.stringify(templates, null, 2);
}

/**
 * Import template from JSON string
 */
export async function importTemplate(jsonString: string): Promise<string> {
  try {
    const template = JSON.parse(jsonString) as Omit<QueryTemplate, 'id' | 'created_at' | 'updated_at'>;

    // Validate required fields
    if (!template.name || !template.category || !template.query) {
      throw new Error('Invalid template format: missing required fields');
    }

    // Mark imported templates as custom
    return saveTemplate({
      ...template,
      isBuiltIn: false,
    });
  } catch (error) {
    throw new Error(`Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
