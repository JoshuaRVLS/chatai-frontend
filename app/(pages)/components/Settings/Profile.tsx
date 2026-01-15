"use client";

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Image } from "@/types/type";
import { User } from "@/app/generated/prisma";
import { FiUser, FiMail, FiSave, FiLoader, FiCamera } from "react-icons/fi";
import { toast } from '@/app/lib/toast';
import { useQueryClient } from "@tanstack/react-query";
import UserAvatar from "../Common/UserAvatar";

const Profile = ({ data }: { data: User & { profileImage: Image } }) => {
  const [username, setUsername] = useState(data?.username || "");
  const [email, setEmail] = useState(data?.email || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState<{ data: string; mimetype: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        body: JSON.stringify({
          username,
          email,
          ...(profileImage && { profileImage })
        }),
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["settingsData", data.id] });
        setProfileImage(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const dataStr = base64String.split(",")[1];
      const mimetype = file.type;
      setProfileImage({ data: dataStr, mimetype });
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white text-2xl border border-white/20">
          <FiUser />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Profile Identity</h3>
          <p className="text-white/40 text-[10px] mt-1 uppercase tracking-[0.2em] font-black">Update your public profile information.</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 pb-6 border-b border-white/5">
        <div className="relative group">
          <div
            className="cursor-pointer relative transition-all group-hover:scale-[1.02]"
            onClick={() => fileInputRef.current?.click()}
          >
            <UserAvatar
              name={username}
              image={imagePreview || (data.id ? `/api/users/picture/${data.id}?t=${Date.now()}` : null)}
              size="xl"
            />

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-2xl">
              <FiCamera className="text-white text-2xl" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/70">Change Photo</span>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Recommended: 400x400 JPG or PNG</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
            Display Name
          </label>
          <div className="relative group">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/10 transition-all font-bold"
              placeholder="Your username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
            Email Address
          </label>
          <div className="relative group">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white/50 placeholder:text-white/20 outline-none cursor-not-allowed font-bold"
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
          className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 group hover:bg-zinc-200 transition-colors"
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
