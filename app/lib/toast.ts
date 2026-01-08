import { useToastStore, type ToastType } from '@/app/hooks/useToastStore';

interface ToastOptions {
    duration?: number;
}

const createToast = (message: string, type: ToastType, options?: ToastOptions) => {
    return useToastStore.getState().addToast({
        message,
        type,
        duration: options?.duration,
    });
};

export const toast = {
    success: (message: string, options?: ToastOptions) =>
        createToast(message, 'success', options),
    error: (message: string, options?: ToastOptions) =>
        createToast(message, 'error', options),
    info: (message: string, options?: ToastOptions) =>
        createToast(message, 'info', options),
    loading: (message: string, options?: ToastOptions) =>
        createToast(message, 'loading', { ...options, duration: Infinity }),
    dismiss: (id: string) =>
        useToastStore.getState().removeToast(id),
    promise: async <T,>(
        promise: Promise<T>,
        msgs: { loading: string; success: string; error: string },
        options?: ToastOptions
    ) => {
        const id = createToast(msgs.loading, 'loading', { ...options, duration: Infinity });
        try {
            const result = await promise;
            useToastStore.getState().updateToast(id, {
                message: msgs.success,
                type: 'success',
                duration: options?.duration || 4000
            });
            return result;
        } catch (error) {
            useToastStore.getState().updateToast(id, {
                message: msgs.error,
                type: 'error',
                duration: options?.duration || 4000
            });
            throw error;
        }
    },
};
