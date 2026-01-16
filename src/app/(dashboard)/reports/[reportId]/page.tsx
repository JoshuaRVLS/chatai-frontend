import { getReportById } from "@/actions/reports";
import Header from "@/components/Header";
import ReportActions from "@/components/ReportActions";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ reportId: string }>;
}

export default async function ReportDetailsPage({ params }: PageProps) {
    const { reportId } = await params;
    const report = await getReportById(reportId);

    if (!report) {
        return notFound();
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/reports"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <Header title="Report Details" subtitle={`ID: ${report.id}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-3xl bg-zinc-900 border border-white/5 space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Report Content</h3>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reason</p>
                            <p className="text-xl font-bold text-white">{report.reason}</p>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-white/5">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Details</p>
                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{report.details || "No details provided."}</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-zinc-900 border border-white/5 space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Actions</h3>
                        <ReportActions reportId={report.id} currentStatus={report.status} />
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-zinc-900 border border-white/5 space-y-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</p>
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block
                        ${report.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400' : ''}
                        ${report.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                        ${report.status === 'DISMISSED' ? 'bg-red-500/20 text-red-400' : ''}
                    `}>
                                {report.status}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date</p>
                            <p className="text-sm font-bold text-white">{new Date(report.createdAt).toLocaleString()}</p>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reporter</p>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                        <span className="text-xs font-black text-zinc-400">{report.reporter.username.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">{report.reporter.username}</p>
                                        <p className="text-[10px] text-zinc-500">{report.reporter.email}</p>
                                    </div>
                                </div>
                            </div>

                            {report.targetUser && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target User</p>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-red-500/10">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                            <span className="text-xs font-black text-red-400">{report.targetUser.username.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{report.targetUser.username}</p>
                                            <p className="text-[10px] text-zinc-500">{report.targetUser.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {report.targetCharacter && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Character</p>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-red-500/10">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                            <span className="text-xs font-black text-red-400">C</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{report.targetCharacter.name}</p>
                                            <p className="text-[10px] text-zinc-500">Character ID: {report.targetCharacterId}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
