import { describe, it, expect } from 'vitest';
import {
  getOperatorsForFieldType,
  getOperatorsByQueryType,
  isQueryTypeValidForField,
  getDefaultOperator,
  FIELD_TYPE_OPERATORS,
} from '../operators';

describe('getOperatorsForFieldType', () => {
  it('returns text operators for text fields', () => {
    const operators = getOperatorsForFieldType('text');
    const labels = operators.map((op) => op.label);

    expect(labels).toContain('matches');
    expect(labels).toContain('matches phrase');
    expect(labels).toContain('fuzzy matches');
    expect(labels).toContain('exists');
  });

  it('returns keyword operators for keyword fields', () => {
    const operators = getOperatorsForFieldType('keyword');
    const labels = operators.map((op) => op.label);

    expect(labels).toContain('equals');
    expect(labels).toContain('equals (case-insensitive)');
    expect(labels).toContain('is one of');
    expect(labels).toContain('regexp');
    expect(labels).toContain('starts with');
    expect(labels).toContain('wildcard');
  });

  it('returns numeric operators for number fields', () => {
    const operators = getOperatorsForFieldType('long');
    const labels = operators.map((op) => op.label);

    expect(labels).toContain('equals');
    expect(labels).toContain('greater than');
    expect(labels).toContain('less than');
    expect(labels).toContain('between');
  });

  it('returns date operators for date fields', () => {
    const operators = getOperatorsForFieldType('date');
    const labels = operators.map((op) => op.label);

    expect(labels).toContain('after');
    expect(labels).toContain('before');
    expect(labels).toContain('on or after');
    expect(labels).toContain('between');
  });
});

describe('operator definitions', () => {
  it('has operatorId for disambiguating same queryType operators', () => {
    const keywordOps = getOperatorsForFieldType('keyword');
    const termOps = keywordOps.filter((op) => op.queryType === 'term');

    expect(termOps.length).toBeGreaterThan(1);
    const ids = termOps.map((op) => op.operatorId);
    expect(ids).toContain('term');
    expect(ids).toContain('term_case_insensitive');
  });

  it('has queryParams for case-insensitive operator', () => {
    const keywordOps = getOperatorsForFieldType('keyword');
    const caseInsensitiveOp = keywordOps.find(
      (op) => op.label === 'equals (case-insensitive)'
    );

    expect(caseInsensitiveOp).toBeDefined();
    expect(caseInsensitiveOp?.queryParams).toEqual({ case_insensitive: true });
  });

  it('has terms operator for keyword fields', () => {
    const keywordOps = getOperatorsForFieldType('keyword');
    const termsOp = keywordOps.find((op) => op.queryType === 'terms');

    expect(termsOp).toBeDefined();
    expect(termsOp?.label).toBe('is one of');
  });

  it('has regexp operator for keyword fields', () => {
    const keywordOps = getOperatorsForFieldType('keyword');
    const regexpOp = keywordOps.find((op) => op.queryType === 'regexp');

    expect(regexpOp).toBeDefined();
    expect(regexpOp?.label).toBe('regexp');
  });

  it('text operators use match_phrase for phrase matching', () => {
    const textOps = getOperatorsForFieldType('text');
    const phraseOp = textOps.find((op) => op.label === 'matches phrase');

    expect(phraseOp).toBeDefined();
    expect(phraseOp?.queryType).toBe('match_phrase');
  });
});

describe('getOperatorsByQueryType', () => {
  it('returns all operators that produce a given query type', () => {
    const rangeOps = getOperatorsByQueryType('range');

    expect(rangeOps.length).toBeGreaterThan(0);
    rangeOps.forEach((op) => {
      expect(op.queryType).toBe('range');
    });
  });
});

describe('isQueryTypeValidForField', () => {
  it('match is valid for text fields', () => {
    expect(isQueryTypeValidForField('text', 'match')).toBe(true);
  });

  it('term is valid for keyword fields', () => {
    expect(isQueryTypeValidForField('keyword', 'term')).toBe(true);
  });

  it('terms is valid for keyword fields', () => {
    expect(isQueryTypeValidForField('keyword', 'terms')).toBe(true);
  });

  it('range is valid for numeric fields', () => {
    expect(isQueryTypeValidForField('long', 'range')).toBe(true);
    expect(isQueryTypeValidForField('integer', 'range')).toBe(true);
    expect(isQueryTypeValidForField('date', 'range')).toBe(true);
  });
});

describe('getDefaultOperator', () => {
  it('returns match for text fields', () => {
    const defaultOp = getDefaultOperator('text');
    expect(defaultOp.queryType).toBe('match');
  });

  it('returns term for keyword fields', () => {
    const defaultOp = getDefaultOperator('keyword');
    expect(defaultOp.queryType).toBe('term');
  });

  it('returns term for numeric fields', () => {
    const defaultOp = getDefaultOperator('long');
    expect(defaultOp.queryType).toBe('term');
  });
});
