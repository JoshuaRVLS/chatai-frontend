"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Image } from "@/@types/type";
import { User } from "@/app/generated/prisma";
import { FiUser, FiMail, FiSave, FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

const Profile = ({ data }: { data: User & { profileImage: Image } }) => {
  const [username, setUsername] = useState(data?.username || "");
  const [email, setEmail] = useState(data?.email || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["settingsData"] });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl border border-primary/20">
          <FiUser />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Profile Identity</h3>
          <p className="text-white/40 text-[10px] mt-1 uppercase tracking-[0.2em] font-black">Update your public profile information.</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
            Display Name
          </label>
          <div className="relative group">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-modern has-icon"
              placeholder="Your username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
            Email Address
          </label>
          <div className="relative group">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-modern has-icon opacity-70 cursor-not-allowed"
              placeholder="your@email.com"
              disabled
            />
            <p className="text-[10px] text-white/20 mt-2 px-1 italic">Email changes are restricted to account security.</p>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isUpdating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 group"
        >
          {isUpdating ? (
            <FiLoader className="animate-spin" />
          ) : (
            <>
              <FiSave className="group-hover:translate-x-0.5 transition-transform" />
              <span>Save Changes</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

export default Profile;
