import type { FieldMapping, IndexMapping } from './types';

/**
 * Information about a parsed field from an OpenSearch mapping
 */
export interface FieldInfo {
  /** Simple field name (e.g., "title") */
  name: string;
  /** OpenSearch field type (e.g., "text", "keyword", "integer") */
  type: string;
  /** Full dot-notation path to the field (e.g., "user.profile.name") */
  path: string;
  /** Whether this field is inside a nested type */
  isNested: boolean;
  /** The nested path if inside a nested type (e.g., "items") */
  nestedPath?: string;
  /** Whether this field is a multi-field (e.g., title.keyword) */
  isMultiField: boolean;
  /** Parent field name for multi-fields */
  parentField?: string;
  /** Whether this field is searchable */
  searchable: boolean;
  /** Whether this field is aggregatable */
  aggregatable: boolean;
  /** Additional field properties */
  properties: {
    analyzer?: string;
    searchAnalyzer?: string;
    format?: string;
    index?: boolean;
    docValues?: boolean;
    store?: boolean;
  };
}

/**
 * Context for recursive mapping traversal
 */
interface FlattenContext {
  /** Current path prefix */
  pathPrefix: string;
  /** Current nested path (if inside a nested type) */
  nestedPath?: string;
  /** Whether currently inside a nested type */
  isNested: boolean;
}

/**
 * Determine if a field type is searchable by default
 */
function isSearchableByDefault(type: string): boolean {
  const searchableTypes = [
    'text',
    'keyword',
    'wildcard',
    'constant_keyword',
    'match_only_text',
    'date',
    'date_nanos',
    'boolean',
    'ip',
    'integer',
    'long',
    'short',
    'byte',
    'float',
    'double',
    'half_float',
    'scaled_float',
    'unsigned_long',
  ];
  return searchableTypes.includes(type);
}

/**
 * Determine if a field type is aggregatable by default
 */
function isAggregatableByDefault(type: string): boolean {
  // Text fields are not aggregatable by default (need fielddata or .keyword)
  const nonAggregatableTypes = ['text', 'match_only_text', 'annotated-text'];
  return !nonAggregatableTypes.includes(type);
}

/**
 * Recursively flatten a field mapping into a list of FieldInfo objects
 */
function flattenMapping(
  properties: Record<string, FieldMapping>,
  context: FlattenContext,
  results: FieldInfo[]
): void {
  for (const [fieldName, mapping] of Object.entries(properties)) {
    const currentPath = context.pathPrefix
      ? `${context.pathPrefix}.${fieldName}`
      : fieldName;

    const fieldType = mapping.type || 'object';

    // Handle nested type - update context for children
    const isNestedField = fieldType === 'nested';
    const newNestedPath = isNestedField ? currentPath : context.nestedPath;
    const isInsideNested = context.isNested || isNestedField;

    // Add the field itself (skip pure object types without explicit type)
    if (mapping.type || !mapping.properties) {
      const searchable =
        mapping.index !== false && isSearchableByDefault(fieldType);
      const aggregatable =
        mapping.doc_values !== false && isAggregatableByDefault(fieldType);

      results.push({
        name: fieldName,
        type: fieldType,
        path: currentPath,
        isNested: isInsideNested,
        nestedPath: isInsideNested ? newNestedPath : undefined,
        isMultiField: false,
        searchable,
        aggregatable,
        properties: {
          analyzer: mapping.analyzer,
          searchAnalyzer: mapping.search_analyzer,
          format: mapping.format,
          index: mapping.index,
          docValues: mapping.doc_values,
          store: mapping.store,
        },
      });
    }

    // Handle multi-fields (e.g., title.keyword)
    if (mapping.fields) {
      for (const [subFieldName, subMapping] of Object.entries(mapping.fields)) {
        const subFieldPath = `${currentPath}.${subFieldName}`;
        const subFieldType = subMapping.type || 'keyword';

        results.push({
          name: subFieldName,
          type: subFieldType,
          path: subFieldPath,
          isNested: isInsideNested,
          nestedPath: isInsideNested ? newNestedPath : undefined,
          isMultiField: true,
          parentField: currentPath,
          searchable:
            subMapping.index !== false && isSearchableByDefault(subFieldType),
          aggregatable:
            subMapping.doc_values !== false &&
            isAggregatableByDefault(subFieldType),
          properties: {
            analyzer: subMapping.analyzer,
            searchAnalyzer: subMapping.search_analyzer,
            format: subMapping.format,
            index: subMapping.index,
            docValues: subMapping.doc_values,
            store: subMapping.store,
          },
        });
      }
    }

    // Recursively process nested properties
    if (mapping.properties) {
      flattenMapping(mapping.properties, {
        pathPrefix: currentPath,
        nestedPath: newNestedPath,
        isNested: isInsideNested,
      }, results);
    }
  }
}

