/**
 * Query Validator Module
 *
 * Provides validation functions for OpenSearch query structures.
 * Ensures queries are well-formed before execution.
 */

// ============================================================================
// Types (will be imported from @crystal-forge/query-dsl when available)
// ============================================================================

/**
 * Supported query types in OpenSearch
 */
export type QueryType =
  | 'match'
  | 'match_phrase'
  | 'term'
  | 'terms'
  | 'range'
  | 'bool'
  | 'exists'
  | 'wildcard'
  | 'prefix'
  | 'fuzzy'
  | 'regexp'
  | 'nested'
  | 'match_all';

/**
 * Field types supported in OpenSearch
 */
export type FieldType =
  | 'text'
  | 'keyword'
  | 'long'
  | 'integer'
  | 'short'
  | 'byte'
  | 'double'
  | 'float'
  | 'date'
  | 'boolean'
  | 'object'
  | 'nested'
  | 'geo_point'
  | 'ip';

/**
 * Operators available for query conditions
 */
export type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'exists'
  | 'not_exists'
  | 'in'
  | 'not_in'
  | 'between'
  | 'regex';

/**
 * Boolean clause types
 */
export type BoolClause = 'must' | 'must_not' | 'should' | 'filter';

/**
 * Represents a single query node in the query tree
 */
export interface QueryNode {
  id: string;
  type: QueryType;
  field?: string;
  operator?: Operator;
  value?: unknown;
  children?: QueryNode[];
  boolClause?: BoolClause;
  boost?: number;
  options?: Record<string, unknown>;
}

/**
 * Complete query state including metadata
 */
export interface QueryState {
  root: QueryNode;
  version?: string;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    name?: string;
    description?: string;
  };
}

/**
 * Field definition for schema validation
 */
export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  nested?: FieldDefinition[];
}

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Validation error codes for categorizing issues
 */
export type ValidationErrorCode =
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FIELD_TYPE'
  | 'INVALID_OPERATOR'
  | 'INVALID_VALUE'
  | 'INVALID_QUERY_TYPE'
  | 'MISSING_CHILDREN'
  | 'INVALID_BOOL_CLAUSE'
  | 'OPERATOR_TYPE_MISMATCH'
  | 'INVALID_NODE_STRUCTURE'
  | 'UNKNOWN_FIELD'
  | 'INVALID_BOOST'
  | 'EMPTY_VALUE'
  | 'INVALID_RANGE';

/**
 * Represents a single validation error
 */
export interface ValidationError {
  /** JSON path to the error location (e.g., "root.children[0].field") */
  path: string;
  /** Human-readable error message */
  message: string;
  /** Error code for programmatic handling */
  code: ValidationErrorCode;
  /** Additional context about the error */
  context?: Record<string, unknown>;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** List of validation errors (empty if valid) */
  errors: ValidationError[];
  /** Warnings that don't prevent query execution */
  warnings?: ValidationError[];
}

/**
 * Options for validation functions
 */
export interface ValidationOptions {
  /** Schema of available fields for field validation */
  schema?: FieldDefinition[];
  /** Whether to validate field names against schema */
  validateFields?: boolean;
  /** Whether to include warnings for non-critical issues */
  includeWarnings?: boolean;
  /** Custom error messages */
  customMessages?: Partial<Record<ValidationErrorCode, string>>;
}

// ============================================================================
// Operator-FieldType Compatibility Map
// ============================================================================

/**
 * Maps field types to their valid operators
 */
