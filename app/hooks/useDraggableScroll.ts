import { useRef, useState, useCallback } from 'react';

export const useDraggableScroll = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        setIsDragging(true);
        setStartX(e.pageX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);
        // Disable snap while dragging for smoother experience
        ref.current.style.scrollSnapType = 'none';
        ref.current.style.cursor = 'grabbing';
    }, []);

    const onMouseLeave = useCallback(() => {
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.scrollSnapType = 'x mandatory';
            ref.current.style.cursor = 'grab';
        }
    }, []);

    const onMouseUp = useCallback(() => {
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.scrollSnapType = 'x mandatory';
            ref.current.style.cursor = 'grab';
        }
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        ref.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft]);

    return {
        ref,
        events: {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove,
        },
        styles: {
            cursor: 'grab' as const
        }
    };
};
