"use client";

import { useState, useCallback } from "react";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/app/lib/toast";
import { fetchWithTimeout } from "@/app/utils/fetch";
import type { Message } from "@/app/generated/prisma";

export const useChatActions = ({
    chatId,
    queryClient,
    confirm,
    allMessages,
    startStreaming,
    setIsSubmitting,
    setStreamingMessage,
    setShouldAutoScroll,
    setSelectedModel,
    setSelectedPersonaId,
}: {
    chatId: string;
    queryClient: QueryClient;
    confirm: (options: any) => Promise<boolean>;
    allMessages: Message[];
    startStreaming: (content: string, isRegenerate?: boolean, isContinue?: boolean) => Promise<void>;
    setIsSubmitting: (val: boolean) => void;
    setStreamingMessage: (val: string | null) => void;
    setShouldAutoScroll: (val: boolean) => void;
    setSelectedModel: (val: string) => void;
    setSelectedPersonaId: (val: string | null) => void;
}) => {
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [undoStack, setUndoStack] = useState<Message[][]>([]);

    const pushToUndoStack = useCallback(() => {
        setUndoStack(prev => {
            const newStack = [allMessages, ...prev];
            return newStack.slice(0, 10);
        });
    }, [allMessages]);

    const handleUndo = useCallback(async () => {
        if (undoStack.length === 0) return;
        const previous = undoStack[0];
        setUndoStack(prev => prev.slice(1));

        queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: [{ data: [...previous].reverse(), nextCursor: null }]
            };
        });

        try {
            await fetch(`/api/messages/undo?chatId=${chatId}`, { method: "POST" });
            toast.success("Change undone");
        } catch (err) {
            toast.error("Failed to sync undo state");
        }
    }, [undoStack, chatId, queryClient]);

    const handleEdit = useCallback((messageId: string, content: string) => {
        setEditingMessageId(messageId);
        setEditContent(content);
    }, []);

    const handleEditContentChange = useCallback((content: string) => {
        setEditContent(content);
    }, []);

    const handleSaveEdit = useCallback(async (messageId: string) => {
        if (!editContent.trim()) return;

        queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page: any) => ({
                    ...page,
                    data: page.data.map((m: any) => m.id === messageId ? { ...m, content: editContent } : m)
                }))
            };
        });

        try {
            await fetch(`/api/messages/${messageId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent }),
            });
            setEditingMessageId(null);
            setEditContent("");
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
            }, 1000);
        } catch (err) {
            toast.error("Failed to save edit");
            queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        }
    }, [editContent, chatId, queryClient]);

    const handleCancelEdit = useCallback(() => {
        setEditingMessageId(null);
        setEditContent("");
    }, []);

    const handleDelete = useCallback(async (messageId: string) => {
        const targetMsg = allMessages.find(m => m.id === messageId);
        if (!targetMsg) return;

        if (!(await confirm({
            title: "Delete Messages",
            message: "Are you sure you want to delete this message and all subsequent messages? This will permanently rewind the simulation.",
            confirmLabel: "Delete All",
            variant: "danger"
        }))) return;

        pushToUndoStack();

        queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page: any) => ({
                    ...page,
                    data: page.data.filter((m: any) => new Date(m.createdAt) < new Date(targetMsg.createdAt))
                }))
            };
        });

        try {
            await fetchWithTimeout(`/api/messages/${messageId}`, { method: "DELETE" });
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
            }, 1000);
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete message");
            queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        }
    }, [chatId, queryClient, pushToUndoStack, confirm, allMessages]);

    const handleRegenerate = useCallback(async (messageId: string) => {
        setIsSubmitting(true);
        setShouldAutoScroll(true);

        const msgIndex = allMessages.findIndex((m) => m.id === messageId);
        if (msgIndex === -1) return;

        const targetMsg = allMessages[msgIndex];
        const lastUserMsg = allMessages[msgIndex - 1];
        const hasUserMessage = lastUserMsg && lastUserMsg.fromUser;

        queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page: any) => ({
                    ...page,
                    data: page.data.filter((m: any) => new Date(m.createdAt) < new Date(targetMsg.createdAt))
                }))
            };
        });

        try {
            await fetchWithTimeout(`/api/messages/${messageId}`, { method: "DELETE" });

            if (hasUserMessage) {
                await startStreaming(lastUserMsg.content, true);
            } else {
                await startStreaming("", false, true);
            }
        } catch (err) {
            console.error("Regenerate failed:", err);
            toast.error("Failed to regenerate");
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
            }, 1000);
        } finally {
            setIsSubmitting(false);
            setStreamingMessage(null);
        }
    }, [allMessages, chatId, queryClient, startStreaming, setIsSubmitting, setShouldAutoScroll, setStreamingMessage]);

    const handleUserRegenerate = useCallback(async (messageId: string) => {
        const msgIndex = allMessages.findIndex((m) => m.id === messageId);
        if (msgIndex === -1) return;

        const targetMsg = allMessages[msgIndex];
        if (!targetMsg.fromUser) return;

        pushToUndoStack();
        setIsSubmitting(true);
        setShouldAutoScroll(true);

        queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page: any) => ({
                    ...page,
                    data: page.data.filter((m: any) => new Date(m.createdAt) < new Date(targetMsg.createdAt))
                }))
            };
        });

        try {
            await fetchWithTimeout(`/api/messages/${messageId}`, { method: "DELETE" });
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
            }, 1000);
            await startStreaming(targetMsg.content, true);
        } catch (err) {
            console.error("User regenerate failed:", err);
            toast.error("Failed to redo message");
            queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        } finally {
            setIsSubmitting(false);
            setStreamingMessage(null);
        }
    }, [allMessages, chatId, queryClient, pushToUndoStack, startStreaming, setIsSubmitting, setShouldAutoScroll, setStreamingMessage]);

    const handleFeedback = useCallback(async (messageId: string, feedback: "LIKE" | "DISLIKE" | "NONE") => {
        queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page: any) => ({
                    ...page,
                    data: page.data.map((m: any) => m.id === messageId ? { ...m, feedback } : m)
                }))
            };
        });

        try {
            const res = await fetch(`/api/messages/${messageId}/feedback`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback }),
            });
            if (!res.ok) throw new Error();
            toast.success(feedback === "LIKE" ? "Response Liked" : feedback === "DISLIKE" ? "Response Disliked" : "Feedback cleared");
        } catch (err) {
            toast.error("Failed to submit feedback");
            await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        }
    }, [chatId, queryClient]);

    const handleClearHistory = useCallback(async () => {
        if (!(await confirm({
            title: "Reset Chat Conversation",
            message: "Are you sure you want to reset this conversation? All existing messages will be cleared and the character will return to its initial greeting.",
            confirmLabel: "Reset Conversation",
            variant: "danger"
        }))) return;

        setIsSubmitting(true);
        queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page: any, i: number) => ({
                    ...page,
                    data: []
                }))
            };
        });

        try {
            const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("History cleared");
                await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
                await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
            } else {
                toast.error("Failed to clear history");
                queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred");
            queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        } finally {
            setIsSubmitting(false);
        }
    }, [chatId, queryClient, confirm, setIsSubmitting]);

    const handleTogglePin = useCallback(async (messageId: string, currentStatus: boolean) => {
        queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page: any) => ({
                    ...page,
                    data: page.data.map((m: any) => m.id === messageId ? { ...m, pinned: !currentStatus } : m)
                }))
            };
        });

        try {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pinned: !currentStatus }),
            });
            if (!res.ok) throw new Error();
        } catch (err) {
            toast.error("Failed to update pin status");
            await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        }
    }, [chatId, queryClient]);

    const handleClearMemory = useCallback(async () => {
        if (!(await confirm({
            title: "Reset Brain & Memory",
            message: "Are you sure you want to clear all learned facts and long-term memories? This will make the character 'forget' specific details they learned about you.",
            confirmLabel: "Reset Memory",
            variant: "danger"
        }))) return;

        queryClient.setQueryData(["chat", chatId], (old: any) => {
            if (!old) return old;
            return { ...old, data: { ...old.data, memory: null } };
        });

        try {
            const res = await fetch(`/api/chats/${chatId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memory: null }),
            });
            if (res.ok) {
                toast.success("AI brain reset successfully");
                await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
            } else {
                throw new Error();
            }
        } catch (err) {
            toast.error("Failed to reset memory");
            queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
        }
    }, [chatId, queryClient, confirm]);

    const handleUpdateChatSettings = useCallback(async (model: string, personaId: string | null) => {
        setSelectedModel(model);
        setSelectedPersonaId(personaId);

        queryClient.setQueryData(["chat", chatId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                data: {
                    ...old.data,
                    chatSettings: { ...old.data.chatSettings, model },
                    personaId: personaId
                }
            };
        });

        try {
            const res = await fetch(`/api/chats/${chatId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chatSettings: { model },
                    personaId: personaId
                }),
            });
            if (res.ok) {
                toast.success("Chat settings updated");
                await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
            } else {
                throw new Error();
            }
        } catch (err) {
            toast.error("Failed to update chat settings");
            queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
        }
    }, [chatId, queryClient, setSelectedModel, setSelectedPersonaId]);

    const handleUpdateMemory = useCallback(async (newMemory: string) => {
        queryClient.setQueryData(["chat", chatId], (old: any) => {
            if (!old) return old;
            return { ...old, data: { ...old.data, memory: newMemory } };
        });

        try {
            const res = await fetch(`/api/chats/${chatId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memory: newMemory }),
            });
            if (res.ok) {
                toast.success("AI brain updated");
                await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
            } else {
                throw new Error();
            }
        } catch (err) {
            toast.error("Failed to update memory");
            queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
        }
    }, [chatId, queryClient]);

    return {
        editingMessageId,
        editContent,
        undoStack,
        handleUndo,
        handleEdit,
        handleEditContentChange,
        handleSaveEdit,
        handleCancelEdit,
        handleDelete,
        handleRegenerate,
        handleUserRegenerate,
        handleFeedback,
        handleClearHistory,
        handleTogglePin,
        handleClearMemory,
        handleUpdateChatSettings,
        handleUpdateMemory,
    };
};
