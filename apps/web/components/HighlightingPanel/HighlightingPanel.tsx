'use client';

import React, { useState, useCallback } from 'react';
import { useQuery } from '@/context/QueryContext';
import { useConnection } from '@/context/ConnectionContext';
import type { HighlightConfig, HighlightFieldConfig } from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

export function HighlightingPanel() {
  const { state: queryState, setHighlight } = useQuery();
  const { state: connectionState } = useConnection();
  const [isExpanded, setIsExpanded] = useState(false);

  const fields = connectionState.fields;
  const currentHighlight = queryState.query.highlight;

  const handleToggleHighlighting = useCallback(() => {
    if (currentHighlight) {
      setHighlight(undefined);
    } else {
      // Enable with defaults
      setHighlight({
        fields: {},
        pre_tags: ['<em>'],
        post_tags: ['</em>'],
        fragment_size: 150,
        number_of_fragments: 3,
      });
    }
  }, [currentHighlight, setHighlight]);

  const handleAddField = useCallback(
    (fieldPath: string) => {
      const newHighlight: HighlightConfig = currentHighlight
        ? { ...currentHighlight }
        : {
            fields: {},
            pre_tags: ['<em>'],
            post_tags: ['</em>'],
          };

      newHighlight.fields[fieldPath] = {};
      setHighlight(newHighlight);
    },
    [currentHighlight, setHighlight]
  );

  const handleRemoveField = useCallback(
    (fieldPath: string) => {
      if (!currentHighlight) return;

      const newFields = { ...currentHighlight.fields };
      delete newFields[fieldPath];

      setHighlight({
        ...currentHighlight,
        fields: newFields,
      });
    },
    [currentHighlight, setHighlight]
  );

  const handleUpdateFieldConfig = useCallback(
    (fieldPath: string, config: HighlightFieldConfig) => {
      if (!currentHighlight) return;

      setHighlight({
        ...currentHighlight,
        fields: {
          ...currentHighlight.fields,
          [fieldPath]: config,
        },
      });
    },
    [currentHighlight, setHighlight]
  );

  const handleUpdateGlobalConfig = useCallback(
    (updates: Partial<HighlightConfig>) => {
      if (!currentHighlight) return;

      setHighlight({
        ...currentHighlight,
        ...updates,
      });
    },
    [currentHighlight, setHighlight]
  );

  const selectedFields = currentHighlight ? Object.keys(currentHighlight.fields) : [];
  const availableFields = fields.filter((f) => !selectedFields.includes(f.path));

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between',
          'text-sm font-medium text-gray-700 dark:text-gray-300',
          'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
        )}
      >
        <div className="flex items-center gap-2">
          <span>Highlighting</span>
          {currentHighlight && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
              {selectedFields.length} {selectedFields.length === 1 ? 'field' : 'fields'}
            </span>
          )}
        </div>
        <svg
          className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Highlighting
            </label>
            <button
              onClick={handleToggleHighlighting}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                currentHighlight ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  currentHighlight ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {currentHighlight && (
            <>
              {/* Field Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fields to Highlight
                </label>
                <select
                  value=""
                  onChange={(e) => e.target.value && handleAddField(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Add field...</option>
                  {availableFields.map((field) => (
                    <option key={field.path} value={field.path}>
                      {field.path} ({field.type})
                    </option>
                  ))}
                </select>

                {/* Selected Fields */}
                {selectedFields.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {selectedFields.map((fieldPath) => (
                      <HighlightFieldItem
                        key={fieldPath}
                        fieldPath={fieldPath}
                        config={currentHighlight.fields[fieldPath]}
                        onUpdate={(config) => handleUpdateFieldConfig(fieldPath, config)}
                        onRemove={() => handleRemoveField(fieldPath)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Global Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Global Settings
                </h4>

                {/* Fragment Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Fragment Size
                  </label>
                  <input
                    type="number"
                    value={currentHighlight.fragment_size || 150}
                    onChange={(e) =>
                      handleUpdateGlobalConfig({ fragment_size: parseInt(e.target.value) })
                    }
                    min="50"
                    max="500"
                    className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Number of Fragments */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Number of Fragments
                  </label>
                  <input
                    type="number"
                    value={currentHighlight.number_of_fragments || 3}
                    onChange={(e) =>
                      handleUpdateGlobalConfig({ number_of_fragments: parseInt(e.target.value) })
                    }
                    min="1"
                    max="10"
                    className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Pre/Post Tags */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Pre Tag
                    </label>
                    <input
                      type="text"
                      value={currentHighlight.pre_tags?.[0] || '<em>'}
                      onChange={(e) => handleUpdateGlobalConfig({ pre_tags: [e.target.value] })}
                      className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Post Tag
                    </label>
                    <input
                      type="text"
                      value={currentHighlight.post_tags?.[0] || '</em>'}
                      onChange={(e) => handleUpdateGlobalConfig({ post_tags: [e.target.value] })}
                      className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Field item component
interface HighlightFieldItemProps {
  fieldPath: string;
  config: HighlightFieldConfig;
  onUpdate: (config: HighlightFieldConfig) => void;
  onRemove: () => void;
}

function HighlightFieldItem({ fieldPath, config, onRemove }: HighlightFieldItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {fieldPath}
      </span>
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        title="Remove field"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
