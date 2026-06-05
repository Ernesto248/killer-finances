const RETRY_DELAYS_MS = [500, 1500, 3500] as const;

const RETRYABLE_ERROR_CODES = new Set([
  "ETIMEDOUT",
  "P2024",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "Authentication timed out",
  "Query read timeout",
]);

export interface WithRetryOptions {
  attempts?: number;
  delays?: readonly number[];
  label?: string;
  onRetry?: (info: { attempt: number; code?: string; delayMs: number }) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions = {}
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delays = options.delays ?? RETRY_DELAYS_MS;

  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const code = (error as { code?: string })?.code;
      const isRetryable = !code || RETRYABLE_ERROR_CODES.has(code);

      if (!isRetryable || attempt === attempts - 1) {
        throw error;
      }

      const delayMs = delays[Math.min(attempt, delays.length - 1)];
      options.onRetry?.({ attempt: attempt + 1, code, delayMs });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
