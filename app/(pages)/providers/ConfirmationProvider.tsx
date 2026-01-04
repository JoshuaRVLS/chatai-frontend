"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmationModal from "@/app/(pages)/components/Modal/ConfirmationModal";

interface ConfirmationOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "primary";
}

interface ConfirmationContextType {
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions>({
        title: "",
        message: "",
    });
    const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmationOptions) => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolver(() => resolve);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setIsOpen(false);
        resolver?.(true);
    }, [resolver]);

    const handleCancel = useCallback(() => {
        setIsOpen(false);
        resolver?.(false);
    }, [resolver]);

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}
            <ConfirmationModal
                isOpen={isOpen}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                {...options}
            />
        </ConfirmationContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmationProvider");
    }
    return context.confirm;
};