/**
 * Parse an OpenSearch index mapping into a flat list of field information
 *
 * @param mapping - The index mapping from OpenSearch
 * @returns Array of FieldInfo objects describing each field
 *
 * @example
 * ```typescript
 * const client = new OpenSearchClient({ host: 'http://localhost:9200' });
 * const mapping = await client.getMapping('my-index');
 * const fields = parseMapping(mapping);
 *
 * // Find all text fields
 * const textFields = fields.filter(f => f.type === 'text');
 *
 * // Find all nested fields
 * const nestedFields = fields.filter(f => f.isNested);
 * ```
 */
export function parseMapping(mapping: IndexMapping): FieldInfo[] {
  const results: FieldInfo[] = [];

  if (mapping.mappings.properties) {
    flattenMapping(
      mapping.mappings.properties,
      {
        pathPrefix: '',
        isNested: false,
      },
      results
    );
  }

  return results;
}

/**
 * Get all fields of a specific type from a mapping
 *
 * @param mapping - The index mapping
 * @param type - The field type to filter by
 */
export function getFieldsByType(mapping: IndexMapping, type: string): FieldInfo[] {
  return parseMapping(mapping).filter((field) => field.type === type);
}

/**
 * Get all searchable fields from a mapping
 *
 * @param mapping - The index mapping
 */
export function getSearchableFields(mapping: IndexMapping): FieldInfo[] {
  return parseMapping(mapping).filter((field) => field.searchable);
}

/**
 * Get all aggregatable fields from a mapping
 *
 * @param mapping - The index mapping
 */
export function getAggregatableFields(mapping: IndexMapping): FieldInfo[] {
  return parseMapping(mapping).filter((field) => field.aggregatable);
}

/**
 * Get all nested field paths from a mapping
 *
 * @param mapping - The index mapping
 * @returns Array of unique nested paths
 */
export function getNestedPaths(mapping: IndexMapping): string[] {
  const fields = parseMapping(mapping);
  const nestedPaths = new Set<string>();

  for (const field of fields) {
    if (field.type === 'nested') {
      nestedPaths.add(field.path);
    }
  }

  return Array.from(nestedPaths);
}

/**
 * Build a field hierarchy tree from flat field list
 */
export interface FieldNode {
  name: string;
  path: string;
  type: string;
  info?: FieldInfo;
  children: Map<string, FieldNode>;
}

/**
 * Build a hierarchical tree structure from field information
 *
 * @param fields - Array of FieldInfo from parseMapping
 * @returns Root node of the field tree
 */
export function buildFieldTree(fields: FieldInfo[]): FieldNode {
  const root: FieldNode = {
    name: '',
    path: '',
    type: 'root',
    children: new Map(),
  };

  for (const field of fields) {
    const parts = field.path.split('.');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const partPath = parts.slice(0, i + 1).join('.');

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: partPath,
          type: i === parts.length - 1 ? field.type : 'object',
          children: new Map(),
        });
      }

      const node = current.children.get(part)!;

      // Update with full info on the final node
      if (i === parts.length - 1) {
        node.info = field;
        node.type = field.type;
      }

      current = node;
    }
  }

  return root;
}
