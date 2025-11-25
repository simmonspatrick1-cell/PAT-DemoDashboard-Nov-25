/**
 * OAuth 2.0 M2M (Machine-to-Machine) Authentication for NetSuite
 *
 * This module implements the industry-standard OAuth 2.0 Client Credentials flow
 * using certificate-based authentication (JWT signing with RSA keys).
 *
 * Security Benefits over TBA:
 * - Short-lived access tokens (1 hour expiration)
 * - Certificate rotation enforced (2 year max)
 * - Private key never transmitted to NetSuite
 * - Eliminates credential sprawl
 *
 * @see https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_161937629970.html
 */

import { SignJWT, importPKCS8 } from 'jose';

// In-memory token cache (use Redis for distributed systems)
const tokenCache = new Map();

/**
 * Get environment configuration with validation
 */
function getOAuthConfig() {
  const required = {
    accountId: process.env.NETSUITE_ACCOUNT_ID,
    clientId: process.env.NETSUITE_CLIENT_ID,
    certId: process.env.NETSUITE_CERT_ID,
    privateKey: process.env.NETSUITE_PRIVATE_KEY
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing OAuth M2M configuration: ${missing.join(', ')}`);
  }

  return {
    ...required,
    tokenEndpoint: `https://${required.accountId}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`,
    scope: 'rest_webservices restlets'
  };
}

/**
 * Generate a signed JWT (Client Assertion) for OAuth token exchange
 *
 * @returns {Promise<string>} Signed JWT
 */
async function generateClientAssertion() {
  const config = getOAuthConfig();

  // Import private key
  const privateKey = await importPKCS8(config.privateKey, 'RS256');

  // Create JWT with required claims
  const jwt = await new SignJWT({})
    .setProtectedHeader({
      alg: 'RS256',
      typ: 'JWT',
      kid: config.certId  // Certificate ID from NetSuite
    })
    .setIssuer(config.clientId)  // Client ID from Integration Record
    .setAudience(config.tokenEndpoint)  // NetSuite token endpoint
    .setIssuedAt()
    .setExpirationTime('55m')  // Max 60 minutes, use 55 for safety margin
    .sign(privateKey);

  return jwt;
}

/**
 * Exchange JWT for access token
 *
 * @returns {Promise<{access_token: string, expires_in: number}>}
 */
async function exchangeJWTForToken() {
  const config = getOAuthConfig();
  const clientAssertion = await generateClientAssertion();

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
      scope: config.scope
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth token exchange failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('No access_token in OAuth response');
  }

  return data;
}

/**
 * Get cached or fresh access token (Singleton Pattern)
 *
 * This function implements intelligent caching to minimize:
 * - Cryptographic signing overhead
 * - Network round-trips to NetSuite
 * - Token refresh failures due to clock skew
 *
 * @returns {Promise<string>} Valid access token
 */
export async function getAccessToken() {
  const cached = tokenCache.get('access_token');

  // Check cache validity (5-minute safety buffer for clock skew)
  if (cached && cached.expiresAt > Date.now() + 300000) {
    return cached.token;
  }

  // Generate new token
  const { access_token, expires_in } = await exchangeJWTForToken();

  // Cache token with expiration
  tokenCache.set('access_token', {
    token: access_token,
    expiresAt: Date.now() + (expires_in * 1000)
  });

  return access_token;
}

/**
 * Generate Authorization header for NetSuite REST API calls
 *
 * @returns {Promise<string>} Bearer token header value
 */
export async function getAuthHeader() {
  const token = await getAccessToken();
  return `Bearer ${token}`;
}

/**
 * Make authenticated request to NetSuite REST API
 *
 * @param {string} endpoint - NetSuite endpoint (e.g., '/services/rest/record/v1/customer')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Response>}
 */
export async function netsuiteRequest(endpoint, options = {}) {
  const config = getOAuthConfig();
  const url = `https://${config.accountId}.suitetalk.api.netsuite.com${endpoint}`;

  const authHeader = await getAuthHeader();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    }
  });

  return response;
}

/**
 * Clear token cache (useful for testing or forced refresh)
 */
export function clearTokenCache() {
  tokenCache.clear();
}

export default {
  getAccessToken,
  getAuthHeader,
  netsuiteRequest,
  clearTokenCache
};
