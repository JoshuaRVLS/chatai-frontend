import React from "react";
import { motion } from "motion/react";
import { Image } from "@/@types/type";
import { User } from "@/app/generated/prisma";

const Profile = ({ data }: { data: User & { profileImage: Image } }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-var-color-secondary-text mb-2">
          Username
        </label>
        <div className="flex gap-3">
          <motion.input
            type="text"
            defaultValue={data?.username}
            className="flex-1 px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
            whileFocus={{
              scale: 1.02,
              boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)",
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.button
            className="px-4 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Save
          </motion.button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-var-color-secondary-text mb-2">
          Email
        </label>
        <div className="flex gap-3">
          <motion.input
            type="email"
            defaultValue={data?.email}
            className="flex-1 px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
            whileFocus={{
              scale: 1.02,
              boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)",
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.button
            className="px-4 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Update
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
