'use client';

import React, { useContext, useState } from 'react'
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../providers/AuthProvider';
import { User } from '@/app/generated/prisma';
import { FiEdit, FiLock, FiUser, FiMail, FiTrash2, FiCamera } from 'react-icons/fi';
import { Image } from '@/@types/type';
import { motion, AnimatePresence } from 'motion/react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('profile');

  const { data, isPending, error } = useQuery<User & {profileImage: Image}>({
    queryKey: ['settingsData'],
    queryFn: () => fetch(`/api/users/${user?.id}`).then(res => res.json().then(data => data.data)),
    enabled: !!user?.id,
  });

  const SettingsSection = ({ title, icon, children, id }: { title: string; icon: React.ReactNode; children: React.ReactNode; id: string }) => (
    <motion.div 
      className={`bg-var-color-for-dark-surface rounded-lg border border-var-color-borders overflow-hidden transition-all duration-200 ${
        activeSection === id ? 'ring-2 ring-var-color-primary-button' : 'hover:border-var-color-secondary-button'
      }`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        onClick={() => setActiveSection(id)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-var-color-borders transition-colors"
        whileHover={{ backgroundColor: "var(--color-borders)" }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="text-var-color-secondary-text">{icon}</div>
          <h3 className="text-lg font-semibold text-var-color-primary-text">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: activeSection === id ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FiEdit className="text-var-color-disabled" />
        </motion.div>
      </motion.button>
      
      <AnimatePresence>
        {activeSection === id && (
          <motion.div 
            className="px-6 pb-4 border-t border-var-color-borders"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (isPending) return (
    <motion.div 
      className="min-h-screen bg-var-color-primary-background pt-24 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-var-color-borders rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <motion.div 
                key={i} 
                className="h-20 bg-var-color-borders rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              ></motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (error) return (
    <motion.div 
      className="min-h-screen bg-var-color-primary-background pt-24 px-4 flex items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <p className="text-var-color-error text-lg">Error loading settings: {error.message}</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      className="min-h-screen bg-var-color-primary-background pt-24 pb-8 px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <h1 className="text-3xl font-bold text-var-color-primary-text mb-2">Settings</h1>
          <p className="text-var-color-secondary-text">Manage your account settings and preferences</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div 
          className="bg-var-color-for-dark-surface rounded-lg border border-var-color-borders p-6 mb-6"
          variants={itemVariants}
          whileHover={{ boxShadow: "0 10px 30px rgba(0, 196, 179, 0.2)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              {data?.profileImage ? (
                <motion.img
                  src={`data:${data.profileImage.mimetype};base64,${Buffer.from(
                    Object.values(data.profileImage.data)
                  ).toString("base64")}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-var-color-borders"
                  alt="Profile"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                />
              ) : (
                <motion.div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-var-color-primary-button to-var-color-secondary-button flex items-center justify-center text-white font-semibold text-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {data?.username?.charAt(0).toUpperCase()}
                </motion.div>
              )}
              <motion.button 
                className="absolute -bottom-1 -right-1 bg-var-color-primary-button text-white p-1.5 rounded-full border-2 border-var-color-for-dark-surface hover:bg-var-color-primary-hover-state transition-colors"
                whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(0, 196, 179, 0.3)" }}
                whileTap={{ scale: 0.9 }}
              >
                <FiCamera size={14} />
              </motion.button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-var-color-primary-text">{data?.username}</h2>
              <p className="text-var-color-secondary-text">{data?.email}</p>
              <p className="text-sm text-var-color-disabled mt-1">Member since 2024</p>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
        >
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
                  <motion.input
                    type="text"
                    defaultValue={data?.username}
                    className="flex-1 px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                    whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.button 
                    className="px-4 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors"
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Save
                  </motion.button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-var-color-secondary-text mb-2">Email</label>
                <div className="flex gap-3">
                  <motion.input
                    type="email"
                    defaultValue={data?.email}
                    className="flex-1 px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                    whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.button 
                    className="px-4 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors"
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update
                  </motion.button>
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
                  <motion.input
                    type="password"
                    placeholder="Current password"
                    className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                    whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.input
                    type="password"
                    placeholder="New password"
                    className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                    whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                    whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.button 
                    className="w-full bg-var-color-primary-button text-white py-2 rounded-lg hover:bg-var-color-primary-hover-state transition-colors"
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update Password
                  </motion.button>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Danger Zone */}
          <motion.div 
            className="bg-var-color-for-dark-surface rounded-lg border border-var-color-error overflow-hidden"
            variants={itemVariants}
            whileHover={{ boxShadow: "0 10px 30px rgba(244, 67, 54, 0.2)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-2">
                <FiTrash2 className="w-5 h-5 text-var-color-error" />
                <h3 className="text-lg font-semibold text-var-color-error">Danger Zone</h3>
              </div>
              <p className="text-var-color-secondary-text text-sm mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <motion.button 
                className="px-6 py-2 bg-var-color-error text-white rounded-lg hover:bg-red-600 transition-colors"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(244, 67, 54, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Delete Account
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Settings;