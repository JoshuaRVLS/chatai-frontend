"use client";

import React, { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../providers/AuthProvider";
import { User } from "@/app/generated/prisma";
import {
  FiUser,
  FiTrash2,
  FiCpu,
  FiShield,
  FiChevronRight,
  FiLock,
} from "react-icons/fi";
import { Image } from "@/@types/type";
import { motion, AnimatePresence } from "motion/react";
import Security from "./Security";
import Profile from "./Profile";
import { toast } from '@/app/lib/toast';
import { useRouter } from "next/navigation";
import DeleteConfirmation from "./DeleteConfirmation";
import AiSettings from "./AiSettings";
import Safety from "./Safety";

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();

  const { data, isPending, error } = useQuery<User & { profileImage: Image; userSettings: any }>({
    queryKey: ["settingsData"],
    queryFn: () =>
      fetch(`/api/users/${user?.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
    enabled: !!user?.id,
  });

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Account deleted successfully");
        router.push("/login");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete account");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error("An error occurred. Please try again.");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <FiUser />, description: "Public details and bio" },
    { id: "ai-settings", label: "AI Engine", icon: <FiCpu />, description: "Models and API keys" },
    { id: "safety", label: "Safety", icon: <FiShield />, description: "Content filtering" },
    { id: "security", label: "Security", icon: <FiLock />, description: "Password and safety" },
  ];

  if (isPending) {
    return (
      <div className="min-h-screen pt-32 px-6 flex justify-center">
        <div className="w-full max-w-5xl animate-pulse space-y-8">
          <div className="h-12 w-48 bg-white/5 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
            <div className="h-64 bg-white/5 rounded-2xl" />
            <div className="h-[500px] bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold tracking-tight text-white mb-2"
          >
            Settings
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40"
          >
            Manage your digital presence and AI preferences.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10">
          {/* Sidebar Nav */}
          <aside className="space-y-6">
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group ${activeTab === tab.id
                    ? "bg-primary/10 border border-primary/20 text-primary"
                    : "hover:bg-white/5 border border-transparent text-white/50"
                    }`}
                >
                  <div className={`text-xl transition-transform duration-300 ${activeTab === tab.id ? "scale-110" : "group-hover:scale-110"}`}>
                    {tab.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${activeTab === tab.id ? "text-white" : ""}`}>{tab.label}</p>
                    <p className="text-[10px] opacity-60 uppercase tracking-widest mt-0.5">{tab.description}</p>
                  </div>
                  {activeTab === tab.id && <FiChevronRight />}
                </button>
              ))}
            </nav>

            <div className="h-px bg-white/5 mx-4" />

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group hover:bg-error/10 border border-transparent hover:border-error/20 text-white/30 hover:text-error"
            >
              <div className="text-xl group-hover:scale-110 transition-transform"><FiTrash2 /></div>
              <div className="flex-1">
                <p className="font-bold text-sm">Danger Zone</p>
                <p className="text-[10px] uppercase tracking-widest mt-0.5">Delete account</p>
              </div>
            </button>
          </aside>

          {/* Main Content Area */}
          <main className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="card-premium min-h-[500px] border border-white/5"
              >
                {activeTab === "profile" && <Profile data={data!} />}
                {activeTab === "ai-settings" && <AiSettings data={data!} />}
                {activeTab === "safety" && <Safety data={data!} />}
                {activeTab === "security" && <Security />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
};

export default Settings;
