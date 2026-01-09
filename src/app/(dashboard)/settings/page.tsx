'use client';

import Header from '@/components/Header';
import { useState } from 'react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        siteName: 'JChatAI',
        maxMessageLength: 4000,
        maintenanceMode: false,
        allowRegistration: true,
        defaultModel: 'gpt-4',
    });

    return (
        <div className="min-h-screen">
            <Header title="Settings" subtitle="Configure system settings" />

            <div className="p-8 animate-fade-in max-w-4xl">
                {/* General Settings */}
                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-6">General Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Site Name</label>
                            <input
                                type="text"
                                className="input"
                                value={settings.siteName}
                                onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Max Message Length</label>
                            <input
                                type="number"
                                className="input"
                                value={settings.maxMessageLength}
                                onChange={e => setSettings({ ...settings, maxMessageLength: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Default AI Model</label>
                            <select className="input" value={settings.defaultModel} onChange={e => setSettings({ ...settings, defaultModel: e.target.value })}>
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                <option value="claude-3">Claude 3</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Toggles */}
                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-6">System Controls</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--card-hover)]">
                            <div>
                                <p className="font-medium">Maintenance Mode</p>
                                <p className="text-sm text-[var(--muted)]">Disable access for all users</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                className={`w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-[var(--danger)]' : 'bg-[var(--border)]'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--card-hover)]">
                            <div>
                                <p className="font-medium">Allow Registration</p>
                                <p className="text-sm text-[var(--muted)]">Enable new user signups</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                                className={`w-12 h-6 rounded-full transition-colors ${settings.allowRegistration ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.allowRegistration ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                <button className="btn btn-primary">Save Settings</button>
            </div>
        </div>
    );
}
