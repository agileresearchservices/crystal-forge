'use client';

import React, { useMemo, useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useQuery } from '@/context/QueryContext';
import { serializeQueryState } from '@crystal-forge/query-dsl';
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
 * Monaco editor showing generated JSON query
 */
export function JSONPreview({ className, height = '400px' }: JSONPreviewProps) {
  const { state } = useQuery();
  const [copied, setCopied] = useState(false);

  /**
   * Serialize the current query state to JSON
   */
  const jsonContent = useMemo(() => {
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
   * Copy JSON to clipboard
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [jsonContent]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">Query JSON</h3>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md',
            'border border-gray-300 bg-white',
            'hover:bg-gray-50 transition-colors',
            copied && 'text-green-600 border-green-300'
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

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height={height}
          defaultLanguage="json"
          value={jsonContent}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            folding: true,
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
          }}
          theme="vs"
        />
      </div>
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
  const [copied, setCopied] = useState(false);

  const jsonContent = useMemo(() => {
    try {
      const serialized = serializeQueryState(state.query);
      return JSON.stringify(serialized, null, 2);
    } catch (error) {
      return JSON.stringify({ error: 'Failed to serialize query' }, null, 2);
    }
  }, [state.query]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [jsonContent]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">Query JSON</h3>
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
          {jsonContent}
        </pre>
      </div>
    </div>
  );
}

export default JSONPreview;
