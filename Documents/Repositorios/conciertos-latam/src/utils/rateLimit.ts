interface RateLimitConfig {
    maxCalls: number;    // Maximum number of calls allowed
    windowMs: number;    // Time window in milliseconds
}

interface RateLimitState {
    calls: number[];
    cooldownUntil?: number;
}

/**
 * Rate limiting utility to prevent spam and abuse
 * Only applies to write operations (INSERT/UPDATE/DELETE)
 * Read operations (SELECT) should remain unlimited
 */
export const rateLimit = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config: RateLimitConfig
): T => {
    const state: RateLimitState = {
        calls: []
    };

    return (async (...args: Parameters<T>) => {
        const now = Date.now();

        // Check if still in cooldown
        if (state.cooldownUntil && now < state.cooldownUntil) {
            const waitSeconds = Math.ceil((state.cooldownUntil - now) / 1000);
            throw new Error(
                `Por favor espera ${waitSeconds} segundo${waitSeconds > 1 ? 's' : ''} antes de intentar de nuevo.`
            );
        }

        // Filter calls within the time window
        state.calls = state.calls.filter(time => now - time < config.windowMs);

        // Check if limit exceeded
        if (state.calls.length >= config.maxCalls) {
            const oldestCall = Math.min(...state.calls);
            const waitTime = Math.ceil((config.windowMs - (now - oldestCall)) / 1000);

            // Set cooldown
            state.cooldownUntil = now + (config.windowMs - (now - oldestCall));

            throw new Error(
                `Has realizado esta acción muchas veces. Espera ${waitTime} segundo${waitTime > 1 ? 's' : ''}.`
            );
        }

        // Record this call
        state.calls.push(now);

        // Execute the original function
        return fn(...args);
    }) as T;
};

/**
 * Hook for rate limiting with React state management
 * Provides cooldown state for UI feedback
 */
export const useRateLimit = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config: RateLimitConfig
): {
    execute: T;
    cooldown: number;
    canExecute: boolean;
} => {
    const [cooldown, setCooldown] = React.useState(0);
    const [canExecute, setCanExecute] = React.useState(true);
    const timerRef = React.useRef<NodeJS.Timeout>();

    const rateLimitedFn = React.useMemo(
        () => rateLimit(fn, config),
        [fn, config.maxCalls, config.windowMs]
    );

    const execute = React.useCallback(
        async (...args: Parameters<T>) => {
            try {
                const result = await rateLimitedFn(...args);
                return result;
            } catch (error) {
                // Extract wait time from error message
                const match = (error as Error).message.match(/(\d+) segundo/);
                if (match) {
                    const seconds = parseInt(match[1]);
                    setCooldown(seconds);
                    setCanExecute(false);

                    // Start countdown
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = setInterval(() => {
                        setCooldown(prev => {
                            if (prev <= 1) {
                                setCanExecute(true);
                                if (timerRef.current) clearInterval(timerRef.current);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                }
                throw error;
            }
        },
        [rateLimitedFn]
    ) as T;

    React.useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return { execute, cooldown, canExecute };
};

// Add React import for the hook
import React from 'react';
