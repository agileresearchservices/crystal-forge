'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { useQuery, generateNodeId } from '@/context/QueryContext';
import { useFieldSelector } from '@/hooks/useFieldSelector';
import type { FieldInfo } from '@crystal-forge/opensearch-client';
import type { MatchQueryNode } from '@crystal-forge/query-dsl';
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
  const { addNode } = useQuery();
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
   * Add field to query
   */
  const handleAddToQuery = useCallback(
    (field: FieldInfo) => {
      const newNode: MatchQueryNode = {
        id: generateNodeId(),
        type: 'match',
        field: field.path,
        value: '',
      };
      addNode(['must'], newNode);
    },
    [addNode]
  );

  /**
   * Get badge color for field type
   */
  const getTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-700';
      case 'keyword':
        return 'bg-green-100 text-green-700';
      case 'long':
      case 'integer':
      case 'short':
      case 'byte':
      case 'double':
      case 'float':
        return 'bg-purple-100 text-purple-700';
      case 'date':
        return 'bg-orange-100 text-orange-700';
      case 'boolean':
        return 'bg-yellow-100 text-yellow-700';
      case 'nested':
        return 'bg-red-100 text-red-700';
      case 'object':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Determine if we should show grouped or flat view
  const showGrouped = Object.keys(groupedFields).length > 1;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-3 border-b">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Fields</h3>

        {/* Search input */}
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Search fields..."
            className={cn(
              'w-full pl-8 pr-3 py-1.5 text-sm rounded-md',
              'border border-gray-300 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            )}
          />
          {fieldSearch && (
            <button
              onClick={() => setFieldSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Field count */}
        <div className="mt-2 text-xs text-gray-500">
          {filteredFields.length} field{filteredFields.length !== 1 ? 's' : ''}
          {fieldSearch && ` matching "${fieldSearch}"`}
        </div>
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-auto">
        {connectionState.fields.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {connectionState.connection.isConnected
              ? connectionState.connection.index
                ? 'Loading fields...'
                : 'Select an index to view fields'
              : 'Connect to OpenSearch to view fields'}
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No fields match your search
          </div>
        ) : showGrouped ? (
          <GroupedFieldList
            groupedFields={groupedFields}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            onAddToQuery={handleAddToQuery}
            getTypeBadgeColor={getTypeBadgeColor}
          />
        ) : (
          <FlatFieldList
            fields={filteredFields}
            onAddToQuery={handleAddToQuery}
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
  onAddToQuery: (field: FieldInfo) => void;
  getTypeBadgeColor: (type: string) => string;
}

function GroupedFieldList({
  groupedFields,
  expandedGroups,
  onToggleGroup,
  onAddToQuery,
  getTypeBadgeColor,
}: GroupedFieldListProps) {
  return (
    <div className="divide-y">
      {Object.entries(groupedFields).map(([group, fields]) => (
        <div key={group}>
          {/* Group header */}
          <button
            onClick={() => onToggleGroup(group)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2',
              'text-sm font-medium text-gray-700',
              'hover:bg-gray-50 transition-colors'
            )}
          >
            <svg
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                expandedGroups.has(group) && 'rotate-90'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="flex-1 text-left truncate">{group}</span>
            <span className="text-xs text-gray-400">{fields.length}</span>
          </button>

          {/* Group content */}
          {expandedGroups.has(group) && (
            <div className="pl-6 pb-2">
              {fields.map((field) => (
                <FieldItem
                  key={field.path}
                  field={field}
                  onAdd={() => onAddToQuery(field)}
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
  onAddToQuery: (field: FieldInfo) => void;
  getTypeBadgeColor: (type: string) => string;
}

function FlatFieldList({
  fields,
  onAddToQuery,
  getTypeBadgeColor,
}: FlatFieldListProps) {
  return (
    <div className="py-1">
      {fields.map((field) => (
        <FieldItem
          key={field.path}
          field={field}
          onAdd={() => onAddToQuery(field)}
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
  onAdd: () => void;
  typeBadgeColor: string;
}

function FieldItem({ field, onAdd, typeBadgeColor }: FieldItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5',
        'hover:bg-gray-50 transition-colors cursor-pointer'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onAdd}
      title={`Click to add ${field.path} to query`}
    >
      {/* Field name */}
      <span className="flex-1 text-sm text-gray-700 truncate">
        {field.path}
      </span>

      {/* Type badge */}
      <span
        className={cn(
          'px-1.5 py-0.5 text-xs rounded',
          typeBadgeColor
        )}
      >
        {field.type}
      </span>

      {/* Add button (shown on hover) */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="p-1 text-gray-400 hover:text-blue-600"
          title="Add to query"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}

      {/* Indicators */}
      {field.isNested && (
        <span className="text-xs text-gray-400" title="Nested field">
          N
        </span>
      )}
      {field.isMultiField && (
        <span className="text-xs text-gray-400" title="Multi-field">
          M
        </span>
      )}
    </div>
  );
}

export default FieldList;
