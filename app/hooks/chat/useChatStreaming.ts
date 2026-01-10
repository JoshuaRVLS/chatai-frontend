"use client";

import { useState, useCallback, useRef } from "react";
import { QueryClient } from "@tanstack/react-query";
import { fetchWithTimeout } from "@/app/utils/fetch";
import type { Message } from "@/app/generated/prisma";

type UserWithId = { id: string } | null | undefined;

export const useChatStreaming = ({
    chatId,
    user,
    selectedModel,
    queryClient,
    scrollToBottom,
    onShowTutorial,
    onClearHistory,
    onClearMemory,
}: {
    chatId: string;
    user: UserWithId;
    selectedModel: string;
    queryClient: QueryClient;
    scrollToBottom: () => void;
    onShowTutorial: () => void;
    onClearHistory: () => void;
    onClearMemory: () => void;
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
    const hasScrolledToBottom = useRef(false);

    const startStreaming = async (content: string, isRegenerate = false, isContinue = false) => {
        try {
            const controller = new AbortController();
            const totalTimeout = setTimeout(() => controller.abort(), 30000);

            const aiRes = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId, content, model: selectedModel, regenerate: isRegenerate, continue: isContinue }),
                signal: controller.signal
            });

            clearTimeout(totalTimeout);

            if (!aiRes.ok || !aiRes.body) throw new Error("AI streaming failed");

            const reader = aiRes.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";
            let isDone = false;
            let buffer = "";
            let lastActivity = Date.now();

            const watchdog = setInterval(() => {
                if (Date.now() - lastActivity > 10000) {
                    console.warn("Watchdog: Stream inactivity detected. Aborting.");
                    controller.abort();
                    clearInterval(watchdog);
                }
            }, 2000);

            try {
                while (!isDone) {
                    const { done, value } = await reader.read();
                    if (done) {
                        isDone = true;
                        break;
                    }

                    lastActivity = Date.now();
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

                        let dataStr = trimmedLine.slice(5).trim();
                        if (dataStr === "[DONE]") {
                            isDone = true;
                            break;
                        }

                        try {
                            const parsed = JSON.parse(dataStr);
                            const delta = parsed.choices[0]?.delta?.content ||
                                parsed.choices[0]?.text || // Fallback for some models
                                "";
                            if (delta) {
                                fullContent += delta;
                                setStreamingMessage(fullContent);
                                scrollToBottom();
                            }
                        } catch (e) {
                            // If parsing fails, it might be an incomplete JSON but we try to continue
                        }
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') throw err;
            } finally {
                clearInterval(watchdog);
            }

            if (buffer.startsWith("data:")) {
                const dataStr = buffer.slice(5).trim();
                if (dataStr !== "[DONE]") {
                    try {
                        const parsed = JSON.parse(dataStr);
                        const delta = parsed.choices[0]?.delta?.content ||
                            parsed.choices[0]?.text ||
                            "";
                        if (delta) fullContent += delta;
                    } catch (e) { }
                }
            }

            const aiOptimisticId = `ai-temp-${Date.now()}`;
            const aiOptimisticMessage: Message = {
                id: aiOptimisticId,
                content: fullContent,
                fromUser: false,
                pinned: false,
                feedback: 'NONE',
                originalContent: null,
                chatId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            queryClient.setQueryData(["messages", chatId], (old: any) => {
                if (!old) return old;
                const newPages = [...old.pages];
                newPages[0] = {
                    ...newPages[0],
                    data: [aiOptimisticMessage, ...newPages[0].data]
                };
                return { ...old, pages: newPages };
            });

            setStreamingMessage(null);
            setIsSubmitting(false);
            setTimeout(() => scrollToBottom(), 100);

            (async () => {
                try {
                    const res = await fetch("/api/messages/ai", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chatId, content: fullContent }),
                    });

                    if (res.ok) {
                        const { data: savedMsg } = await res.json();
                        queryClient.setQueryData(["messages", chatId], (old: any) => {
                            if (!old) return old;
                            return {
                                ...old,
                                pages: old.pages.map((page: any, i: number) => {
                                    if (i !== 0) return page;
                                    return {
                                        ...page,
                                        data: page.data.map((m: any) => m.id === aiOptimisticId ? savedMsg : m)
                                    };
                                })
                            };
                        });
                    }
                } catch (e) {
                    console.error("Background save failed:", e);
                }
            })();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleSubmit = useCallback(async (content: string) => {
        if (!content.trim() || !user?.id || isSubmitting) return;

        const trimmed = content.trim();
        if (trimmed.startsWith("/")) {
            const parts = trimmed.split(" ");
            const command = parts[0].toLowerCase();
            if (command === "/help") {
                onShowTutorial();
                return;
            }
            if (command === "/clear") {
                onClearHistory();
                return;
            }
            if (command === "/reset") {
                onClearMemory();
                return;
            }
        }

        setIsSubmitting(true);
        hasScrolledToBottom.current = false;

        const now = new Date();
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            content: content.trim(),
            fromUser: true,
            pinned: false,
            feedback: 'NONE',
            originalContent: null,
            chatId,
            createdAt: now,
            updatedAt: now,
        };

        queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            const newPages = [...old.pages];
            newPages[0] = {
                ...newPages[0],
                data: [optimisticMessage, ...newPages[0].data]
            };
            return { ...old, pages: newPages };
        });

        scrollToBottom();

        try {
            const saveRes = await fetchWithTimeout("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chatId,
                    content: content.trim(),
                    userId: user.id,
                    fromUser: true,
                }),
                timeout: 10000
            });

            if (!saveRes.ok) throw new Error("Failed to send message");
            const { data: savedUserMsg } = await saveRes.json();

            queryClient.setQueryData(["messages", chatId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any, i: number) => {
                        if (i !== 0) return page;
                        return {
                            ...page,
                            data: page.data.map((m: any) => m.id === optimisticMessage.id ? savedUserMsg : m)
                        };
                    })
                };
            });

            await startStreaming(content.trim());
        } catch (err) {
            console.error(err);
            queryClient.setQueryData(["messages", chatId], (old: any) => {
                if (!old) return old;
                const newPages = [...old.pages];
                newPages[0] = {
                    ...newPages[0],
                    data: newPages[0].data.filter((m: any) => m.id !== optimisticMessage.id)
                };
                return { ...old, pages: newPages };
            });
            throw err;
        } finally {
            setIsSubmitting(false);
            setStreamingMessage(null);
        }
    }, [user?.id, chatId, isSubmitting, queryClient, scrollToBottom, onShowTutorial, onClearHistory, onClearMemory]);

    const handleContinueStory = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await startStreaming("", false, true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
            setStreamingMessage(null);
        }
    }, [isSubmitting]);

    return {
        isSubmitting,
        streamingMessage,
        setIsSubmitting,
        setStreamingMessage,
        handleSubmit,
        handleContinueStory,
        startStreaming,
    };
};
