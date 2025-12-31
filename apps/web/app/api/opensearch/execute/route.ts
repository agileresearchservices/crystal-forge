import { NextRequest, NextResponse } from 'next/server';
import {
  OpenSearchClient,
  OpenSearchClientError,
} from '@crystal-forge/opensearch-client';
import type { ConnectionConfig, SearchResponse } from '@crystal-forge/opensearch-client';

/**
 * Request body interface
 */
interface ExecuteRequestBody {
  config: ConnectionConfig;
  index: string;
  query: object;
}

/**
 * POST /api/opensearch/execute
 * Execute a query against OpenSearch
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExecuteRequestBody;
    const { config, index, query } = body;

    // Validate required fields
    if (!config?.host) {
      return NextResponse.json(
        { error: 'Connection config with host is required' },
        { status: 400 }
      );
    }

    if (!index) {
      return NextResponse.json(
        { error: 'Index is required' },
        { status: 400 }
      );
    }

    if (!query || typeof query !== 'object') {
      return NextResponse.json(
        { error: 'Query object is required' },
        { status: 400 }
      );
    }

    // Create client
    const client = new OpenSearchClient(config);

    // Verify connection
    try {
      await client.connect();
    } catch (err: unknown) {
      if (err instanceof OpenSearchClientError) {
        return NextResponse.json(
          {
            error: `Connection failed: ${err.message}`,
            statusCode: err.statusCode,
          },
          { status: err.statusCode || 500 }
        );
      }
      throw err;
    }

    // Execute the query
    let results: SearchResponse;
    try {
      results = await client.search(index, query);
    } catch (err: unknown) {
      if (err instanceof OpenSearchClientError) {
        // Return more detailed error for query issues
        const errorDetails = err.opensearchError?.error;
        const errorMessage = errorDetails?.reason || err.message;
        const rootCause = errorDetails?.root_cause?.[0];

        return NextResponse.json(
          {
            error: errorMessage,
            statusCode: err.statusCode,
            details: {
              type: errorDetails?.type,
              reason: errorDetails?.reason,
              rootCause: rootCause
                ? {
                    type: rootCause.type,
                    reason: rootCause.reason,
                    index: rootCause.index,
                  }
                : undefined,
            },
          },
          { status: err.statusCode || 500 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: unknown) {
    console.error('Query execution error:', err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Query execution failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/opensearch/execute
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'OpenSearch execute endpoint. Use POST to execute queries.',
  });
}
