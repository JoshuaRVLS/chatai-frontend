"use client";

import React, { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../providers/AuthProvider";
import { User } from "@/app/generated/prisma";
import {
  FiEdit,
  FiLock,
  FiUser,
  FiMail,
  FiTrash2,
  FiCamera,
} from "react-icons/fi";
import { Image } from "@/@types/type";
import { motion, AnimatePresence } from "motion/react";
import SettingsSection from "./SettingsSections";
import Security from "./Security";
import Profile from "./Profile";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import DeleteConfirmation from "./DeleteConfirmation";
import AiSettings from "./AiSettings";

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState("profile");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for modal

  const { data, isPending, error } = useQuery<User & { profileImage: Image }>({
    queryKey: ["settingsData"],
    queryFn: () =>
      fetch(`/api/users/${user?.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
    enabled: !!user?.id,
  });

  const router = useRouter();

  const deleteAccount = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Account deleted successfully");
        router.push("/login");
      } else {
        toast.error(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const handleDeleteConfirm = () => {
    setIsDeleteModalOpen(false); // Close modal
    deleteAccount(); // Proceed with deletion
  };

  if (isPending)
    return (
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
              {[1, 2, 3].map((i) => (
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

  if (error)
    return (
      <motion.div
        className="min-h-screen bg-var-color-primary-background pt-24 px-4 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <p className="text-var-color-error text-lg">
            Error loading settings: {error.message}
          </p>
        </div>
      </motion.div>
    );

  return (
    <motion.div
      className="min-h-screen bg-var-color-primary-background pt-24 pb-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-var-color-primary-text mb-2">
            Settings
          </h1>
          <p className="text-var-color-secondary-text">
            Manage your account settings and preferences
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          className="bg-var-color-for-dark-surface rounded-lg border border-var-color-borders p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ boxShadow: "0 10px 30px rgba(0, 196, 179, 0.2)" }}
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
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 5px 15px rgba(0, 196, 179, 0.3)",
                }}
                whileTap={{ scale: 0.9 }}
              >
                <FiCamera size={14} />
              </motion.button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-var-color-primary-text">
                {data?.username}
              </h2>
              <p className="text-var-color-secondary-text">{data?.email}</p>
              <p className="text-sm text-var-color-disabled mt-1">
                Member since 2024
              </p>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Profile Information */}
          <SettingsSection
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            title="Profile Information"
            icon={<FiUser className="w-5 h-5" />}
            id="profile"
          >
            <Profile data={data} />
          </SettingsSection>

          <SettingsSection
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            title="AI Settings"
            icon={<FiUser className="w-5 h-5" />}
            id="ai-settings"
          >
            <AiSettings data={data} />
          </SettingsSection>

          {/* Security */}
          <SettingsSection
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            title="Security"
            icon={<FiLock className="w-5 h-5" />}
            id="security"
          >
            <Security />
          </SettingsSection>

          {/* Danger Zone */}
          <motion.div
            className="bg-var-color-for-dark-surface rounded-lg border border-var-color-error overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ boxShadow: "0 10px 30px rgba(244, 67, 54, 0.2)" }}
          >
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-2">
                <FiTrash2 className="w-5 h-5 text-var-color-error" />
                <h3 className="text-lg font-semibold text-var-color-error">
                  Danger Zone
                </h3>
              </div>
              <p className="text-var-color-secondary-text text-sm mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <motion.button
                className="px-6 py-2 bg-var-color-error text-white rounded-lg hover:bg-red-600 transition-colors"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 20px rgba(244, 67, 54, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDeleteModalOpen(true)} // Open modal instead of direct delete
              >
                Delete Account
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </motion.div>
  );
};

export default Settings;
