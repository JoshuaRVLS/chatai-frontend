/**
 * Safe wrapper for localStorage to prevent SSR crashes and handle broken environments.
 * Checks if localStorage exists and if getItem/setItem are actual functions.
 */
export const safeLocalStorage = {
    getItem: (key: string): string | null => {
        try {
            if (typeof window === 'undefined') return null;
            if (!window.localStorage) return null;
            if (typeof window.localStorage.getItem !== 'function') return null;
            return window.localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage access failed:', e);
            return null;
        }
    },
    setItem: (key: string, value: string): void => {
        try {
            if (typeof window === 'undefined') return;
            if (!window.localStorage) return;
            if (typeof window.localStorage.setItem !== 'function') return;
            window.localStorage.setItem(key, value);
        } catch (e) {
            console.warn('localStorage write failed:', e);
        }
    },
    removeItem: (key: string): void => {
        try {
            if (typeof window === 'undefined') return;
            if (!window.localStorage) return;
            if (typeof window.localStorage.removeItem !== 'function') return;
            window.localStorage.removeItem(key);
        } catch (e) {
            console.warn('localStorage remove failed:', e);
        }
    }
};
