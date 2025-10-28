'use client';

import React, { useContext, useState } from 'react'
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../providers/AuthProvider';
import { User } from '@/app/generated/prisma';
import { FiEdit, FiLock, FiUser, FiMail, FiTrash2, FiBell, FiShield, FiHelpCircle, FiMoon, FiLink, FiCamera } from 'react-icons/fi';
import { Image } from '@/@types/type';
const Settings = () => {
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('profile');

  const { data, isPending, error } = useQuery<User & {profileImage: Image}>({
    queryKey: ['settingsData'],
    queryFn: () => fetch(`/api/users/${user?.id}`).then(res => res.json().then(data => data.data)),
    enabled: !!user?.id,
  });

  const SettingsSection = ({ title, icon, children, id }: { title: string; icon: React.ReactNode; children: React.ReactNode; id: string }) => (
    <div className={`bg-var-color-for-dark-surface rounded-lg border border-var-color-borders overflow-hidden transition-all duration-200 ${
      activeSection === id ? 'ring-2 ring-var-color-primary-button' : 'hover:border-var-color-secondary-button'
    }`}>
      <button
        onClick={() => setActiveSection(id)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-var-color-borders transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-var-color-secondary-text">{icon}</div>
          <h3 className="text-lg font-semibold text-var-color-primary-text">{title}</h3>
        </div>
        <FiEdit className="text-var-color-disabled transition-transform duration-200" />
      </button>
      
      {activeSection === id && (
        <div className="px-6 pb-4 border-t border-var-color-borders">
          {children}
        </div>
      )}
    </div>
  );

  if (isPending) return (
    <div className="min-h-screen bg-var-color-primary-background pt-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-var-color-borders rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-var-color-borders rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-var-color-primary-background pt-24 px-4 flex items-center justify-center">
      <div className="text-center">
        <p className="text-var-color-error text-lg">Error loading settings: {error.message}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-var-color-primary-background pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-var-color-primary-text mb-2">Settings</h1>
          <p className="text-var-color-secondary-text">Manage your account settings and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-var-color-for-dark-surface rounded-lg border border-var-color-borders p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {data?.profileImage ? (
                <img
                  src={`data:${data.profileImage.mimetype};base64,${Buffer.from(
                    Object.values(data.profileImage.data)
                  ).toString("base64")}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-var-color-borders"
                  alt="Profile"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-var-color-primary-button to-var-color-secondary-button flex items-center justify-center text-white font-semibold text-lg">
                  {data?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <button className="absolute -bottom-1 -right-1 bg-var-color-primary-button text-white p-1.5 rounded-full border-2 border-var-color-for-dark-surface hover:bg-var-color-primary-hover-state transition-colors">
                <FiCamera size={14} />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-var-color-primary-text">{data?.username}</h2>
              <p className="text-var-color-secondary-text">{data?.email}</p>
              <p className="text-sm text-var-color-disabled mt-1">Member since {new Date(data.createdAt).getFullYear()}</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Profile Information */}
          <SettingsSection 
            title="Profile Information" 
            icon={<FiUser className="w-5 h-5" />} 
            id="profile"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-var-color-secondary-text mb-2">Username</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    defaultValue={data?.username}
                    className="flex-1 px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                  />
                  <button className="px-4 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors">
                    Save
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-var-color-secondary-text mb-2">Email</label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    defaultValue={data?.email}
                    className="flex-1 px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                  />
                  <button className="px-4 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors">
                    Update
                  </button>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Security */}
          <SettingsSection 
            title="Security" 
            icon={<FiLock className="w-5 h-5" />} 
            id="security"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-var-color-primary-text mb-2">Change Password</h4>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                  />
                  <button className="w-full bg-var-color-primary-button text-white py-2 rounded-lg hover:bg-var-color-primary-hover-state transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection 
            title="Notifications" 
            icon={<FiBell className="w-5 h-5" />} 
            id="notifications"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-var-color-primary-text">Email Notifications</p>
                  <p className="text-sm text-var-color-secondary-text">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-var-color-borders peer-focus:ring-4 peer-focus:ring-var-color-primary-button rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-var-color-borders after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-var-color-primary-button"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-var-color-primary-text">Push Notifications</p>
                  <p className="text-sm text-var-color-secondary-text">Receive browser notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-var-color-borders peer-focus:ring-4 peer-focus:ring-var-color-primary-button rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-var-color-borders after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-var-color-primary-button"></div>
                </label>
              </div>
            </div>
          </SettingsSection>

        

          {/* Connected Accounts */}
          <SettingsSection 
            title="Connected Accounts" 
            icon={<FiLink className="w-5 h-5" />} 
            id="accounts"
          >
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 border border-var-color-borders rounded-lg hover:bg-var-color-borders transition-colors">
                <span className="text-var-color-secondary-text">Connect Google</span>
                <span className="text-var-color-primary-button text-sm">Connect</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 border border-var-color-borders rounded-lg hover:bg-var-color-borders transition-colors">
                <span className="text-var-color-secondary-text">Connect GitHub</span>
                <span className="text-var-color-primary-button text-sm">Connect</span>
              </button>
            </div>
          </SettingsSection>

          {/* Support */}
          <SettingsSection 
            title="Support" 
            icon={<FiHelpCircle className="w-5 h-5" />} 
            id="support"
          >
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-var-color-borders rounded-lg hover:bg-var-color-borders transition-colors text-var-color-secondary-text">
                Help Center
              </button>
              <button className="w-full text-left p-3 border border-var-color-borders rounded-lg hover:bg-var-color-borders transition-colors text-var-color-secondary-text">
                Contact Support
              </button>
              <button className="w-full text-left p-3 border border-var-color-borders rounded-lg hover:bg-var-color-borders transition-colors text-var-color-secondary-text">
                Privacy Policy
              </button>
            </div>
          </SettingsSection>

          {/* Danger Zone */}
          <div className="bg-var-color-for-dark-surface rounded-lg border border-var-color-error overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-2">
                <FiTrash2 className="w-5 h-5 text-var-color-error" />
                <h3 className="text-lg font-semibold text-var-color-error">Danger Zone</h3>
              </div>
              <p className="text-var-color-secondary-text text-sm mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button className="px-6 py-2 bg-var-color-error text-white rounded-lg hover:bg-red-600 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;