'use client';

import React, { useState, useCallback } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import type { ConnectionConfig, AuthConfig } from '@crystal-forge/opensearch-client';
import { cn } from '@/lib/utils';

/**
 * Props for ConnectionModal
 */
interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Auth type options
 */
type AuthType = 'none' | 'basic' | 'apiKey' | 'awsSigV4';

/**
 * Dialog for connecting to OpenSearch
 */
export function ConnectionModal({ isOpen, onClose }: ConnectionModalProps) {
  const { state, actions } = useConnection();
  const { connection, indices, isLoading, error } = state;

  // Form state
  const [host, setHost] = useState('http://localhost:9200');
  const [authType, setAuthType] = useState<AuthType>('none');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [awsRegion, setAwsRegion] = useState('us-east-1');

  /**
   * Build connection config from form state
   */
  const buildConfig = useCallback((): ConnectionConfig => {
    const config: ConnectionConfig = {
      host: host.trim(),
      timeout: 30000,
    };

    if (authType === 'basic' && username && password) {
      config.auth = {
        type: 'basic',
        username,
        password,
      };
    } else if (authType === 'apiKey' && apiKey) {
      config.auth = {
        type: 'apiKey',
        apiKey,
      };
    } else if (authType === 'awsSigV4') {
      config.auth = {
        type: 'awsSigV4',
        region: awsRegion,
      };
    }

    return config;
  }, [host, authType, username, password, apiKey, awsRegion]);

  /**
   * Handle connect button click
   */
  const handleConnect = useCallback(async () => {
    const config = buildConfig();
    await actions.connect(config);
  }, [buildConfig, actions]);

  /**
   * Handle disconnect
   */
  const handleDisconnect = useCallback(() => {
    actions.disconnect();
  }, [actions]);

  /**
   * Handle index selection
   */
  const handleIndexSelect = useCallback(
    async (index: string) => {
      await actions.setIndex(index);
    },
    [actions]
  );

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {connection.isConnected ? 'Connection Settings' : 'Connect to OpenSearch'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* Connection status */}
          {connection.isConnected && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Connected to {connection.host}
            </div>
          )}

          {/* Connection form */}
          {!connection.isConnected && (
            <>
              {/* Host URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host URL
                </label>
                <input
                  type="url"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="http://localhost:9200"
                  className={cn(
                    'w-full px-3 py-2 rounded-md',
                    'border border-gray-300',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />
              </div>

              {/* Auth type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authentication
                </label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as AuthType)}
                  className={cn(
                    'w-full px-3 py-2 rounded-md',
                    'border border-gray-300',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                >
                  <option value="none">No Authentication</option>
                  <option value="basic">Basic Auth</option>
                  <option value="apiKey">API Key</option>
                  <option value="awsSigV4">AWS SigV4</option>
                </select>
              </div>

              {/* Basic auth fields */}
              {authType === 'basic' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-md',
                        'border border-gray-300',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-md',
                        'border border-gray-300',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      )}
                    />
                  </div>
                </div>
              )}

              {/* API key field */}
              {authType === 'apiKey' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-md',
                      'border border-gray-300',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                </div>
              )}

              {/* AWS SigV4 fields */}
              {authType === 'awsSigV4' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AWS Region
                  </label>
                  <input
                    type="text"
                    value={awsRegion}
                    onChange={(e) => setAwsRegion(e.target.value)}
                    placeholder="us-east-1"
                    className={cn(
                      'w-full px-3 py-2 rounded-md',
                      'border border-gray-300',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    AWS credentials will be loaded from environment
                  </p>
                </div>
              )}
            </>
          )}

          {/* Index selector (shown after connection) */}
          {connection.isConnected && indices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Index
              </label>
              <select
                value={connection.index || ''}
                onChange={(e) => handleIndexSelect(e.target.value)}
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 rounded-md',
                  'border border-gray-300',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'disabled:opacity-50'
                )}
              >
                <option value="">Select an index...</option>
                {indices.map((index) => (
                  <option key={index.name} value={index.name}>
                    {index.name} ({index.docsCount.toLocaleString()} docs)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
          {connection.isConnected ? (
            <>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md',
                  'border border-gray-300 bg-white',
                  'hover:bg-gray-50 transition-colors',
                  'disabled:opacity-50'
                )}
              >
                Disconnect
              </button>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md',
                  'bg-blue-600 text-white',
                  'hover:bg-blue-700 transition-colors',
                  'disabled:opacity-50'
                )}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md',
                  'border border-gray-300 bg-white',
                  'hover:bg-gray-50 transition-colors',
                  'disabled:opacity-50'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={isLoading || !host.trim()}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md',
                  'bg-blue-600 text-white',
                  'hover:bg-blue-700 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-2'
                )}
              >
                {isLoading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isLoading ? 'Connecting...' : 'Connect'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectionModal;
