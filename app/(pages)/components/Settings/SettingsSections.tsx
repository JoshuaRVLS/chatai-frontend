'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react';
import { FiEdit } from 'react-icons/fi';


const SettingsSection = ({ activeSection, setActiveSection, title, icon, children, id }: { activeSection: string; setActiveSection: React.Dispatch<React.SetStateAction<string>>; title: string; icon: React.ReactNode; children: React.ReactNode; id: string }) => (
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

export default SettingsSection;