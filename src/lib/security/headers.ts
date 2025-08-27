// Security headers configuration

export interface SecurityHeaders {
  [key: string]: string;
}

// Security headers for different environments
export const securityHeaders: SecurityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
  ].join(', '),

  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // DNS prefetch control
  'X-DNS-Prefetch-Control': 'on',

  // Download options for IE
  'X-Download-Options': 'noopen',

  // Prevent Flash/PDF execution
  'X-Permitted-Cross-Domain-Policies': 'none',
};

// Additional headers for API routes
export const apiSecurityHeaders: SecurityHeaders = {
  ...securityHeaders,
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
};

// Headers for static assets
export const staticAssetHeaders: SecurityHeaders = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'X-Content-Type-Options': 'nosniff',
};

// Get security headers for Next.js config
export function getNextJSSecurityHeaders() {
  return Object.entries(securityHeaders).map(([key, value]) => ({
    key,
    value,
  }));
}

// Middleware to add security headers
export function addSecurityHeaders(
  headers: Headers,
  type: 'page' | 'api' | 'static' = 'page'
): void {
  const headersToAdd =
    type === 'api'
      ? apiSecurityHeaders
      : type === 'static'
        ? staticAssetHeaders
        : securityHeaders;

  Object.entries(headersToAdd).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

// Security header validation
export function validateSecurityHeaders(headers: Headers): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Strict-Transport-Security',
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  requiredHeaders.forEach(header => {
    if (!headers.get(header)) {
      missing.push(header);
    }
  });

  // Check for potential issues
  const csp = headers.get('Content-Security-Policy');
  if (!csp) {
    warnings.push('Content-Security-Policy header is missing');
  } else if (csp.includes("'unsafe-inline'") && csp.includes("'unsafe-eval'")) {
    warnings.push('CSP contains both unsafe-inline and unsafe-eval');
  }

  const frameOptions = headers.get('X-Frame-Options');
  if (frameOptions && !['DENY', 'SAMEORIGIN'].includes(frameOptions)) {
    warnings.push('X-Frame-Options should be DENY or SAMEORIGIN');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

// Security header testing utility
export function testSecurityHeaders(url: string): Promise<{
  headers: Record<string, string>;
  validation: ReturnType<typeof validateSecurityHeaders>;
}> {
  return fetch(url, { method: 'HEAD' }).then(response => {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const validation = validateSecurityHeaders(response.headers);

    return { headers, validation };
  });
}
