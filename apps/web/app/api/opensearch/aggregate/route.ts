import { NextRequest, NextResponse } from 'next/server';
import {
  OpenSearchClient,
  OpenSearchClientError,
} from '@crystal-forge/opensearch-client';
import type { ConnectionConfig } from '@crystal-forge/opensearch-client';
import {
  serializeAggregation,
  serializeQuery,
} from '@crystal-forge/query-dsl';
import type {
  Aggregation,
  QueryNode,
  AggregationType,
} from '@crystal-forge/query-dsl';
import { translateHostForDocker } from '@/lib/docker-host';

/**
 * Request body interface for aggregation endpoint
 */
interface AggregateRequestBody {
  config: ConnectionConfig;
  index: string;
  field: string;
  fieldType: 'keyword' | 'text' | 'long' | 'integer' | 'double' | 'float' | 'date' | 'boolean';
  aggregationType?: AggregationType;
  options?: {
    size?: number;
    interval?: string | number;
  };
  query?: QueryNode;
}

/**
 * Get the appropriate aggregation type based on field type
 */
function getDefaultAggregationType(fieldType: string): AggregationType {
  switch (fieldType) {
    case 'keyword':
    case 'text':
    case 'boolean':
      return 'terms';
    case 'long':
    case 'integer':
    case 'short':
    case 'byte':
    case 'double':
    case 'float':
      return 'stats';
    case 'date':
      return 'date_histogram';
    default:
      return 'terms';
  }
}

/**
 * Build aggregation based on type and options
 */
function buildAggregation(
  field: string,
  aggType: AggregationType,
  options?: { size?: number; interval?: string | number }
): Aggregation {
  const baseAgg = {
    name: 'field_agg',
    field,
  };

  switch (aggType) {
    case 'terms':
      return {
        ...baseAgg,
        type: 'terms',
        size: options?.size ?? 10,
      };

    case 'stats':
      return {
        ...baseAgg,
        type: 'stats',
      };

    case 'extended_stats':
      return {
        ...baseAgg,
        type: 'extended_stats',
      };

    case 'date_histogram':
      return {
        ...baseAgg,
        type: 'date_histogram',
        calendar_interval: (options?.interval as string) ?? '1d',
        format: 'yyyy-MM-dd',
      };

    case 'histogram':
      return {
        ...baseAgg,
        type: 'histogram',
        interval: (options?.interval as number) ?? 10,
      };

    case 'cardinality':
      return {
        ...baseAgg,
        type: 'cardinality',
      };

    case 'avg':
    case 'sum':
    case 'min':
    case 'max':
      return {
        ...baseAgg,
        type: aggType,
      };

    case 'value_count':
      return {
        ...baseAgg,
        type: 'value_count',
      };

    case 'range':
      // Range requires explicit ranges, default to empty
      return {
        ...baseAgg,
        type: 'range',
        ranges: [],
      };

    default:
      return {
        ...baseAgg,
        type: 'terms',
        size: options?.size ?? 10,
      };
  }
}

/**
 * POST /api/opensearch/aggregate
 * Execute a field aggregation for exploration
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AggregateRequestBody;
    const { config, index, field, fieldType, aggregationType, options, query } = body;

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

    if (!field) {
      return NextResponse.json(
        { error: 'Field is required' },
        { status: 400 }
      );
    }

    // Determine aggregation type
    const aggType = aggregationType ?? getDefaultAggregationType(fieldType);

    // Build the aggregation
    const aggregation = buildAggregation(field, aggType, options);
    const serializedAgg = serializeAggregation(aggregation);

    // Build the request body
    const requestBody: Record<string, unknown> = {
      size: 0, // Don't return documents, just aggregations
      aggs: serializedAgg,
    };

    // Add query context if provided
    if (query) {
      requestBody.query = serializeQuery(query);
    }

    // Translate localhost to Docker network name if running in Docker
    const translatedConfig = {
      ...config,
      host: translateHostForDocker(config.host),
    };

    // Create client
    const client = new OpenSearchClient(translatedConfig);

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

    // Execute the aggregation query
    let results;
    try {
      results = await client.search(index, requestBody);
    } catch (err: unknown) {
      if (err instanceof OpenSearchClientError) {
        const errorDetails = err.opensearchError?.error;
        const errorMessage = errorDetails?.reason || err.message;

        return NextResponse.json(
          {
            error: errorMessage,
            statusCode: err.statusCode,
            details: {
              type: errorDetails?.type,
              reason: errorDetails?.reason,
            },
          },
          { status: err.statusCode || 500 }
        );
      }
      throw err;
    }

    // Extract aggregation results
    const aggregations = results.aggregations || {};
    const fieldAggResult = aggregations.field_agg;

    return NextResponse.json({
      success: true,
      field,
      aggregationType: aggType,
      result: fieldAggResult,
      totalHits: results.hits?.total?.value ?? 0,
    });
  } catch (err: unknown) {
    console.error('Aggregation error:', err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Aggregation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/opensearch/aggregate
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'OpenSearch aggregate endpoint. Use POST to run aggregations.',
    supportedTypes: [
      'terms',
      'stats',
      'extended_stats',
      'date_histogram',
      'histogram',
      'cardinality',
      'avg',
      'sum',
      'min',
      'max',
      'value_count',
    ],
  });
}
