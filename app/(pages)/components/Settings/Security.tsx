"use client";

import React, { useContext, useState } from "react";
import { motion } from "motion/react";
import { toast } from '@/app/lib/toast';
import { AuthContext } from "../../providers/AuthProvider";
import { FiShield, FiLock, FiCheckCircle, FiLoader } from "react-icons/fi";

const Security = () => {
  const { user } = useContext(AuthContext);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill in all security fields");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/change-password/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword, confirmNewPassword }),
      });

      if (response.ok) {
        toast.success("Password secured and updated");
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Security update failed");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error("Encryption service error. Try again later.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl border border-primary/20">
          <FiShield />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Security & Access</h3>
          <p className="text-white/40 text-[10px] mt-1 uppercase tracking-[0.2em] font-black">Enhance your account's protection.</p>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
            Current Password
          </label>
          <div className="relative group">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="input-modern has-icon"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="h-px bg-white/5 my-2" />

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
            New Password
          </label>
          <div className="relative group">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-modern has-icon"
              placeholder="Min. 8 characters"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
            Confirm New Password
          </label>
          <div className="relative group">
            <FiCheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="input-modern has-icon"
              placeholder="Repeat new password"
            />
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
              <FiShield className="group-hover:rotate-12 transition-transform" />
              <span>Update Password</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

export default Security;
