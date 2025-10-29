import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { Image } from "@/@types/type";
import { User } from "@/app/generated/prisma";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const AiSettings = ({ data }: { data: User & { profileImage: Image } }) => {
  const [selectedOption, setSelectedOption] = useState<"default" | "external">(
    "default"
  );
  const [selectedModel, setSelectedModel] = useState("Deepseek");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const models = ["Deepseek", "Google Gemini 2.5", "Google Gemini Flash 2.0"];

  useEffect(() => {
    if (isModelDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isModelDropdownOpen]);

  return (
    <div className="space-y-6">
      {/* AI Model Settings */}
      <div className="overflow-visible">
        <h3 className="text-lg font-semibold text-var-color-primary-text mb-4">
          AI Model Settings
        </h3>
        <div className="space-y-4">
          {/* Option Selection */}
          <div>
            <label className="block text-sm font-medium text-var-color-secondary-text mb-2">
              Select AI Model Option
            </label>
            <div className="flex gap-4">
              <motion.label
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                  selectedOption === "default"
                    ? "bg-var-color-primary-button text-white border-var-color-primary-button"
                    : "bg-var-color-primary-background text-var-color-secondary-text border-var-color-borders"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <input
                  type="radio"
                  name="aiOption"
                  value="default"
                  checked={selectedOption === "default"}
                  onChange={() => setSelectedOption("default")}
                  className="hidden"
                />
                Default Model
              </motion.label>
              <motion.label
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                  selectedOption === "external"
                    ? "bg-var-color-primary-button text-white border-var-color-primary-button"
                    : "bg-var-color-primary-background text-var-color-secondary-text border-var-color-borders"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <input
                  type="radio"
                  name="aiOption"
                  value="external"
                  checked={selectedOption === "external"}
                  onChange={() => setSelectedOption("external")}
                  className="hidden"
                />
                External API
              </motion.label>
            </div>
          </div>

          {/* Custom Animated Select for Default Model */}
          {selectedOption === "default" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium text-var-color-secondary-text mb-2">
                Choose Default Model
              </label>
              <div className="relative">
                <motion.button
                  ref={buttonRef}
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-var-color-primary-background to-var-color-for-dark-surface border border-var-color-borders rounded-lg text-left text-var-color-primary-text flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{selectedModel}</span>
                  <motion.div
                    animate={{ rotate: isModelDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isModelDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </motion.div>
                </motion.button>
                {createPortal(
                  <AnimatePresence>
                    {isModelDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: "absolute",
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: dropdownPosition.width,
                          zIndex: 9999,
                        }}
                        className="bg-black text-white border border-var-color-borders rounded-lg shadow-2xl overflow-hidden"
                      >
                        {models.map((model, index) => (
                          <motion.button
                            key={model}
                            onClick={() => {
                              setSelectedModel(model);
                              setIsModelDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-var-color-primary-button hover:text-white transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            {model}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body
                )}
              </div>
            </motion.div>
          )}

          {/* External API Fields */}
          {selectedOption === "external" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-var-color-secondary-text mb-2">
                  API URL (Optional)
                </label>
                <motion.input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                  whileFocus={{
                    scale: 1.02,
                    boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)",
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-var-color-secondary-text mb-2">
                  API Key (Optional)
                </label>
                <motion.input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-3 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                  whileFocus={{
                    scale: 1.02,
                    boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)",
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          )}

          {/* Save Button for AI Settings */}
          <motion.button
            className="px-6 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Save AI Settings
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AiSettings;
