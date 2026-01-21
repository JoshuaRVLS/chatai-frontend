"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    FiHome,
    FiPlusSquare,
    FiUser,
    FiLogOut,
    FiUsers,
    FiCpu,
    FiBookOpen,
    FiSettings,
    FiGrid
} from "react-icons/fi";
import ThemeToggle from "../Settings/ThemeToggle";
import { Orbitron } from "next/font/google";
import UserAvatar from "../Common/UserAvatar";
import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["900"] });

const MobileHeader = ({ isOpen, toggle, session }: { isOpen: boolean; toggle: () => void; session: any }) => {
    // Only show on mobile, fixed at top
    return (
        <div className={`md:hidden fixed top-0 left-0 right-0 z-[100] bg-surface border-b border-border-default px-4 py-3 flex items-center justify-between transition-transform duration-300 ${isOpen ? '-translate-y-full' : 'translate-y-0'}`}>
            <div className="flex items-center gap-4">
                <button
                    onClick={toggle}
                    className="w-10 h-10 rounded-full bg-surface-hover border border-border-default flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                    <span className="w-5 h-0.5 bg-text-primary rounded-full" />
                    <span className="w-5 h-0.5 bg-text-primary rounded-full" />
                    <span className="w-5 h-0.5 bg-text-primary rounded-full" />
                </button>
                <Link href="/" className="group">
                    <span className={`${orbitron.className} text-xl font-black tracking-tighter text-text-primary`}>
                        JChatAI
                    </span>
                </Link>
            </div>

            {session?.user && (
                <Link href="/settings" className="relative">
                    <UserAvatar
                        name={session.user?.name || session.user?.username}
                        image={session.user?.image}
                        size="sm"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-bg-surface rounded-full" />
                </Link>
            )}
        </div>
    );
};

const Sidebar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const openModal = useAuthModalStore((state) => state.openModal);
    const [isOpen, setIsOpen] = React.useState(false);

    // Close sidebar on route change
    React.useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Lock scroll when open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Hide on chat pages or specific routes if needed, OR if not logged in
    if (pathname.startsWith("/chat/") || !session) return null;

    const mainLinks = [
        { name: "Home", href: "/", icon: FiHome },
        { name: "Explore", href: "/explore", icon: FiGrid },
        { name: "My Characters", href: "/my_characters", icon: FiUsers },
        { name: "My Personas", href: "/my_personas", icon: FiCpu },
        { name: "Lorebooks", href: "/lorebooks", icon: <FiBookOpen /> },
    ];

    const createLinks = [
        { name: "New Character", href: "/create_character", icon: FiPlusSquare },
        { name: "New Lorebook", href: "/create_lorebook", icon: FiBookOpen },
    ];

    const systemLinks = [
        { name: "Settings", href: "/settings", icon: FiSettings },
    ];

    const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
        const isActive = pathname === href;
        return (
            <Link
                href={href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                    ? "bg-text-primary text-page shadow-lg"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                    }`}
            >
                {/* Handle both component and element icon types roughly */}
                {React.isValidElement(Icon) ? Icon : <Icon size={20} className={isActive ? "text-page" : "text-text-muted group-hover:text-text-primary"} />}
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isActive ? "text-page" : ""}`}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Header */}
            {!isOpen && <MobileHeader isOpen={isOpen} toggle={() => setIsOpen(!isOpen)} session={session} />}

            {/* Mobile Close Button (When Open) */}
            {isOpen && (
                <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden fixed top-4 right-4 z-60 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                >
                    <span className="sr-only">Close Menu</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed top-0 left-0 h-screen w-64 bg-surface border-r border-border-default z-[100] flex flex-col
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                {/* Logo Area */}
                <div className="px-8 pb-4 pt-24 md:p-8 md:pb-4">
                    <Link href="/" className="group block">
                        <span className={`${orbitron.className} text-2xl font-black tracking-tighter text-text-primary group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-text-muted group-hover:to-text-primary transition-all`}>
                            JChatAI
                        </span>
                        <div className="h-1 w-8 bg-border-hover mt-2 rounded-full group-hover:w-full transition-all duration-500" />
                    </Link>
                </div>

                {/* Scrollable Nav Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-hide">

                    {/* Main Nav */}
                    <div className="space-y-1">
                        {session && <p className="px-4 text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2">Platform</p>}
                        <NavItem href="/" icon={FiHome} label="Home" />
                        <NavItem href="/explore" icon={FiGrid} label="Explore" />
                        <NavItem href="/lorebooks" icon={FiBookOpen} label="Lorebooks" />
                        {session && (
                            <>
                                <NavItem href="/my_characters" icon={FiUsers} label="My Characters" />
                                <NavItem href="/my_personas" icon={FiCpu} label="My Personas" />
                            </>
                        )}
                    </div>

                    {/* Create Nav - Only for Auth */}
                    {session && (
                        <div className="space-y-1">
                            <p className="px-4 text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2">Creation</p>
                            {createLinks.map(link => (
                                <NavItem key={link.href} href={link.href} icon={link.icon} label={link.name} />
                            ))}
                        </div>
                    )}

                    {/* System Nav - Only for Auth */}
                    {session && (
                        <div className="space-y-1">
                            <p className="px-4 text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2">System</p>
                            {systemLinks.map(link => (
                                <NavItem key={link.href} href={link.href} icon={link.icon} label={link.name} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Profile / Footer Area */}
                <div className="p-4 border-t border-border-default bg-surface">
                    <div className="mb-4 flex justify-center">
                        <ThemeToggle />
                    </div>
                    {session ? (
                        <div className="flex flex-col gap-2">
                            <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors group">
                                <UserAvatar
                                    name={session.user?.name || (session.user as any)?.username}
                                    image={session.user?.image}
                                    size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-wider truncate">
                                        {session.user?.name || (session.user as any)?.username}
                                    </p>
                                    <p className="text-[8px] font-bold text-text-muted uppercase">
                                        {(session.user as any)?.isAdmin ? 'Administrator' : 'Verified User'}
                                    </p>
                                </div>
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-border-default text-text-muted hover:text-text-primary hover:bg-surface-hover hover:border-border-hover transition-all"
                            >
                                <FiLogOut size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => openModal('login')}
                            className="w-full py-3 rounded-xl bg-text-primary text-page font-black uppercase tracking-widest text-[9px] hover:opacity-90 transition-colors"
                        >
                            Sign In / Register
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
