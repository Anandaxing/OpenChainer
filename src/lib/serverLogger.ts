interface LogThrottleOptions {
	windowMs?: number; // Duration to suppress identical logs (default: 30s)
}

const seenErrorLogs = new Map<string, number>();
const seenWarningLogs = new Map<string, number>();
const DEFAULT_WINDOW_MS = 30_000;
const MAX_STORE_SIZE = 1_000;

/**
 * Logs an error to console.error at most once per specified window for the same key.
 * Prevents server terminal log flooding and cascading log bursts.
 */
export function logErrorOnce(
	key: string,
	message: string,
	detail?: unknown,
	options: LogThrottleOptions = {},
): boolean {
	const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
	const now = Date.now();
	const lastLogged = seenErrorLogs.get(key) ?? 0;

	if (now - lastLogged < windowMs) {
		return false; // Suppressed: logged recently
	}

	seenErrorLogs.set(key, now);

	if (detail !== undefined) {
		console.error(`[Server] ${message}`, detail);
	} else {
		console.error(`[Server] ${message}`);
	}

	// Memory safeguard: clean stale entries if store grows large
	if (seenErrorLogs.size > MAX_STORE_SIZE) {
		for (const [k, timestamp] of seenErrorLogs) {
			if (now - timestamp > windowMs) {
				seenErrorLogs.delete(k);
			}
		}
	}

	return true;
}

/**
 * Logs a warning to console.warn at most once per specified window for the same key.
 */
export function logWarningOnce(
	key: string,
	message: string,
	detail?: unknown,
	options: LogThrottleOptions = {},
): boolean {
	const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
	const now = Date.now();
	const lastLogged = seenWarningLogs.get(key) ?? 0;

	if (now - lastLogged < windowMs) {
		return false; // Suppressed: logged recently
	}

	seenWarningLogs.set(key, now);

	if (detail !== undefined) {
		console.warn(`[Server] ${message}`, detail);
	} else {
		console.warn(`[Server] ${message}`);
	}

	// Memory safeguard: clean stale entries if store grows large
	if (seenWarningLogs.size > MAX_STORE_SIZE) {
		for (const [k, timestamp] of seenWarningLogs) {
			if (now - timestamp > windowMs) {
				seenWarningLogs.delete(k);
			}
		}
	}

	return true;
}

/**
 * Helper to reset log stores (used primarily in automated tests).
 */
export function resetServerLogStores(): void {
	seenErrorLogs.clear();
	seenWarningLogs.clear();
}
