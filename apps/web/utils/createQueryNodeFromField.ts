import type { QueryNode } from '@crystal-forge/query-dsl';
import type { FieldInfo } from '@crystal-forge/opensearch-client';

let nodeIdCounter = 0;

function generateNodeId(): string {
  nodeIdCounter += 1;
  return `node_${nodeIdCounter}`;
}

/**
 * Create an appropriate query node based on field type
 * - text → match query (full-text search)
 * - keyword → term query (exact match)
 * - numeric/date → range query
 * - boolean → term query with true default
 */
export function createQueryNodeFromField(field: FieldInfo): QueryNode {
  const id = generateNodeId();

  switch (field.type) {
    case 'text':
      return {
        id,
        type: 'match',
        field: field.path,
        value: '',
      };

    case 'keyword':
      return {
        id,
        type: 'term',
        field: field.path,
        value: '',
      };

    case 'long':
    case 'integer':
    case 'short':
    case 'byte':
    case 'double':
    case 'float':
      return {
        id,
        type: 'range',
        field: field.path,
      };

    case 'date':
      return {
        id,
        type: 'range',
        field: field.path,
      };

    case 'boolean':
      return {
        id,
        type: 'term',
        field: field.path,
        value: true,
      };

    default:
      // Fallback to match query
      return {
        id,
        type: 'match',
        field: field.path,
        value: '',
      };
  }
}
