/**
 * Concurrency Control for NetSuite API Requests
 *
 * NetSuite M2M integrations have strict concurrency limits:
 * - Standard tier: 5 concurrent requests
 * - Premium tier: 10 concurrent requests
 *
 * This module implements:
 * - Request queuing with p-limit
 * - Automatic retry with exponential backoff
 * - Rate limit detection and handling
 * - Request prioritization
 *
 * @see Part II Section 2.4 of Modernization Blueprint
 */

import pLimit from 'p-limit';

/**
 * Configuration
 */
const CONFIG = {
  // NetSuite concurrency limit (adjust based on your account tier)
  concurrencyLimit: parseInt(process.env.NETSUITE_CONCURRENCY_LIMIT || '5'),

  // Retry configuration
  maxRetries: 3,
  initialRetryDelay: 1000, // 1 second
  maxRetryDelay: 32000, // 32 seconds

  // Rate limiting
  requestsPerSecond: 10,
  burstSize: 20
};

/**
 * Create concurrency limiter
 * Ensures no more than N requests execute simultaneously
 */
const limit = pLimit(CONFIG.concurrencyLimit);

/**
 * Request queue statistics
 */
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  retriedRequests: 0,
  queuedRequests: 0,
  activeRequests: 0
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attemptNumber) {
  const delay = Math.min(
    CONFIG.initialRetryDelay * Math.pow(2, attemptNumber),
    CONFIG.maxRetryDelay
  );

  // Add jitter (random 0-20% variation) to prevent thundering herd
  const jitter = delay * 0.2 * Math.random();

  return delay + jitter;
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error, response) {
  // HTTP status codes that warrant retry
  const retryableStatuses = [429, 500, 502, 503, 504];

  if (response && retryableStatuses.includes(response.status)) {
    return true;
  }

  // Network errors (ECONNRESET, ETIMEDOUT)
  if (error.code && ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(error.code)) {
    return true;
  }

  // NetSuite-specific errors
  if (error.message && error.message.includes('SSS_REQUEST_LIMIT_EXCEEDED')) {
    return true;
  }

  return false;
}

/**
 * Execute NetSuite request with concurrency control and retry logic
 *
 * @param {Function} requestFn - Async function that performs the request
 * @param {object} options - Configuration options
 * @returns {Promise<any>} Request result
 */
export async function executeWithConcurrencyControl(requestFn, options = {}) {
  const {
    priority = 'normal', // 'high' | 'normal' | 'low'
    maxRetries = CONFIG.maxRetries,
    metadata = {}
  } = options;

  stats.totalRequests++;
  stats.queuedRequests++;

  return limit(async () => {
    stats.queuedRequests--;
    stats.activeRequests++;

    let lastError;
    let lastResponse;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Execute the request
        const result = await requestFn();

        // Check if result indicates rate limiting (even with 200 OK)
        if (result && result.error && result.error.code === 'SSS_REQUEST_LIMIT_EXCEEDED') {
          throw new Error('SSS_REQUEST_LIMIT_EXCEEDED');
        }

        // Success
        stats.successfulRequests++;
        stats.activeRequests--;

        if (attempt > 0) {
          stats.retriedRequests++;
        }

        return result;

      } catch (error) {
        lastError = error;
        lastResponse = error.response;

        // Check if we should retry
        if (attempt < maxRetries && isRetryableError(error, lastResponse)) {
          const delay = getRetryDelay(attempt);

          console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`, {
            error: error.message,
            status: lastResponse?.status,
            metadata
          });

          await sleep(delay);
          continue;
        }

        // Max retries reached or non-retryable error
        break;
      }
    }

    // All retries exhausted
    stats.failedRequests++;
    stats.activeRequests--;

    throw new Error(
      `Request failed after ${maxRetries + 1} attempts: ${lastError.message}`
    );
  });
}

/**
 * Batch execute multiple requests with concurrency control
 *
 * @param {Array<Function>} requestFns - Array of request functions
 * @param {object} options - Configuration
 * @returns {Promise<Array>} Results (successful or error objects)
 */
export async function executeBatch(requestFns, options = {}) {
  const {
    failFast = false, // If true, stop on first error
    onProgress = null // Callback for progress updates
  } = options;

  const results = [];
  let completed = 0;

  const promises = requestFns.map(async (fn, index) => {
    try {
      const result = await executeWithConcurrencyControl(fn, {
        metadata: { batchIndex: index }
      });

      completed++;
      if (onProgress) {
        onProgress({ completed, total: requestFns.length, index });
      }

      return { success: true, data: result, index };

    } catch (error) {
      completed++;
      if (onProgress) {
        onProgress({ completed, total: requestFns.length, index, error });
      }

      if (failFast) {
        throw error;
      }

      return {
        success: false,
        error: {
          code: 'BATCH_ITEM_FAILED',
          message: error.message,
          index
        }
      };
    }
  });

  if (failFast) {
    return await Promise.all(promises);
  } else {
    return await Promise.allSettled(promises);
  }
}

/**
 * Get current queue statistics
 */
export function getStats() {
  return {
    ...stats,
    successRate: stats.totalRequests > 0
      ? (stats.successfulRequests / stats.totalRequests * 100).toFixed(2) + '%'
      : 'N/A',
    retryRate: stats.totalRequests > 0
      ? (stats.retriedRequests / stats.totalRequests * 100).toFixed(2) + '%'
      : 'N/A'
  };
}

/**
 * Reset statistics (useful for testing)
 */
export function resetStats() {
  stats.totalRequests = 0;
  stats.successfulRequests = 0;
  stats.failedRequests = 0;
  stats.retriedRequests = 0;
  stats.queuedRequests = 0;
  stats.activeRequests = 0;
}

export default {
  execute: executeWithConcurrencyControl,
  executeBatch,
  getStats,
  resetStats
};
