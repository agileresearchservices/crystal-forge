'use client';

/**
 * Re-export useConnection hook from ConnectionContext for convenience
 * This allows importing from hooks directory
 */
export { useConnection } from '@/context/ConnectionContext';
export type {
  ConnectionInfo,
  ConnectionState,
  ConnectionActions,
} from '@/context/ConnectionContext';
