// Content Security Policy configuration

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'child-src'?: string[];
  'worker-src'?: string[];
  'frame-src'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'manifest-src'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

// Development CSP (more permissive for development tools)
export const developmentCSP: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for development
    "'unsafe-inline'", // Required for development
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://cdn.jsdelivr.net',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind and styled-components
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://images.pexels.com',
    'https://ui-avatars.com',
    'https://www.google-analytics.com',
  ],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://*.supabase.in',
    'https://api.openai.com',
    'https://api.resend.com',
    'https://mainnet.base.org',
    'https://sepolia.base.org',
    'https://api.coinbase.com',
    'https://api.developer.coinbase.com',
    'https://www.google-analytics.com',
    'https://region1.google-analytics.com',
    'wss://',
    'ws://localhost:*', // WebSocket for development
  ],
  'media-src': ["'self'", 'https:'],
  'object-src': ["'none'"],
  'child-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'frame-src': [
    "'self'",
    'https://www.google.com', // reCAPTCHA
    'https://challenges.cloudflare.com', // Cloudflare challenges
  ],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"],
};

// Production CSP (more restrictive)
export const productionCSP: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    // Add nonce for inline scripts in production
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Still needed for Tailwind
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://images.pexels.com',
    'https://ui-avatars.com',
    'https://www.google-analytics.com',
  ],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://*.supabase.in',
    'https://api.openai.com',
    'https://api.resend.com',
    'https://mainnet.base.org',
    'https://api.coinbase.com',
    'https://api.developer.coinbase.com',
    'https://www.google-analytics.com',
    'https://region1.google-analytics.com',
    'wss://*.supabase.co',
  ],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'child-src': ["'none'"],
  'worker-src': ["'self'"],
  'frame-src': ['https://www.google.com', 'https://challenges.cloudflare.com'],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"],
  'upgrade-insecure-requests': true,
  'block-all-mixed-content': true,
};

// Convert CSP object to string
export function generateCSPString(directives: CSPDirectives): string {
  const cspParts: string[] = [];

  Object.entries(directives).forEach(([directive, values]) => {
    if (typeof values === 'boolean') {
      if (values) {
        cspParts.push(directive);
      }
    } else if (Array.isArray(values) && values.length > 0) {
      cspParts.push(`${directive} ${values.join(' ')}`);
    }
  });

  return cspParts.join('; ');
}

// Get CSP for current environment
export function getCSP(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const directives = isDevelopment ? developmentCSP : productionCSP;
  return generateCSPString(directives);
}

// Nonce generation for inline scripts
export function generateNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// CSP violation reporting
export interface CSPViolation {
  'document-uri': string;
  referrer: string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  disposition: string;
  'blocked-uri': string;
  'line-number': number;
  'column-number': number;
  'source-file': string;
  'status-code': number;
  'script-sample': string;
}

export function handleCSPViolation(violation: CSPViolation): void {
  console.warn('CSP Violation:', {
    directive: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    documentUri: violation['document-uri'],
    lineNumber: violation['line-number'],
    columnNumber: violation['column-number'],
  });

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to error monitoring service
    fetch('/api/security/csp-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(violation),
    }).catch(console.error);
  }
}
