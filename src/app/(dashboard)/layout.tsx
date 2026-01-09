import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            {/* Spacer for fixed sidebar */}
            <div className="w-[260px] shrink-0 hidden lg:block" />
            <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-12">
                {children}
            </main>
        </div>
    );
}
