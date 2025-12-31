import { NextRequest, NextResponse } from 'next/server';
import {
  OpenSearchClient,
  OpenSearchClientError,
  parseMapping,
} from '@crystal-forge/opensearch-client';
import type { ConnectionConfig, AuthConfig } from '@crystal-forge/opensearch-client';

/**
 * GET /api/opensearch/schema
 * Fetch index schema/mapping and return parsed field list
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const host = searchParams.get('host');
    const index = searchParams.get('index');
    const authParam = searchParams.get('auth');

    // Validate required parameters
    if (!host) {
      return NextResponse.json(
        { error: 'Host parameter is required' },
        { status: 400 }
      );
    }

    if (!index) {
      return NextResponse.json(
        { error: 'Index parameter is required' },
        { status: 400 }
      );
    }

    // Build connection config
    const config: ConnectionConfig = {
      host,
      timeout: 30000,
    };

    // Parse auth config if provided
    if (authParam) {
      try {
        config.auth = JSON.parse(authParam) as AuthConfig;
      } catch {
        return NextResponse.json(
          { error: 'Invalid auth parameter format' },
          { status: 400 }
        );
      }
    }

    // Create client and fetch mapping
    const client = new OpenSearchClient(config);

    try {
      // Verify connection first
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

    // Get the mapping for the index
    let mapping;
    try {
      mapping = await client.getMapping(index);
    } catch (err: unknown) {
      if (err instanceof OpenSearchClientError) {
        return NextResponse.json(
          {
            error: `Failed to fetch mapping: ${err.message}`,
            statusCode: err.statusCode,
          },
          { status: err.statusCode || 500 }
        );
      }
      throw err;
    }

    // Parse the mapping into field list
    const fields = parseMapping(mapping);

    return NextResponse.json({
      success: true,
      index: mapping.index,
      fields,
      totalFields: fields.length,
    });
  } catch (err: unknown) {
    console.error('Schema fetch error:', err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to fetch schema',
      },
      { status: 500 }
    );
  }
}
