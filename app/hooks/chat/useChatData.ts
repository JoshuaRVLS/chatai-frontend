"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "@/app/lib/toast";
import type {
    Character,
    CharacterImage,
    Chat as ChatModel,
    Message,
    User,
    UserProfileImage,
    UserSettings,
    UserPersona,
} from "@/app/generated/prisma";

export type ChatData = ChatModel & {
    character: Character & { photo: CharacterImage };
    messages: Message[];
    user: User & { profileImage: UserProfileImage; userSettings: UserSettings | null; personas: (UserPersona & { image: any })[] };
};

export const useChatData = (chatId: string) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number>(0);

    const { data: chat, isLoading: isChatLoading, error: chatError } = useQuery<ChatData>({
        queryKey: ["chat", chatId],
        queryFn: async () => {
            const res = await fetch(`/api/chats/${chatId}`);
            if (!res.ok) throw new Error("Failed to fetch chat");
            return res.json().then((data) => data.data);
        },
        staleTime: 1000 * 60 * 5,
    });

    const {
        data: infiniteMessages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isMessagesLoading,
    } = useInfiniteQuery({
        queryKey: ["messages", chatId],
        queryFn: async ({ pageParam }) => {
            const res = await fetch(`/api/messages?chatId=${chatId}&cursor=${pageParam || ""}`);
            if (!res.ok) throw new Error("Failed to fetch messages");
            return res.json();
        },
        initialPageParam: null,
        getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
        staleTime: 5000,
    });

    const allMessages = useMemo(() => {
        if (!infiniteMessages) return [];
        const messages: Message[] = [];
        for (let i = infiniteMessages.pages.length - 1; i >= 0; i--) {
            const page = infiniteMessages.pages[i];
            for (let j = page.data.length - 1; j >= 0; j--) {
                messages.push(page.data[j]);
            }
        }
        return messages;
    }, [infiniteMessages]);

    const fetchSuggestions = async () => {
        if (isGeneratingSuggestions) return;
        setIsGeneratingSuggestions(true);
        try {
            const res = await fetch("/api/suggestions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId }),
            });
            const data = await res.json();
            if (data.success) {
                setSuggestions(data.suggestions);
            } else {
                toast.error("Failed to get ideas");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
        setShouldAutoScroll(isAtBottom);
    }, []);

    const scrollToBottom = useCallback(() => {
        // Immediate scroll for better streaming feel
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, []);

    // Intersection Observer for loading more
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    if (scrollContainerRef.current) {
                        scrollPositionRef.current = scrollContainerRef.current.scrollHeight;
                    }
                    fetchNextPage();
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Maintain scroll position after prepending messages
    useEffect(() => {
        if (isFetchingNextPage) return;
        if (scrollContainerRef.current && scrollPositionRef.current > 0) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            const heightDiff = newScrollHeight - scrollPositionRef.current;
            if (heightDiff > 0) {
                scrollContainerRef.current.scrollTop += heightDiff;
                scrollPositionRef.current = 0;
            }
        }
    }, [allMessages, isFetchingNextPage]);

    return {
        chat,
        isChatLoading,
        chatError,
        infiniteMessages,
        allMessages,
        isMessagesLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        suggestions,
        setSuggestions,
        isGeneratingSuggestions,
        fetchSuggestions,
        scrollContainerRef,
        messagesEndRef,
        loadMoreRef,
        shouldAutoScroll,
        handleScroll,
        scrollToBottom,
    };
};
