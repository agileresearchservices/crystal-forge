/**
 * CSRF Protection Utilities for API Routes
 *
 * Implements CSRF token validation for state-changing operations (POST, PUT, DELETE)
 * GET requests are exempt as they should not modify state.
 *
 * Usage in API routes:
 * ```typescript
 * import { validateCSRFToken, generateCSRFToken } from '@/lib/csrf-protection';
 *
 * export async function POST(request: Request) {
 *   // Validate CSRF token on state-changing requests
 *   const csrfError = await validateCSRFToken(request);
 *   if (csrfError) {
 *     return csrfError;
 *   }
 *   // ... handle request
 * }
 *
 * export async function GET() {
 *   // Generate CSRF token for client
 *   const token = generateCSRFToken();
 *   return Response.json({ token });
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_BODY_FIELD = '_csrf';

/**
 * Generate a new CSRF token
 * Should be generated per-session or per-page load
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validate CSRF token from request
 * Checks token in header (x-csrf-token) or request body (_csrf field)
 *
 * Returns error response if validation fails, null if valid
 */
export async function validateCSRFToken(
  request: Request,
  expectedToken?: string
): Promise<NextResponse | null> {
  try {
    // For development, optionally skip CSRF check
    if (process.env.DISABLE_CSRF_PROTECTION === 'true') {
      console.warn('[CSRF] Protection disabled - only use in development');
      return null;
    }

    // Get token from header first, fallback to body
    let tokenFromRequest = request.headers.get(CSRF_HEADER_NAME);

    if (!tokenFromRequest) {
      // Try to get from request body
      try {
        const bodyText = await request.text();
        if (bodyText) {
          const body = JSON.parse(bodyText);
          tokenFromRequest = body[CSRF_BODY_FIELD];
        }
      } catch {
        // Body is not JSON, that's ok
      }
    }

    if (!tokenFromRequest) {
      return new NextResponse(
        JSON.stringify({
          error: 'CSRF token missing',
          code: 'CSRF_TOKEN_MISSING',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate token format (should be hex string of length 64)
    if (!/^[a-f0-9]{64}$/.test(tokenFromRequest)) {
      return new NextResponse(
        JSON.stringify({
          error: 'CSRF token invalid',
          code: 'CSRF_TOKEN_INVALID',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // If expectedToken is provided, validate it matches
    if (expectedToken && tokenFromRequest !== expectedToken) {
      return new NextResponse(
        JSON.stringify({
          error: 'CSRF token mismatch',
          code: 'CSRF_TOKEN_MISMATCH',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Token is valid
    return null;
  } catch (error) {
    console.error('[CSRF] Validation error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'CSRF validation failed',
        code: 'CSRF_VALIDATION_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Middleware to check if request is state-changing (POST, PUT, DELETE, PATCH)
 */
export function isStateChangingRequest(method: string): boolean {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
}
