"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiMoon, FiSun, FiMonitor } from "react-icons/fi";

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex bg-surface-hover rounded-lg p-1 border border-border-default w-fit">
            <button
                onClick={() => setTheme("light")}
                className={`p-2 rounded-md transition-all ${theme === "light"
                    ? "bg-text-primary text-page shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                    }`}
                title="Light Mode"
            >
                <FiSun size={14} />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`p-2 rounded-md transition-all ${theme === "system"
                    ? "bg-text-primary text-page shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                    }`}
                title="System Mode"
            >
                <FiMonitor size={14} />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-md transition-all ${theme === "dark"
                    ? "bg-text-primary text-page shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                    }`}
                title="Dark Mode"
            >
                <FiMoon size={14} />
            </button>
        </div>
    );
};

export default ThemeToggle;