const FIELD_TYPE_OPERATORS: Record<FieldType, Operator[]> = {
  text: ['eq', 'neq', 'contains', 'not_contains', 'starts_with', 'ends_with', 'exists', 'not_exists', 'regex'],
  keyword: ['eq', 'neq', 'contains', 'starts_with', 'ends_with', 'exists', 'not_exists', 'in', 'not_in', 'regex'],
  long: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists', 'in', 'not_in', 'between'],
  integer: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists', 'in', 'not_in', 'between'],
  short: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists', 'in', 'not_in', 'between'],
  byte: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists', 'in', 'not_in', 'between'],
  double: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists', 'in', 'not_in', 'between'],
  float: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists', 'in', 'not_in', 'between'],
  date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists', 'between'],
  boolean: ['eq', 'neq', 'exists', 'not_exists'],
  object: ['exists', 'not_exists'],
  nested: ['exists', 'not_exists'],
  geo_point: ['exists', 'not_exists'],
  ip: ['eq', 'neq', 'exists', 'not_exists', 'in', 'not_in'],
};

/**
 * Required fields per query type
 */
const REQUIRED_FIELDS_BY_TYPE: Record<QueryType, (keyof QueryNode)[]> = {
  match: ['field', 'value'],
  match_phrase: ['field', 'value'],
  term: ['field', 'value'],
  terms: ['field', 'value'],
  range: ['field', 'value'],
  bool: ['children'],
  exists: ['field'],
  wildcard: ['field', 'value'],
  prefix: ['field', 'value'],
  fuzzy: ['field', 'value'],
  regexp: ['field', 'value'],
  nested: ['field', 'children'],
  match_all: [],
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Creates a validation error object
 */
function createError(
  path: string,
  code: ValidationErrorCode,
  message: string,
  context?: Record<string, unknown>
): ValidationError {
  return { path, code, message, context };
}

/**
 * Validates that an operator is compatible with a field type
 *
 * @param operator - The operator to validate
 * @param fieldType - The field type to check against
 * @returns ValidationResult indicating if the operator is valid for the field type
 *
 * @example
 * ```ts
 * const result = validateFieldTypeMatch('gt', 'integer');
 * // { isValid: true, errors: [] }
 *
 * const result2 = validateFieldTypeMatch('contains', 'boolean');
 * // { isValid: false, errors: [{ code: 'OPERATOR_TYPE_MISMATCH', ... }] }
 * ```
 */
export function validateFieldTypeMatch(
  operator: Operator,
  fieldType: FieldType,
  path: string = ''
): ValidationResult {
  const errors: ValidationError[] = [];

  const validOperators = FIELD_TYPE_OPERATORS[fieldType];

  if (!validOperators) {
    errors.push(
      createError(path, 'INVALID_FIELD_TYPE', `Unknown field type: ${fieldType}`, {
        fieldType,
      })
    );
    return { isValid: false, errors };
  }

  if (!validOperators.includes(operator)) {
    errors.push(
      createError(
        path,
        'OPERATOR_TYPE_MISMATCH',
        `Operator '${operator}' is not valid for field type '${fieldType}'. Valid operators: ${validOperators.join(', ')}`,
        { operator, fieldType, validOperators }
      )
    );
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates that required fields are present for a given query type
 *
 * @param node - The query node to validate
 * @param path - The current path in the query tree
 * @returns ValidationResult with any missing field errors
 *
 * @example
 * ```ts
 * const node = { id: '1', type: 'match', field: 'title' };
 * const result = validateRequiredFields(node);
 * // { isValid: false, errors: [{ code: 'MISSING_REQUIRED_FIELD', message: '...value...' }] }
 * ```
 */
export function validateRequiredFields(
  node: QueryNode,
  path: string = 'root'
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!node.type) {
    errors.push(
      createError(path, 'INVALID_QUERY_TYPE', 'Query node is missing required "type" field')
    );
    return { isValid: false, errors };
  }

  const requiredFields = REQUIRED_FIELDS_BY_TYPE[node.type];

  if (!requiredFields) {
    errors.push(
      createError(path, 'INVALID_QUERY_TYPE', `Unknown query type: ${node.type}`, {
        type: node.type,
      })
    );
    return { isValid: false, errors };
  }

  for (const field of requiredFields) {
    const value = node[field];

    if (value === undefined || value === null) {
      errors.push(
        createError(
          `${path}.${field}`,
          'MISSING_REQUIRED_FIELD',
          `Query type '${node.type}' requires field '${field}'`,
          { queryType: node.type, field }
        )
      );
    } else if (field === 'children' && Array.isArray(value) && value.length === 0) {
      errors.push(
        createError(
          `${path}.${field}`,
          'MISSING_CHILDREN',
          `Query type '${node.type}' requires at least one child node`,
          { queryType: node.type }
        )
      );
    } else if (field === 'value' && value === '') {
      errors.push(
        createError(
          `${path}.${field}`,
          'EMPTY_VALUE',
          `Query type '${node.type}' requires a non-empty value`,
          { queryType: node.type }
        )
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a single QueryNode and its children recursively
 *
 * @param node - The query node to validate
 * @param options - Validation options
 * @param path - The current path in the query tree (for error reporting)
 * @returns ValidationResult with all found errors
 *
 * @example
 * ```ts
 * const node: QueryNode = {
 *   id: '1',
 *   type: 'bool',
 *   children: [
 *     { id: '2', type: 'match', field: 'title', value: 'test', boolClause: 'must' }
 *   ]
 * };
 * const result = validateQueryNode(node);
 * // { isValid: true, errors: [] }
 * ```
 */
export function validateQueryNode(
  node: QueryNode,
  options: ValidationOptions = {},
  path: string = 'root'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate node has required id
  if (!node.id) {
    errors.push(
      createError(path, 'INVALID_NODE_STRUCTURE', 'Query node is missing required "id" field')
    );
  }

  // Validate required fields for query type
  const requiredFieldsResult = validateRequiredFields(node, path);
  errors.push(...requiredFieldsResult.errors);

  // Validate boost if present
  if (node.boost !== undefined) {
    if (typeof node.boost !== 'number' || node.boost < 0) {
      errors.push(
        createError(
          `${path}.boost`,
          'INVALID_BOOST',
          'Boost must be a non-negative number',
          { boost: node.boost }
        )
      );
    }
  }

  // Validate bool clause if present
  if (node.boolClause !== undefined) {
    const validClauses: BoolClause[] = ['must', 'must_not', 'should', 'filter'];
    if (!validClauses.includes(node.boolClause)) {
      errors.push(
        createError(
          `${path}.boolClause`,
          'INVALID_BOOL_CLAUSE',
          `Invalid bool clause: '${node.boolClause}'. Must be one of: ${validClauses.join(', ')}`,
          { boolClause: node.boolClause, validClauses }
        )
      );
    }
  }

  // Validate operator if field type is known (schema provided)
  if (options.validateFields && options.schema && node.field && node.operator) {
    const fieldDef = findFieldDefinition(node.field, options.schema);
    if (fieldDef) {
      const typeMatchResult = validateFieldTypeMatch(node.operator, fieldDef.type, `${path}.operator`);
      errors.push(...typeMatchResult.errors);
    } else if (options.includeWarnings) {
      warnings.push(
        createError(
          `${path}.field`,
          'UNKNOWN_FIELD',
          `Field '${node.field}' is not defined in schema`,
          { field: node.field }
        )
      );
    }
  }

  // Validate range values
  if (node.type === 'range' && node.value !== undefined) {
    const rangeValidation = validateRangeValue(node.value, `${path}.value`);
    errors.push(...rangeValidation.errors);
  }

  // Recursively validate children
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child, index) => {
      const childResult = validateQueryNode(child, options, `${path}.children[${index}]`);
      errors.push(...childResult.errors);
      if (childResult.warnings) {
        warnings.push(...childResult.warnings);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    ...(options.includeWarnings && warnings.length > 0 ? { warnings } : {}),
  };
}

/**
 * Validates a complete QueryState object
 *
 * @param state - The query state to validate
 * @param options - Validation options
 * @returns ValidationResult with all found errors
 *
 * @example
 * ```ts
 * const state: QueryState = {
 *   root: {
 *     id: '1',
 *     type: 'match_all'
 *   }
 * };
 * const result = validateQueryState(state);
 * // { isValid: true, errors: [] }
 * ```
 */
export function validateQueryState(
  state: QueryState,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate state structure
  if (!state) {
    errors.push(
      createError('', 'INVALID_NODE_STRUCTURE', 'Query state is null or undefined')
    );
    return { isValid: false, errors };
  }

  if (!state.root) {
    errors.push(
      createError('root', 'INVALID_NODE_STRUCTURE', 'Query state is missing root node')
    );
    return { isValid: false, errors };
  }

  // Validate the root node and all children
  const nodeResult = validateQueryNode(state.root, options, 'root');
  errors.push(...nodeResult.errors);
  if (nodeResult.warnings) {
    warnings.push(...nodeResult.warnings);
  }

  // Validate metadata if present
  if (state.metadata) {
    if (state.metadata.createdAt && !isValidISODate(state.metadata.createdAt)) {
      if (options.includeWarnings) {
        warnings.push(
          createError(
            'metadata.createdAt',
            'INVALID_VALUE',
            'createdAt should be a valid ISO 8601 date string',
            { value: state.metadata.createdAt }
          )
        );
      }
    }
    if (state.metadata.updatedAt && !isValidISODate(state.metadata.updatedAt)) {
      if (options.includeWarnings) {
        warnings.push(
          createError(
            'metadata.updatedAt',
            'INVALID_VALUE',
            'updatedAt should be a valid ISO 8601 date string',
            { value: state.metadata.updatedAt }
          )
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    ...(options.includeWarnings && warnings.length > 0 ? { warnings } : {}),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Finds a field definition by name, supporting nested paths (e.g., "user.address.city")
 */
function findFieldDefinition(
  fieldPath: string,
  schema: FieldDefinition[]
): FieldDefinition | undefined {
  const parts = fieldPath.split('.');
  let current: FieldDefinition[] | undefined = schema;

  for (let i = 0; i < parts.length; i++) {
    if (!current) return undefined;

    const part = parts[i];
    const field: FieldDefinition | undefined = current.find((f) => f.name === part);
    if (!field) return undefined;

    if (i === parts.length - 1) {
      return field;
    }

    current = field.nested;
  }

  return undefined;
}

/**
 * Validates range value structure
 */
function validateRangeValue(value: unknown, path: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'object' || value === null) {
    errors.push(
      createError(
        path,
        'INVALID_VALUE',
        'Range query value must be an object with gt, gte, lt, or lte properties',
        { value }
      )
    );
    return { isValid: false, errors };
  }

  const rangeValue = value as Record<string, unknown>;
  const validKeys = ['gt', 'gte', 'lt', 'lte', 'format', 'time_zone'];
  const hasRangeBound = ['gt', 'gte', 'lt', 'lte'].some((key) => key in rangeValue);

  if (!hasRangeBound) {
    errors.push(
      createError(
        path,
        'INVALID_RANGE',
        'Range query must have at least one of: gt, gte, lt, lte',
        { value }
      )
    );
  }

  // Check for invalid keys
  for (const key of Object.keys(rangeValue)) {
    if (!validKeys.includes(key)) {
      errors.push(
        createError(
          `${path}.${key}`,
          'INVALID_VALUE',
          `Unknown range property: '${key}'`,
          { key, validKeys }
        )
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates if a string is a valid ISO 8601 date
 */
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('-');
}

/**
 * Utility function to merge multiple validation results
 */
export function mergeValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  for (const result of results) {
    allErrors.push(...result.errors);
    if (result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    ...(allWarnings.length > 0 ? { warnings: allWarnings } : {}),
  };
}

/**
 * Creates a validator function with preset options
 */
export function createValidator(
  defaultOptions: ValidationOptions
): (state: QueryState, overrideOptions?: ValidationOptions) => ValidationResult {
  return (state: QueryState, overrideOptions: ValidationOptions = {}) => {
    return validateQueryState(state, { ...defaultOptions, ...overrideOptions });
  };
}
