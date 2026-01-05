'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { validateQueryState, type ValidationResult } from '@crystal-forge/query-validator';
import { useQuery } from './QueryContext';

interface ValidationContextValue {
  validationResult: ValidationResult | null;
  validateQuery: () => ValidationResult;
  getNodeErrors: (nodeId: string) => ValidationError[];
  getNodeWarnings: (nodeId: string) => ValidationError[];
  clearValidation: () => void;
  isValidating: boolean;
}

type ValidationError = {
  type: string;
  path: string[];
  message: string;
};

const ValidationContext = createContext<ValidationContextValue | undefined>(undefined);

/**
 * Provider component for query validation
 */
export function ValidationProvider({ children }: { children: React.ReactNode }) {
  const { state: queryState } = useQuery();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Debounce validation to avoid excessive checks
   */
  useEffect(() => {
    const validationTimeout = setTimeout(() => {
      setIsValidating(true);
      try {
        const result = validateQueryState(queryState);
        setValidationResult(result);
      } catch (error) {
        console.error('Validation error:', error);
        setValidationResult(null);
      } finally {
        setIsValidating(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(validationTimeout);
  }, [queryState]);

  /**
   * Validate query on demand
   */
  const validateQuery = useCallback(() => {
    setIsValidating(true);
    try {
      const result = validateQueryState(queryState);
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      return { isValid: false, errors: [], warnings: [] };
    } finally {
      setIsValidating(false);
    }
  }, [queryState]);

  /**
   * Get validation errors for a specific node
   */
  const getNodeErrors = useCallback(
    (nodeId: string): ValidationError[] => {
      if (!validationResult) return [];
      return (validationResult.errors || []).filter((err) =>
        (err.path || []).includes(nodeId)
      ) as ValidationError[];
    },
    [validationResult]
  );

  /**
   * Get validation warnings for a specific node
   */
  const getNodeWarnings = useCallback(
    (nodeId: string): ValidationError[] => {
      if (!validationResult) return [];
      return (validationResult.warnings || []).filter((warn) =>
        (warn.path || []).includes(nodeId)
      ) as ValidationError[];
    },
    [validationResult]
  );

  /**
   * Clear validation results
   */
  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return (
    <ValidationContext.Provider
      value={{
        validationResult,
        validateQuery,
        getNodeErrors,
        getNodeWarnings,
        clearValidation,
        isValidating,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
}

/**
 * Hook to use validation context
 */
export function useValidation(): ValidationContextValue {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within ValidationProvider');
  }
  return context;
}
