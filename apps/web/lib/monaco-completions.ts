/**
 * Monaco Editor Completion Provider for OpenSearch Query DSL
 * Provides context-aware autocomplete suggestions
 */

import * as monaco from 'monaco-editor';

/**
 * Query type suggestions
 */
const QUERY_TYPES = [
  'match',
  'match_phrase',
  'match_phrase_prefix',
  'multi_match',
  'query_string',
  'simple_query_string',
  'term',
  'terms',
  'range',
  'exists',
  'prefix',
  'wildcard',
  'regexp',
  'fuzzy',
  'bool',
  'boosting',
  'constant_score',
  'dis_max',
  'function_score',
  'nested',
  'geo_distance',
  'geo_bounding_box',
  'match_all',
  'match_none',
];

/**
 * Aggregation type suggestions
 */
const AGGREGATION_TYPES = [
  'terms',
  'stats',
  'extended_stats',
  'date_histogram',
  'histogram',
  'range',
  'cardinality',
  'avg',
  'sum',
  'min',
  'max',
  'value_count',
];

/**
 * Bool clause keywords
 */
const BOOL_CLAUSES = ['must', 'should', 'must_not', 'filter'];

/**
 * Top-level request body properties
 */
const REQUEST_PROPERTIES = [
  'query',
  'aggs',
  'size',
  'from',
  'timeout',
  '_source',
  'highlight',
  'sort',
  'track_scores',
  'explain',
  'version',
  'seq_no_primary_term',
  'pit',
  'search_after',
  'min_score',
  'indices_boost',
];

/**
 * Query node properties
 */
const QUERY_PROPERTIES = [
  'type',
  'id',
  'field',
  'value',
  'values',
  'operator',
  'fuzziness',
  'boost',
  'must',
  'should',
  'must_not',
  'filter',
  'minimum_should_match',
  'query',
  'positive',
  'negative',
  'negative_boost',
  'path',
  'score_mode',
  'lat',
  'lon',
  'distance',
  'fields',
];

/**
 * Get position context in the JSON
 */
function getJsonContext(model: monaco.editor.ITextModel, position: monaco.Position): string {
  const text = model.getValue();
  const offset = model.getOffsetAt(position);

  // Find the nearest opening bracket/brace
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  let context = '';

  for (let i = offset - 1; i >= 0; i--) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '}') braceCount++;
    if (char === '{') braceCount--;
    if (char === ']') bracketCount++;
    if (char === '[') bracketCount--;

    if (braceCount === 0 && bracketCount === 0) {
      context += char;
    }

    if (braceCount < 0 || bracketCount < 0) {
      break;
    }
  }

  return context.trim();
}

/**
 * Parse key path from context
 */
function getKeyPath(context: string): string[] {
  const keys: string[] = [];
  const regex = /"([^"]*)":/g;
  let match;

  while ((match = regex.exec(context)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

/**
 * Check if we're in a query context
 */
function isInQueryContext(keyPath: string[]): boolean {
  return (
    keyPath.includes('query') ||
    keyPath.includes('must') ||
    keyPath.includes('should') ||
    keyPath.includes('must_not') ||
    keyPath.includes('filter') ||
    keyPath.includes('positive') ||
    keyPath.includes('negative')
  );
}

/**
 * Check if we're in a bool context
 */
function isInBoolContext(keyPath: string[]): boolean {
  return (
    keyPath[keyPath.length - 2] === 'type' &&
    keyPath[keyPath.length - 1] === 'bool'
  );
}

/**
 * Register Monaco completion provider
 */
export function registerCompletionProvider(
  editor: monaco.editor.IStandaloneCodeEditor
): void {
  monaco.languages.registerCompletionItemProvider('json', {
    provideCompletionItems: (model, position) => {
      const suggestions: any[] = [];
      const lineContent = model.getLineContent(position.lineNumber);
      const lineUntilPosition = lineContent.substring(0, position.column - 1);

      // Determine context
      const context = getJsonContext(model, position);
      const keyPath = getKeyPath(context);

      // Check if we're starting a property name (after : or ,)
      const isPropertyName = lineUntilPosition.match(/[:,]\s*"?$/) || lineUntilPosition.match(/\{\s*"?$/);
      const isPropertyValue = lineUntilPosition.match(/:\s*"?$/) || lineUntilPosition.match(/:\s*\[?$/);

      // Suggest top-level properties
      if (keyPath.length === 0 && isPropertyName) {
        REQUEST_PROPERTIES.forEach((prop) => {
          suggestions.push({
            label: prop,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `"${prop}": `,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: `Top-level property`,
            documentation: `Add ${prop} property to the query`,
          });
        });
      }

      // Suggest query types
      if (isPropertyValue && (keyPath[keyPath.length - 1] === 'type' || lineUntilPosition.includes('"type":'))) {
        const isInBool = isInBoolContext(keyPath);
        const types = isInBool ? ['bool', 'match', 'term', 'range', 'exists'] : QUERY_TYPES;

        types.forEach((type) => {
          suggestions.push({
            label: type,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: `"${type}"`,
            detail: `Query type`,
            documentation: `${type} query type`,
          });
        });
      }

      // Suggest aggregation types
      if (isPropertyValue && keyPath[keyPath.length - 1] === 'type' && keyPath[keyPath.length - 3] === 'aggs') {
        AGGREGATION_TYPES.forEach((agg) => {
          suggestions.push({
            label: agg,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: `"${agg}"`,
            detail: `Aggregation type`,
            documentation: `${agg} aggregation`,
          });
        });
      }

      // Suggest bool clauses
      if (isInQueryContext(keyPath) && isPropertyName && lineUntilPosition.includes('"type": "bool"')) {
        BOOL_CLAUSES.forEach((clause) => {
          suggestions.push({
            label: clause,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `"${clause}": []`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Bool clause',
            documentation: `Add ${clause} clause to bool query`,
          });
        });
      }

      // Suggest query node properties
      if (isPropertyName && isInQueryContext(keyPath)) {
        QUERY_PROPERTIES.forEach((prop) => {
          suggestions.push({
            label: prop,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `"${prop}": `,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: `Query property`,
            documentation: `Add ${prop} property`,
          });
        });
      }

      return { suggestions };
    },
  });
}

/**
 * Register custom hover provider with documentation
 */
export function registerHoverProvider(): void {
  monaco.languages.registerHoverProvider('json', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const content = word.word;

      // Document query types
      const queryTypeInfo: Record<string, string> = {
        match: 'Full-text search using analyzed tokens',
        term: 'Exact match in keyword fields',
        range: 'Match documents within a range',
        bool: 'Combine multiple queries with boolean logic',
        nested: 'Query nested objects',
        geo_distance: 'Query by geographic distance',
      };

      const documentation = queryTypeInfo[content];
      if (documentation) {
        return {
          contents: [{ value: `**${content}**\n\n${documentation}` }],
        };
      }

      return null;
    },
  });
}
