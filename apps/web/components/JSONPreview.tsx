'use client';

import React, { useMemo, useCallback, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import debounce from 'lodash.debounce';
import { AlertCircle } from 'lucide-react';
import { useQuery } from '@/context/QueryContext';
import { useConnection } from '@/context/ConnectionContext';
import { serializeQueryState, deserializeQueryState } from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

/**
 * Props for JSONPreview
 */
interface JSONPreviewProps {
  /** Optional class name for styling */
  className?: string;
  /** Height of the editor (default: '400px') */
  height?: string;
}

/**
 * Helper: Extract JSON from Dev Tools format (removes GET line)
 */
function extractJsonFromDevTools(text: string): string {
  const lines = text.split('\n');
  // Check if first line (after trimming) is a Dev Tools request line
  if (lines[0].trim().match(/^(GET|POST|PUT|DELETE|HEAD)\s+/)) {
    // Remove first line and rejoin
    return lines.slice(1).join('\n');
  }
  return text;
}

/**
 * Helper: Format JSON in Dev Tools style
 */
function formatDevTools(json: string, index: string): string {
  return `GET ${index}/_search\n${json}`;
}

/**
 * Monaco editor showing generated JSON query with bidirectional sync
 */
export function JSONPreview({ className, height = '400px' }: JSONPreviewProps) {
  const { state, setQuery, setPagination } = useQuery();
  const { state: connectionState } = useConnection();
  const [copied, setCopied] = useState(false);
  const [editedJson, setEditedJson] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const debouncedUpdateRef = useRef<((value: string) => void) | null>(null);

  /**
   * Get the current index name for the Dev Tools format
   */
  const currentIndex = connectionState.connection.index || '_all';

  /**
   * Serialize the current query state to JSON
   */
  const jsonBody = useMemo(() => {
    try {
      const serialized = serializeQueryState(state.query);
      return JSON.stringify(serialized, null, 2);
    } catch (error) {
      return JSON.stringify(
        { error: 'Failed to serialize query' },
        null,
        2
      );
    }
  }, [state.query]);

  /**
   * Sync editedJson when query updates (when not editing)
   */
  React.useEffect(() => {
    if (!isEditing) {
      const formatted = formatDevTools(jsonBody, currentIndex);
      setEditedJson(formatted);
    }
  }, [jsonBody, currentIndex, isEditing]);

  /**
   * Display content for editor: show full Dev Tools format (GET line + JSON)
   * The GET line is visible for copy-paste to OpenSearch Dashboards,
   * but only the JSON part is parsed (validation is disabled)
   */
  const devToolsContent = useMemo(() => {
    if (editedJson) {
      // Keep user's edits as-is (including GET line if present)
      return editedJson;
    }
    // When query updates, show formatted with GET line
    return formatDevTools(jsonBody, currentIndex);
  }, [editedJson, jsonBody, currentIndex]);

  /**
   * Create and initialize debounced update function
   */
  React.useEffect(() => {
    const debouncedFn = debounce((value: string) => {
      try {
        console.log('Parsing JSON:', value.substring(0, 100)); // Debug log

        // Strip Dev Tools format
        const jsonOnly = extractJsonFromDevTools(value);
        console.log('JSON only:', jsonOnly.substring(0, 100)); // Debug log

        // Parse JSON
        const parsed = JSON.parse(jsonOnly);
        console.log('Parsed:', parsed); // Debug log

        // Deserialize to QueryState
        const newState = deserializeQueryState(parsed);
        console.log('Deserialized state:', newState); // Debug log

        // Update QueryContext with new query
        setQuery(newState.query);

        // Update pagination if provided
        if (newState.size !== undefined || newState.from !== undefined) {
          console.log('Setting pagination:', { size: newState.size, from: newState.from });
          setPagination({ size: newState.size, from: newState.from });
        }

        // Clear any errors
        setParseError(null);
        setIsEditing(false);
      } catch (error) {
        // Set error message but keep isEditing true so user can fix it
        const errorMsg = error instanceof Error ? error.message : 'Invalid JSON';
        console.error('JSON parse error:', errorMsg);
        setParseError(errorMsg);
      }
    }, 500);

    debouncedUpdateRef.current = debouncedFn;

    // Cleanup debounce on unmount
    return () => {
      debouncedFn.cancel?.();
    };
  }, [setQuery, setPagination]);

  /**
   * Handle editor changes with debouncing
   */
  const handleJsonChange = useCallback((value: string | undefined) => {
    if (!value) return;

    setEditedJson(value);
    setIsEditing(true);

    // Trigger debounced update
    if (debouncedUpdateRef.current) {
      debouncedUpdateRef.current(value);
    }
  }, []);

  /**
   * Copy Dev Tools format to clipboard
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(devToolsContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [devToolsContent]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-900">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Dev Tools Format</h3>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
            'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
            'text-gray-700 dark:text-gray-300',
            copied && 'text-green-600 dark:text-green-400 border-green-300 dark:border-green-600'
          )}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Editor with error border */}
      <div className={cn('flex-1 min-h-0', parseError && 'ring-2 ring-red-500 ring-inset')}>
        <Editor
          height={height}
          defaultLanguage="json"
          value={devToolsContent}
          onChange={(value) => {
            console.log('Editor changed, value:', value?.substring(0, 100));
            handleJsonChange(value);
          }}
          options={{
            readOnly: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            folding: true,
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
            // Disable built-in JSON validation since we handle Dev Tools format
            // and show our own custom errors below the editor
            'json.validate.enable': false,
          }}
          theme="vs"
        />
      </div>

      {/* Status / Error message */}
      {parseError ? (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">JSON Parse Error</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1 break-words">{parseError}</p>
            </div>
          </div>
        </div>
      ) : isEditing ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-400">Parsing JSON... (wait for update)</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Lightweight JSON preview without Monaco (for simpler use cases)
 */
interface SimpleJSONPreviewProps {
  className?: string;
}

export function SimpleJSONPreview({ className }: SimpleJSONPreviewProps) {
  const { state } = useQuery();
  const { state: connectionState } = useConnection();
  const [copied, setCopied] = useState(false);

  const currentIndex = connectionState.connection.index || '_all';

  const jsonBody = useMemo(() => {
    try {
      const serialized = serializeQueryState(state.query);
      return JSON.stringify(serialized, null, 2);
    } catch (error) {
      return JSON.stringify({ error: 'Failed to serialize query' }, null, 2);
    }
  }, [state.query]);

  const devToolsContent = useMemo(() => {
    return `GET ${currentIndex}/_search\n${jsonBody}`;
  }, [currentIndex, jsonBody]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(devToolsContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [devToolsContent]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">Dev Tools Format</h3>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md',
            'border border-gray-300 bg-white',
            'hover:bg-gray-50 transition-colors',
            copied && 'text-green-600 border-green-300'
          )}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-gray-900">
        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
          {devToolsContent}
        </pre>
      </div>
    </div>
  );
}

export default JSONPreview;
