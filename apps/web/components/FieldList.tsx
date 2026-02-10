'use client';

import React, { useState, useCallback } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { useFieldSelector } from '@/hooks/useFieldSelector';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { FIELD_TYPE_TOOLTIPS } from '@/constants/tooltips';
import type { FieldInfo } from '@crystal-forge/opensearch-client';
import type { FieldType } from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

/**
 * Props for FieldList
 */
interface FieldListProps {
  className?: string;
}

/**
 * Sidebar showing available fields from the index schema
 */
export function FieldList({ className }: FieldListProps) {
  const { state: connectionState } = useConnection();
  const {
    filteredFields,
    groupedFields,
    fieldSearch,
    setFieldSearch,
    selectedField,
    setSelectedField,
  } = useFieldSelector(connectionState.fields);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  /**
   * Toggle group expansion
   */
  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  /**
   * Get badge color for field type
   */
  const getTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      case 'keyword':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
      case 'long':
      case 'integer':
      case 'short':
      case 'byte':
      case 'double':
      case 'float':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
      case 'date':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
      case 'boolean':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
      case 'nested':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
      case 'object':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  // Determine if we should show grouped or flat view
  const showGrouped = Object.keys(groupedFields).length > 1;

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Fields</h2>

        {/* Search input */}
        <div className="relative">
          <label htmlFor="field-search" className="sr-only">
            Search fields
          </label>
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="field-search"
            type="text"
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Search fields..."
            aria-label="Search fields by name or type"
            className={cn(
              'w-full pl-8 pr-8 py-1.5 text-sm rounded-md',
              'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:focus:ring-indigo-400'
            )}
          />
          {fieldSearch && (
            <Button
              onClick={() => setFieldSearch('')}
              aria-label="Clear field search"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          )}
        </div>

        {/* Field count */}
        <div className="mt-2 text-xs text-gray-700 dark:text-gray-300" aria-live="polite" aria-atomic="true">
          {filteredFields.length} field{filteredFields.length !== 1 ? 's' : ''}
          {fieldSearch && ` matching "${fieldSearch}"`}
        </div>
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-auto flex">
        {connectionState.fields.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="space-y-3 max-w-xs">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                  {connectionState.connection.isConnected
                    ? connectionState.connection.index
                      ? 'Loading fields...'
                      : 'Select an index'
                    : 'Connect to OpenSearch'}
                </p>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {connectionState.connection.isConnected
                    ? connectionState.connection.index
                      ? 'Retrieving field information from your index'
                      : 'Choose an index from the connection modal to view its fields'
                    : 'Click Connect to browse available fields'}
                </p>
              </div>
            </div>
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center" role="status">
            <div className="space-y-2 max-w-xs">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v6m3-3H9m9 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-900 dark:text-white">No fields match</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">Try adjusting your search term</p>
            </div>
          </div>
        ) : showGrouped ? (
          <GroupedFieldList
            groupedFields={groupedFields}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            getTypeBadgeColor={getTypeBadgeColor}
          />
        ) : (
          <FlatFieldList
            fields={filteredFields}
            getTypeBadgeColor={getTypeBadgeColor}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Grouped field list view
 */
interface GroupedFieldListProps {
  groupedFields: Record<string, FieldInfo[]>;
  expandedGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  getTypeBadgeColor: (type: string) => string;
}

function GroupedFieldList({
  groupedFields,
  expandedGroups,
  onToggleGroup,
  getTypeBadgeColor,
}: GroupedFieldListProps) {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {Object.entries(groupedFields).map(([group, fields]) => (
        <div key={group}>
          {/* Group header */}
          <button
            onClick={() => onToggleGroup(group)}
            aria-expanded={expandedGroups.has(group)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2',
              'text-sm font-medium text-gray-700 dark:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500'
            )}
          >
            <svg
              className={cn(
                'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0',
                expandedGroups.has(group) && 'rotate-90'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="flex-1 text-left truncate">{group}</span>
            <span className="text-xs text-gray-700 dark:text-gray-300" aria-label={`${fields.length} fields`}>
              {fields.length}
            </span>
          </button>

          {/* Group content */}
          {expandedGroups.has(group) && (
            <div className="pl-6 pb-2" role="region" aria-label={`${group} fields`}>
              {fields.map((field) => (
                <FieldItem
                  key={field.path}
                  field={field}
                  typeBadgeColor={getTypeBadgeColor(field.type)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Flat field list view
 */
interface FlatFieldListProps {
  fields: FieldInfo[];
  getTypeBadgeColor: (type: string) => string;
}

function FlatFieldList({
  fields,
  getTypeBadgeColor,
}: FlatFieldListProps) {
  return (
    <div className="py-1">
      {fields.map((field) => (
        <FieldItem
          key={field.path}
          field={field}
          typeBadgeColor={getTypeBadgeColor(field.type)}
        />
      ))}
    </div>
  );
}

/**
 * Individual field item
 */
interface FieldItemProps {
  field: FieldInfo;
  typeBadgeColor: string;
}

function FieldItem({ field, typeBadgeColor }: FieldItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5',
        'text-sm text-gray-700 dark:text-gray-300'
      )}
    >
      {/* Field name */}
      <span className="truncate flex-1 min-w-0">{field.path}</span>

      {/* Type badge with tooltip */}
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'px-1.5 py-0.5 text-xs rounded font-medium flex-shrink-0',
            typeBadgeColor
          )}
          aria-label={`Field type: ${field.type}`}
        >
          {field.type}
        </span>
        {field.type in FIELD_TYPE_TOOLTIPS && (
          <InfoTooltip
            content={{
              title: field.type.charAt(0).toUpperCase() + field.type.slice(1),
              description: FIELD_TYPE_TOOLTIPS[field.type as FieldType],
            }}
            side="right"
            className="flex-shrink-0"
          />
        )}
      </div>

      {/* Indicators */}
      {field.isNested && (
        <InfoTooltip
          content={{
            title: 'Nested Field',
            description: 'This field contains nested objects. Use a nested query to search within this field\'s sub-fields.',
          }}
          side="right"
          className="flex-shrink-0"
        >
          <span
            className="px-2 py-0.5 text-xs text-white dark:text-white font-semibold flex-shrink-0 rounded bg-red-600 dark:bg-red-700 cursor-help"
            aria-label="Nested field - use nested query"
          >
            Nested
          </span>
        </InfoTooltip>
      )}
      {field.isMultiField && (
        <span
          className="text-xs text-gray-700 dark:text-gray-300 font-medium flex-shrink-0"
          aria-label="Multi-field"
          title="Multi-field with subfields (.keyword, .raw, etc.)"
        >
          M
        </span>
      )}
    </div>
  );
}

export default FieldList;
