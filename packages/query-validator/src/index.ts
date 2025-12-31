/**
 * @crystal-forge/query-validator
 *
 * Validation utilities for OpenSearch query structures.
 * Ensures queries are well-formed before execution.
 */

// Export all types
export type {
  // Query structure types
  QueryType,
  FieldType,
  Operator,
  BoolClause,
  QueryNode,
  QueryState,
  FieldDefinition,
  // Validation types
  ValidationErrorCode,
  ValidationError,
  ValidationResult,
  ValidationOptions,
} from './validators';

// Export all validation functions
export {
  validateQueryNode,
  validateQueryState,
  validateFieldTypeMatch,
  validateRequiredFields,
  mergeValidationResults,
  createValidator,
} from './validators';
