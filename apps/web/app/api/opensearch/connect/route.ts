import { NextRequest, NextResponse } from 'next/server';
import {
  OpenSearchClient,
  OpenSearchClientError,
} from '@crystal-forge/opensearch-client';
import type { ConnectionConfig, IndexInfo } from '@crystal-forge/opensearch-client';

/**
 * POST /api/opensearch/connect
 * Validate connection to OpenSearch cluster
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = body as ConnectionConfig;

    // Validate required fields
    if (!config.host) {
      return NextResponse.json(
        { error: 'Host URL is required' },
        { status: 400 }
      );
    }

    // Create client and attempt connection
    const client = new OpenSearchClient(config);

    try {
      await client.connect();
    } catch (err: unknown) {
      if (err instanceof OpenSearchClientError) {
        return NextResponse.json(
          {
            error: err.message,
            statusCode: err.statusCode,
            details: err.opensearchError,
          },
          { status: err.statusCode || 500 }
        );
      }
      throw err;
    }

    // Get list of indices
    let indices: IndexInfo[] = [];
    try {
      indices = await client.getIndices();
      // Filter out system indices (starting with .)
      indices = indices.filter((idx) => !idx.name.startsWith('.'));
    } catch (err: unknown) {
      // If we can't list indices, still return success for connection
      console.error('Failed to list indices:', err);
      indices = [];
    }

    return NextResponse.json({
      success: true,
      message: 'Connected successfully',
      indices,
    });
  } catch (err: unknown) {
    console.error('Connection error:', err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Connection failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/opensearch/connect
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'OpenSearch connection endpoint',
  });
}
