'use client';

import React, { useState, useCallback } from 'react';
import { useQuery } from '@/context/QueryContext';
import { useConnection } from '@/context/ConnectionContext';
import type { SuggesterConfig, TermSuggesterConfig, PhraseSuggesterConfig, DirectGenerator } from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

interface FormState {
  name: string;
  text: string;
  type: 'term' | 'phrase';
  field: string;
  // Term-specific
  suggest_mode?: string;
  min_word_length?: number;
  max_edits?: number;
  sort?: string;
  // Phrase-specific
  confidence?: number;
  gram_size?: number;
  max_errors?: number;
  highlight_pre_tags?: string[];
  highlight_post_tags?: string[];
}

const initialFormState: FormState = {
  name: '',
  text: '',
  type: 'term',
  field: '',
  suggest_mode: 'missing',
  min_word_length: 0,
  max_edits: 2,
  sort: 'score',
  confidence: 0,
  gram_size: 1,
  max_errors: 1,
  highlight_pre_tags: ['<em>'],
  highlight_post_tags: ['</em>'],
};

export function SuggesterPanel() {
  const { state: queryState, setSuggest } = useQuery();
  const { state: connectionState } = useConnection();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [editingName, setEditingName] = useState<string | null>(null);

  const fields = connectionState.fields;
  const currentSuggest = queryState.query.suggest || {};
  const suggesterNames = Object.keys(currentSuggest);

  const handleAddSuggester = useCallback(() => {
    if (!formState.name.trim() || !formState.field || !formState.text.trim()) {
      return;
    }

    let config: SuggesterConfig;

    if (formState.type === 'term') {
      config = {
        text: formState.text,
        term: {
          field: formState.field,
          suggest_mode: (formState.suggest_mode || 'missing') as 'missing' | 'popular' | 'always',
          min_word_length: formState.min_word_length ?? 0,
          max_edits: formState.max_edits ?? 2,
          sort: (formState.sort || 'score') as 'score' | 'frequency',
        },
      };
    } else {
      config = {
        text: formState.text,
        phrase: {
          field: formState.field,
          gram_size: formState.gram_size ?? 1,
          confidence: formState.confidence ?? 0,
          max_errors: formState.max_errors ?? 1,
        },
      };
    }

    const newSuggest = editingName
      ? { ...currentSuggest, [formState.name]: config }
      : { ...currentSuggest, [formState.name]: config };

    if (editingName && editingName !== formState.name) {
      delete newSuggest[editingName];
    }

    setSuggest(newSuggest);
    setFormState(initialFormState);
    setShowForm(false);
    setEditingName(null);
  }, [formState, currentSuggest, setSuggest, editingName]);

  const handleRemoveSuggester = useCallback(
    (name: string) => {
      const newSuggest = { ...currentSuggest };
      delete newSuggest[name];
      setSuggest(Object.keys(newSuggest).length > 0 ? newSuggest : undefined);
    },
    [currentSuggest, setSuggest]
  );

  const handleEditSuggester = useCallback((name: string) => {
    const suggester = currentSuggest[name];
    if (!suggester) return;

    const isTermSuggester = 'term' in suggester;

    if (isTermSuggester && suggester.term) {
      const config = suggester.term;
      setFormState({
        name,
        text: suggester.text,
        type: 'term',
        field: config.field,
        suggest_mode: config.suggest_mode,
        min_word_length: config.min_word_length,
        max_edits: config.max_edits,
        sort: config.sort,
      });
    } else if (suggester.phrase) {
      const config = suggester.phrase;
      setFormState({
        name,
        text: suggester.text,
        type: 'phrase',
        field: config.field,
        confidence: config.confidence,
        gram_size: config.gram_size,
        max_errors: config.max_errors,
      });
    }

    setEditingName(name);
    setShowForm(true);
  }, [currentSuggest]);

  const handleCancel = useCallback(() => {
    setFormState(initialFormState);
    setShowForm(false);
    setEditingName(null);
  }, []);

  const handleTypeChange = useCallback((newType: 'term' | 'phrase') => {
    setFormState((prev) => ({
      ...prev,
      type: newType,
    }));
  }, []);

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
          <span>Suggesters</span>
          {suggesterNames.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
              {suggesterNames.length} {suggesterNames.length === 1 ? 'suggester' : 'suggesters'}
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
          {/* Existing Suggesters List */}
          {suggesterNames.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Suggesters</h4>
              {suggesterNames.map((name) => {
                const suggester = currentSuggest[name];
                const isTermSuggester = 'term' in suggester;
                const config = isTermSuggester ? suggester.term : suggester.phrase;
                const typeLabel = isTermSuggester ? 'Term' : 'Phrase';

                if (!config) return null;

                return (
                  <div key={name} className="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {typeLabel} • {config.field} • "{suggester.text}"
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditSuggester(name)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit suggester"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveSuggester(name)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove suggester"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add/Edit Form Toggle */}
          {!showForm && (
            <button
              onClick={() => {
                setFormState(initialFormState);
                setEditingName(null);
                setShowForm(true);
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-dashed border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              + Add Suggester
            </button>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div className="space-y-3 p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Suggester Name
                </label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g., 'my_suggestion'"
                  className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Text to Suggest For
                </label>
                <input
                  type="text"
                  value={formState.text}
                  onChange={(e) => setFormState({ ...formState, text: e.target.value })}
                  placeholder="e.g., 'opensearch'"
                  className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Suggester Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTypeChange('term')}
                    className={cn(
                      'flex-1 px-2 py-1.5 text-sm rounded-md border transition-colors',
                      formState.type === 'term'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    Term
                  </button>
                  <button
                    onClick={() => handleTypeChange('phrase')}
                    className={cn(
                      'flex-1 px-2 py-1.5 text-sm rounded-md border transition-colors',
                      formState.type === 'phrase'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    Phrase
                  </button>
                </div>
              </div>

              {/* Field Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field
                </label>
                <select
                  value={formState.field}
                  onChange={(e) => setFormState({ ...formState, field: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  disabled={fields.length === 0}
                >
                  <option value="">Select a field...</option>
                  {fields.map((field) => (
                    <option key={field.path} value={field.path}>
                      {field.path} ({field.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type-Specific Options */}
              {formState.type === 'term' ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Suggest Mode
                    </label>
                    <select
                      value={formState.suggest_mode || 'missing'}
                      onChange={(e) => setFormState({ ...formState, suggest_mode: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="missing">Missing (default)</option>
                      <option value="popular">Popular</option>
                      <option value="always">Always</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Min Word Length
                      </label>
                      <input
                        type="number"
                        value={formState.min_word_length ?? 0}
                        onChange={(e) => setFormState({ ...formState, min_word_length: parseInt(e.target.value) })}
                        min="0"
                        className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Max Edits
                      </label>
                      <input
                        type="number"
                        value={formState.max_edits ?? 2}
                        onChange={(e) => setFormState({ ...formState, max_edits: parseInt(e.target.value) })}
                        min="0"
                        max="2"
                        className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Sort
                    </label>
                    <select
                      value={formState.sort || 'score'}
                      onChange={(e) => setFormState({ ...formState, sort: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="score">Score</option>
                      <option value="frequency">Frequency</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Gram Size
                      </label>
                      <input
                        type="number"
                        value={formState.gram_size ?? 1}
                        onChange={(e) => setFormState({ ...formState, gram_size: parseInt(e.target.value) })}
                        min="1"
                        className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Max Errors
                      </label>
                      <input
                        type="number"
                        value={formState.max_errors ?? 1}
                        onChange={(e) => setFormState({ ...formState, max_errors: parseInt(e.target.value) })}
                        min="0"
                        className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Confidence
                    </label>
                    <input
                      type="number"
                      value={formState.confidence ?? 0}
                      onChange={(e) => setFormState({ ...formState, confidence: parseFloat(e.target.value) })}
                      min="0"
                      max="1"
                      step="0.1"
                      className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddSuggester}
                  disabled={!formState.name.trim() || !formState.field || !formState.text.trim()}
                  className="flex-1 px-2 py-1.5 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors"
                >
                  {editingName ? 'Update' : 'Add'} Suggester
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
