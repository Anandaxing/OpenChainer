export interface RateLimitOptions {
	windowMs?: number;
	maxRequests?: number;
}

export interface RateLimitResult {
	allowed: boolean;
	retryAfter: number; // in seconds
	remaining: number;
}

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 10; // 10 requests per minute
const MAX_MAP_SIZE = 5_000; // Cleanup threshold for memory safety

// In-memory sliding-window hit store: IP -> array of timestamps
const hitStore = new Map<string, number[]>();

/**
 * Checks whether an incoming request from an IP is allowed under the current rate limit.
 */
export function checkRateLimit(
	ip: string,
	options: RateLimitOptions = {},
): RateLimitResult {
	const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
	const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;
	const now = Date.now();

	// Filter timestamps strictly inside the active sliding window
	const timestamps = (hitStore.get(ip) ?? []).filter(
		(timestamp) => now - timestamp < windowMs,
	);

	if (timestamps.length >= maxRequests) {
		const oldestTimestamp = timestamps[0];
		const retryAfter = Math.max(
			1,
			Math.ceil((windowMs - (now - oldestTimestamp)) / 1000),
		);

		return {
			allowed: false,
			retryAfter,
			remaining: 0,
		};
	}

	timestamps.push(now);
	hitStore.set(ip, timestamps);

	// Periodic cleanup of stale entries when store size exceeds threshold
	if (hitStore.size > MAX_MAP_SIZE) {
		for (const [key, times] of hitStore) {
			if (times.every((t) => now - t >= windowMs)) {
				hitStore.delete(key);
			}
		}
	}

	return {
		allowed: true,
		retryAfter: 0,
		remaining: maxRequests - timestamps.length,
	};
}

/**
 * Safely extracts client IP from Request headers across proxy/serverless environments.
 */
export function getClientIp(request: Request): string {
	const xForwardedFor = request.headers.get("x-forwarded-for");
	if (xForwardedFor) {
		const clientIp = xForwardedFor.split(",")[0]?.trim();
		if (clientIp) return clientIp;
	}

	const xRealIp = request.headers.get("x-real-ip")?.trim();
	if (xRealIp) return xRealIp;

	const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
	if (cfConnectingIp) return cfConnectingIp;

	return "unknown";
}

/**
 * Helper to reset rate limits (primarily used in automated unit tests).
 */
export function resetRateLimits(): void {
	hitStore.clear();
}
