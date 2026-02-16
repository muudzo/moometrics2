import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';

/**
 * MooMetrics Tracking Utility
 * Provides a unified interface for Analytics and Crashlytics.
 * Ensures events are tracked correctly in production.
 */

export const Analytics = {
    /**
     * Tracks a custom event in Firebase Analytics.
     * Only fires if the environment is production to avoid saturating test data.
     */
    async trackEvent(name: string, params: Record<string, any> = {}) {
        if (import.meta.env.DEV) {
            console.log(`[Analytics Dev] ${name}:`, params);
            return;
        }

        try {
            await FirebaseAnalytics.logEvent({ name, params });
        } catch (e) {
            console.error('Failed to log analytic event', e);
        }
    },

    /**
     * Identifies the user in both Analytics and Crashlytics.
     */
    async identifyUser(username: string) {
        if (import.meta.env.DEV) {
            console.log(`[Analytics Dev] Identifying user: ${username}`);
        }

        try {
            await FirebaseAnalytics.setUserId({ userId: username });
            await FirebaseCrashlytics.setUserId({ userId: username });
        } catch (e) {
            console.error('Failed to identify user', e);
        }
    }
};

export const Crashlytics = {
    /**
     * Logs a non-fatal error to Crashlytics.
     */
    async logError(message: string, error?: any) {
        if (import.meta.env.DEV) {
            console.error(`[Crashlytics Dev] ${message}`, error);
        }

        try {
            await FirebaseCrashlytics.log({ message });
            if (error) {
                await FirebaseCrashlytics.recordException({
                    message: error instanceof Error ? error.message : String(error)
                });
            }
        } catch (e) {
            console.error('Failed to report error to Crashlytics', e);
        }
    },

    /**
     * Forces a crash for testing purposes.
     */
    async testCrash() {
        console.warn('Triggering test crash...');
        await FirebaseCrashlytics.crash({ message: 'MooMetrics Test Crash' });
    }
};
