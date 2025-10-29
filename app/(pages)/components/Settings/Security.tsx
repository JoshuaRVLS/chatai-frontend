"use client";

import React, { useContext, useState } from "react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { AuthContext } from "../../providers/AuthProvider";
import { useRouter } from "next/navigation";

const Security = () => {
  const { user } = useContext(AuthContext);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const router = useRouter();

  const changePassword = async () => {
    try {
      const response = await fetch(`/api/users/change-password/${user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        router.refresh();
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-var-color-primary-text mb-2">
          Change Password
        </h4>
        <div className="space-y-3">
          <motion.input
            type="password"
            placeholder="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
            whileFocus={{
              scale: 1.02,
              boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)",
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
            whileFocus={{
              scale: 1.02,
              boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)",
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.input
            type="password"
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
            whileFocus={{
              scale: 1.02,
              boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)",
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.button
            className="w-full bg-var-color-primary-button text-white py-2 rounded-lg hover:bg-var-color-primary-hover-state transition-colors"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)",
            }}
            onClick={changePassword}
            whileTap={{ scale: 0.95 }}
          >
            Update Password
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Security;
