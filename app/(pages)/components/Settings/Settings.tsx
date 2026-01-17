"use client";

import React, { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../providers/AuthProvider";
import { User } from "@/app/generated/prisma";
import {
  FiUser,
  FiCpu,
  FiShield,
  FiLock,
} from "react-icons/fi";
import { Image } from "@/types/type";
import Security from "./Security";
import Profile from "./Profile";
import { toast } from '@/app/lib/toast';
import { useRouter } from "next/navigation";
import DeleteConfirmation from "./DeleteConfirmation";
import AiSettings from "./AiSettings";
import Safety from "./Safety";
import SettingsLayout from "./SettingsLayout";
import ThemeToggle from "./ThemeToggle";

const Settings = () => {
  const { user, status: authStatus } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();

  const { data, isPending, error, refetch } = useQuery<User & { profileImage: Image; userSettings: any }>({
    queryKey: ["settingsData", user?.id],
    queryFn: () =>
      fetch(`/api/users/${user?.id}`).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch settings");
        return res.json().then((data) => data.data);
      }),
    enabled: !!user?.id && authStatus === "authenticated",
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
    { id: "profile", label: "Profile", icon: <FiUser />, description: "Identity & Bio" },
    { id: "ai-settings", label: "AI Engine", icon: <FiCpu />, description: "Models & Keys" },
    { id: "safety", label: "Safety", icon: <FiShield />, description: "Filters & blocking" },
    { id: "security", label: "Security", icon: <FiLock />, description: "Password & access" },
  ];

  if (isPending || authStatus === "loading") {
    return (
      <div className="min-h-screen pt-32 px-6 flex justify-center">
        <div className="w-full max-w-5xl animate-pulse space-y-8">
          <div className="h-12 w-48 bg-white/5 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
            <div className="h-64 bg-white/5 rounded-2xl" />
            <div className="h-[500px] bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 px-6 flex flex-col items-center justify-center gap-6">
        <div className="p-8 rounded-3xl bg-error/10 border border-error/20 text-center space-y-4 max-w-md">
          <FiShield className="text-4xl text-error mx-auto" />
          <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">System Access Interrupted</h2>
          <p className="text-zinc-500 text-sm">We encountered error while retrieving your credentials.</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-24 right-6 z-50 mobile-hide">
        <ThemeToggle />
      </div>
      <SettingsLayout
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDeleteClick={() => setIsDeleteModalOpen(true)}
        user={user}
      >
        {activeTab === "profile" && data && <Profile data={data} />}
        {activeTab === "ai-settings" && data && <AiSettings data={data} />}
        {activeTab === "safety" && data && <Safety data={data} />}
        {activeTab === "security" && <Security />}
      </SettingsLayout>

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
};

export default Settings;
