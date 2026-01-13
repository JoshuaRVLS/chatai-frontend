import { useRef, useState, useCallback, useEffect } from 'react';

export const useDraggableScroll = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);

    // Only enable on desktop (non-touch primary pointer)
    useEffect(() => {
        const checkDevice = () => {
            // Check if device supports hover and has fine pointer (mouse)
            const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
            setIsEnabled(isDesktop);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isEnabled || !ref.current) return;
        setIsDragging(true);
        setHasMoved(false);
        setStartX(e.pageX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);

        // Disable snap to avoid fighting browser
        ref.current.style.scrollSnapType = 'none';
        ref.current.style.cursor = 'grabbing';
    }, [isEnabled]);

    const onMouseLeave = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.scrollSnapType = 'x mandatory';
            ref.current.style.cursor = 'grab';
        }
    }, [isDragging]);

    const onMouseUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.scrollSnapType = 'x mandatory';
            ref.current.style.cursor = 'grab';

            // Should resume snap behavior? 
            // Setting it back immediately might snap weirdly, but usually fine.
        }
    }, [isDragging]);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isEnabled || !isDragging || !ref.current) return;

        e.preventDefault(); // Stop text selection

        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll multiplier

        // Check if we've moved significantly to consider it a drag
        if (Math.abs(walk) > 5) {
            setHasMoved(true);
        }

        ref.current.scrollLeft = scrollLeft - walk;
    }, [isEnabled, isDragging, startX, scrollLeft]);

    // Prevent native drag (images/links)
    const onDragStart = useCallback((e: React.DragEvent) => {
        if (isEnabled) {
            e.preventDefault();
        }
    }, [isEnabled]);

    // Capture click to prevent navigation if we were dragging
    const onClickCapture = useCallback((e: React.MouseEvent) => {
        if (isEnabled && hasMoved) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, [isEnabled, hasMoved]);

    // If disabled, return generic non-interfering props
    if (!isEnabled) {
        return {
            ref,
            events: {}, // No events attached on mobile
            styles: {}
        };
    }

    return {
        ref,
        events: {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove,
            onDragStart, // Critical: Stops image ghost dragging
            onClickCapture // Critical: Stops links firing after drag
        },
        styles: {
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none' as const, // Prevents text highlighting
        }
    };
};
