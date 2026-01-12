
"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ImageCropper from '@/components/ImageCropper';

interface Banner {
    id: string;
    imageUrl: string;
    title: string | null;
    link: string | null;
    isActive: boolean;
    order: number;
}

export default function BannersPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Upload & Crop State
    const [newBanner, setNewBanner] = useState({ imageUrl: '', title: '', link: '' });
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fetchBanners = async () => {
        try {
            const res = await fetch('/api/banners');
            if (res.ok) {
                const data = await res.json();
                setBanners(data);
            }
        } catch (error) {
            console.error('Failed to fetch banners', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleCreate = async () => {
        try {
            const payload = {
                title: newBanner.title,
                link: newBanner.link,
                // Check if it's external URL or Base64
                externalUrl: !newBanner.imageUrl.startsWith('data:') ? newBanner.imageUrl : undefined,
                imageBase64: newBanner.imageUrl.startsWith('data:') ? newBanner.imageUrl : undefined,
                imageType: (newBanner as any).imageType || 'image/png'
            };

            const res = await fetch('/api/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setNewBanner({ imageUrl: '', title: '', link: '' });
                setIsCreating(false);
                fetchBanners();
            }
        } catch (error) {
            console.error('Failed to create banner', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
            if (res.ok) fetchBanners();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/banners/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive }),
            });
            if (res.ok) fetchBanners();
        } catch (error) {
            console.error('Failed to update', error);
        }
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setSelectedFile(reader.result as string);
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = (croppedBlob: Blob) => {
        setIsCropping(false);
        const reader = new FileReader();
        reader.readAsDataURL(croppedBlob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            setNewBanner(prev => ({
                ...prev,
                imageUrl: base64data, // Use base64 for preview and sending 
                imageType: croppedBlob.type
            }));
        };
    };

    // Helper to distinguish preview URL
    const getPreviewUrl = (url: string) => {
        if (url?.startsWith('data:')) return url; // Base64 preview
        if (url?.startsWith('/api')) return url; // DB Image
        return url; // External
    };

    if (isLoading) return <div className="p-8 text-zinc-500 text-sm font-bold uppercase tracking-widest">Loading...</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {isCropping && selectedFile && (
                <ImageCropper
                    imageSrc={selectedFile}
                    onCropComplete={onCropComplete}
                    onCancel={() => { setIsCropping(false); setSelectedFile(null); }}
                    aspectRatio={21 / 9}
                />
            )}

            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Banners</h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Manage home carousel</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                    {isCreating ? 'Cancel' : 'New Banner'}
                </button>
            </header>

            {isCreating && (
                <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl space-y-6 animate-fade-in text-white">
                    {/* Image Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Banner Image (Required)</label>

                        {!newBanner.imageUrl ? (
                            <div className="w-full p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-white/30 transition-colors bg-black/20">
                                {isUploading ? (
                                    <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest animate-pulse">Uploading...</div>
                                ) : (
                                    <>
                                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest text-center">
                                            Upload and Crop (21:9)
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={onFileSelect}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white file:text-zinc-900 hover:file:bg-zinc-200 cursor-pointer max-w-xs mx-auto"
                                        />
                                        <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2">- OR -</div>
                                        <input
                                            type="text"
                                            placeholder="Paste Image URL directly"
                                            value={newBanner.imageUrl}
                                            onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                                            className="bg-transparent border-b border-white/20 text-center text-xs text-white focus:outline-hidden focus:border-white w-full max-w-md py-1"
                                        />
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="relative w-full aspect-21/9 rounded-xl overflow-hidden border border-white/10 group">
                                <ImageRenderer
                                    src={getPreviewUrl(newBanner.imageUrl)}
                                    alt="Preview"
                                />
                                <button
                                    onClick={() => setNewBanner({ ...newBanner, imageUrl: '' })}
                                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white rounded-lg transition-colors z-10"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Title</label>
                            <input
                                type="text"
                                value={newBanner.title}
                                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-white/30 transition-colors placeholder:text-zinc-700"
                                placeholder="Big Sale"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Link</label>
                            <input
                                type="text"
                                value={newBanner.link}
                                onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-white/30 transition-colors placeholder:text-zinc-700"
                                placeholder="/characters"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleCreate}
                            disabled={!newBanner.imageUrl}
                            className="px-6 py-2.5 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Banner
                        </button>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {banners.length === 0 && !isCreating && (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-white/5 border-dashed">
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No active banners</p>
                    </div>
                )}
                {banners.map((banner) => (
                    <div key={banner.id} className="flex items-center gap-6 p-4 bg-zinc-900/30 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                        <div className="w-48 h-20 rounded-xl bg-zinc-950 overflow-hidden relative border border-white/5 shrink-0">
                            <ImageRenderer
                                src={banner.imageUrl}
                                alt={banner.title || ""}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-lg truncate">{banner.title || <span className="text-zinc-600 italic">Untitled</span>}</h3>
                            <p className="text-zinc-500 text-xs font-mono truncate mt-1">{banner.link || 'No link'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleToggle(banner.id, !banner.isActive)}
                                className={`h-10 px-4 rounded-xl flex items-center justify-center font-bold text-[10px] uppercase tracking-widest transition-all ${banner.isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-transparent'}`}
                            >
                                {banner.isActive ? 'Active' : 'Hidden'}
                            </button>
                            <button
                                onClick={() => handleDelete(banner.id)}
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const ImageRenderer = ({ src, alt }: { src: string; alt: string }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="relative w-full h-full overflow-hidden bg-zinc-950">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 animate-pulse">
                    <div className="w-5 h-5 rounded-full border border-white/10 border-t-white/30 animate-spin" />
                </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                onLoad={() => setIsLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
}
