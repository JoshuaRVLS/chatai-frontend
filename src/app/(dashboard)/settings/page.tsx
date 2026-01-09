'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowRegistration: true,
        whitelistMode: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (res.ok) setSettings(data);
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                alert('Settings updated successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update settings');
            }
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Header title="Settings" subtitle="Configure system settings" />
                <div className="p-8"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Accessing system secure storage...</p></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <Header title="Settings" subtitle="Configure system settings" />

            <div className="space-y-16 animate-fade-in max-w-4xl mt-8">
                {/* System Controls */}
                <div className="card-premium p-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 px-2">System Controls</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-white/2.5 border border-white/5 hover:border-white/10 transition-all">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-200">Maintenance Mode</p>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">Disable access for all non-admin users</p>
                                {settings.whitelistMode && <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-tighter mt-1">⚠️ Enabling will disable Whitelist Mode</p>}
                            </div>
                            <button
                                onClick={() => {
                                    const newMaintenanceMode = !settings.maintenanceMode;
                                    setSettings({
                                        ...settings,
                                        maintenanceMode: newMaintenanceMode,
                                        // Disable whitelist mode if enabling maintenance mode
                                        whitelistMode: newMaintenanceMode ? false : settings.whitelistMode
                                    });
                                }}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.maintenanceMode ? 'bg-red-500/20 border border-red-500/20' : 'bg-white/5 border border-white/10'}`}
                            >
                                <div className={`w-4 h-4 rounded-lg absolute top-0.5 transition-all duration-300 ${settings.maintenanceMode ? 'translate-x-7 bg-red-500 shadow-lg shadow-red-500/50' : 'translate-x-1 bg-zinc-600'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-white/2.5 border border-white/5 hover:border-white/10 transition-all">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-200">Allow Registration</p>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">Enable new user signups via public portal</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.allowRegistration ? 'bg-emerald-500/20 border border-emerald-500/20' : 'bg-white/5 border border-white/10'}`}
                            >
                                <div className={`w-4 h-4 rounded-lg absolute top-0.5 transition-all duration-300 ${settings.allowRegistration ? 'translate-x-7 bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'translate-x-1 bg-zinc-600'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-white/2.5 border border-white/5 hover:border-white/10 transition-all">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-200">Whitelist Mode</p>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">Only whitelisted users can access the site (manage in Users panel)</p>
                                {settings.maintenanceMode && <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-tighter mt-1">⚠️ Enabling will disable Maintenance Mode</p>}
                            </div>
                            <button
                                onClick={() => {
                                    const newWhitelistMode = !settings.whitelistMode;
                                    setSettings({
                                        ...settings,
                                        whitelistMode: newWhitelistMode,
                                        // Disable maintenance mode if enabling whitelist mode
                                        maintenanceMode: newWhitelistMode ? false : settings.maintenanceMode
                                    });
                                }}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.whitelistMode ? 'bg-amber-500/20 border border-amber-500/20' : 'bg-white/5 border border-white/10'}`}
                            >
                                <div className={`w-4 h-4 rounded-lg absolute top-0.5 transition-all duration-300 ${settings.whitelistMode ? 'translate-x-7 bg-amber-500 shadow-lg shadow-amber-500/50' : 'translate-x-1 bg-zinc-600'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="btn btn-primary px-8 py-3 h-auto text-[10px] flex items-center gap-2 group"
                    >
                        {saving ? 'Syncing...' : 'Apply System Changes'}
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
