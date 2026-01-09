import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#09090b]">
            <Sidebar />

            {/* 
                THE UNDENIABLE SPACER 
                Increased to 320px to give a forced 60px gap from the 260px sidebar
            */}
            <div className="w-[320px] shrink-0 hidden lg:block" />

            <main className="flex-1 min-w-0 p-8 md:p-16 lg:p-24 xl:p-32 relative z-0 flex flex-col">
                {/* 
                    THE FLOATING PAGE CONTAINER 
                    This makes the 'Right Page' clearly distinct with its own border and shadow
                */}
                <div className="flex-1 w-full max-w-[1600px] mx-auto bg-zinc-900/40 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col m-8">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
