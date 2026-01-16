"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiX, FiLink, FiCheck, FiShare2 } from 'react-icons/fi';
import { FaTwitter, FaReddit, FaFacebook, FaWhatsapp } from 'react-icons/fa';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
    url: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, text, url }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    const shareLinks = [
        {
            name: 'Twitter',
            icon: FaTwitter,
            color: 'hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] border-[#1DA1F2]/30',
            onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        },
        {
            name: 'Reddit',
            icon: FaReddit,
            color: 'hover:bg-[#FF4500]/20 hover:text-[#FF4500] border-[#FF4500]/30',
            onClick: () => window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank')
        },
        {
            name: 'Facebook',
            icon: FaFacebook,
            color: 'hover:bg-[#1877F2]/20 hover:text-[#1877F2] border-[#1877F2]/30',
            onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        },
        {
            name: 'WhatsApp',
            icon: FaWhatsapp,
            color: 'hover:bg-[#25D366]/20 hover:text-[#25D366] border-[#25D366]/30',
            onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank')
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl z-[101]"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <FiShare2 className="text-zinc-500" />
                                Share Character
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Copy Link Section */}
                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Character Link</p>
                                    <p className="text-xs text-white truncate font-mono">{url}</p>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={`p-2.5 rounded-lg border transition-all duration-300 flex items-center justify-center ${copied
                                        ? 'bg-green-500/20 text-green-500 border-green-500/30'
                                        : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {copied ? <FiCheck size={16} /> : <FiLink size={16} />}
                                </button>
                            </div>

                            <div className="w-full h-px bg-white/5" />

                            {/* Social Grid */}
                            <div className="grid grid-cols-4 gap-3">
                                {shareLinks.map((link) => (
                                    <button
                                        key={link.name}
                                        onClick={link.onClick}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-white/2 transition-all duration-300 group ${link.color}`}
                                    >
                                        <link.icon size={24} className="transition-transform group-hover:scale-110" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-inherit">
                                            {link.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;
