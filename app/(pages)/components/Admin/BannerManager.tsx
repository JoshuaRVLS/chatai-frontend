
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiTrash2, FiMove, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from '@/app/lib/toast';

interface Banner {
    id: string;
    imageUrl: string;
    title: string | null;
    link: string | null;
    isActive: boolean;
    order: number;
}

const BannerManager = () => {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newBanner, setNewBanner] = useState({ imageUrl: '', title: '', link: '' });

    const { data: banners, isLoading } = useQuery<Banner[]>({
        queryKey: ['banners'],
        queryFn: async () => {
            const res = await fetch('/api/banners');
            if (!res.ok) throw new Error('Failed to fetch banners');
            return res.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create banner');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
            setIsCreating(false);
            setNewBanner({ imageUrl: '', title: '', link: '' });
            toast.success('Banner created successfully');
        },
        onError: () => toast.error('Failed to create banner'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete banner');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
            toast.success('Banner deleted');
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const res = await fetch(`/api/banners/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive }),
            });
            if (!res.ok) throw new Error('Failed to update banner');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
            toast.success('Banner updated');
        }
    });


    if (isLoading) return <div className="text-white/50">Loading banners...</div>;

    return (
        <div className="space-y-8 p-6 bg-zinc-900/50 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Home Banners</h2>
                    <p className="text-zinc-500 text-xs mt-1">Manage the carousel banners on the home page.</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                    <FiPlus /> New Banner
                </button>
            </div>

            {isCreating && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase">Image URL (Required)</label>
                        <input
                            type="text"
                            value={newBanner.imageUrl}
                            onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase">Title (Optional)</label>
                            <input
                                type="text"
                                value={newBanner.title}
                                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                                placeholder="Banner Title"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase">Target Link (Optional)</label>
                            <input
                                type="text"
                                value={newBanner.link}
                                onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                                placeholder="/create_character"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-zinc-400 text-xs font-bold uppercase hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => createMutation.mutate(newBanner)}
                            disabled={!newBanner.imageUrl}
                            className="px-6 py-2 bg-white text-black rounded-lg font-bold text-xs uppercase hover:bg-zinc-200 disabled:opacity-50"
                        >
                            Create Banner
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {banners?.length === 0 && (
                    <div className="text-center py-10 text-zinc-500 text-sm">No banners found. Create one to get started.</div>
                )}
                {banners?.map((banner) => (
                    <div key={banner.id} className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                        <div className="w-32 h-16 rounded-lg bg-zinc-800 overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold truncate">{banner.title || 'Untitled Banner'}</h3>
                            <p className="text-zinc-500 text-xs truncate">{banner.link || 'No link'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleActiveMutation.mutate({ id: banner.id, isActive: !banner.isActive })}
                                className={`p-2 rounded-lg transition-colors ${banner.isActive ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 bg-white/5'}`}
                                title={banner.isActive ? 'Active' : 'Inactive'}
                            >
                                {banner.isActive ? <FiEye /> : <FiEyeOff />}
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(banner.id)}
                                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BannerManager;
