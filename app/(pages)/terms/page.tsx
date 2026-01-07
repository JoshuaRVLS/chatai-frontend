"use client";

import React, { useState } from "react";
import { FiAlertCircle } from "react-icons/fi";

const TermsOfService: React.FC = () => {
    const [language, setLanguage] = useState<"en" | "id">("en");

    const content = {
        en: {
            title: "Terms of Service",
            lastUpdated: "Last Updated: January 7, 2026",
            sections: [
                {
                    heading: "1. Acceptance of Terms",
                    content: `By accessing and using JChatAI ("Service", "Platform", "we", "us", or "our"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
                },
                {
                    heading: "2. Description of Service",
                    content: `JChatAI is an AI-powered conversational platform that allows users to create, customize, and interact with AI characters. The service includes but is not limited to:`,
                    list: [
                        "Creation and customization of AI characters",
                        "Chat conversations with AI characters",
                        "Character sharing and community features",
                        "Lorebook creation and management",
                        "Persona customization"
                    ]
                },
                {
                    heading: "3. User Accounts",
                    content: `To use certain features of the service, you must register for an account. You agree to:`,
                    list: [
                        "Provide accurate, current, and complete information during registration",
                        "Maintain and promptly update your account information",
                        "Maintain the security of your password and accept all risks of unauthorized access",
                        "Notify us immediately if you discover or suspect any security breaches",
                        "Take responsibility for all activities that occur under your account"
                    ]
                },
                {
                    heading: "4. User Content",
                    content: `You retain ownership of any content you create on our platform. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content solely for the purpose of operating and improving the service.`
                },
                {
                    heading: "5. Acceptable Use Policy",
                    content: `You agree not to use the service to:`,
                    list: [
                        "Violate any laws or regulations",
                        "Infringe upon the rights of others",
                        "Upload or transmit viruses or malicious code",
                        "Spam, phish, or engage in other fraudulent activities",
                        "Impersonate any person or entity",
                        "Interfere with or disrupt the service or servers",
                        "Attempt to gain unauthorized access to any portion of the service",
                        "Create content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable"
                    ]
                },
                {
                    heading: "6. Content Moderation",
                    content: `We reserve the right to review, monitor, and remove any content at our sole discretion. We may suspend or terminate accounts that violate these terms or engage in prohibited activities.`
                },
                {
                    heading: "7. Intellectual Property",
                    content: `The service and its original content, features, and functionality are owned by JChatAI and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.`
                },
                {
                    heading: "8. AI-Generated Content",
                    content: `You understand and acknowledge that:`,
                    list: [
                        "AI-generated responses may not always be accurate or appropriate",
                        "We do not guarantee the quality, accuracy, or reliability of AI-generated content",
                        "You use AI-generated content at your own risk",
                        "We are not responsible for any decisions you make based on AI-generated content"
                    ]
                },
                {
                    heading: "9. Age Restrictions",
                    content: `You must be at least 13 years old to use this service. If you are between 13 and 18 years old, you must have permission from a parent or legal guardian. By using the service, you represent and warrant that you meet these age requirements.`
                },
                {
                    heading: "10. Termination",
                    content: `We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service.`
                },
                {
                    heading: "11. Limitation of Liability",
                    content: `To the fullest extent permitted by law, JChatAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.`
                },
                {
                    heading: "12. Disclaimer of Warranties",
                    content: `The service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, secure, or error-free.`
                },
                {
                    heading: "13. Changes to Terms",
                    content: `We reserve the right to modify or replace these terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.`
                },
                {
                    heading: "14. Governing Law",
                    content: `These terms shall be governed and construed in accordance with the laws of Indonesia, without regard to its conflict of law provisions.`
                },
                {
                    heading: "15. Contact Information",
                    content: `If you have any questions about these Terms of Service, please contact us at: support@jchatai.space`
                }
            ]
        },
        id: {
            title: "Ketentuan Layanan",
            lastUpdated: "Terakhir Diperbarui: 7 Januari 2026",
            sections: [
                {
                    heading: "1. Penerimaan Ketentuan",
                    content: `Dengan mengakses dan menggunakan JChatAI ("Layanan", "Platform", "kami", atau "kita"), Anda menerima dan setuju untuk terikat oleh ketentuan dan ketentuan perjanjian ini. Jika Anda tidak setuju untuk mematuhi hal di atas, harap jangan gunakan layanan ini.`
                },
                {
                    heading: "2. Deskripsi Layanan",
                    content: `JChatAI adalah platform percakapan berbasis AI yang memungkinkan pengguna untuk membuat, menyesuaikan, dan berinteraksi dengan karakter AI. Layanan ini mencakup tetapi tidak terbatas pada:`,
                    list: [
                        "Pembuatan dan penyesuaian karakter AI",
                        "Percakapan obrolan dengan karakter AI",
                        "Fitur berbagi karakter dan komunitas",
                        "Pembuatan dan pengelolaan Lorebook",
                        "Penyesuaian Persona"
                    ]
                },
                {
                    heading: "3. Akun Pengguna",
                    content: `Untuk menggunakan fitur tertentu dari layanan, Anda harus mendaftar untuk sebuah akun. Anda setuju untuk:`,
                    list: [
                        "Memberikan informasi yang akurat, terkini, dan lengkap selama pendaftaran",
                        "Memelihara dan segera memperbarui informasi akun Anda",
                        "Menjaga keamanan kata sandi Anda dan menerima semua risiko akses tidak sah",
                        "Memberi tahu kami segera jika Anda menemukan atau mencurigai adanya pelanggaran keamanan",
                        "Bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda"
                    ]
                },
                {
                    heading: "4. Konten Pengguna",
                    content: `Anda mempertahankan kepemilikan konten apa pun yang Anda buat di platform kami. Dengan memposting konten, Anda memberikan kami lisensi di seluruh dunia, non-eksklusif, bebas royalti untuk menggunakan, mereproduksi, memodifikasi, dan menampilkan konten Anda semata-mata untuk tujuan mengoperasikan dan meningkatkan layanan.`
                },
                {
                    heading: "5. Kebijakan Penggunaan yang Dapat Diterima",
                    content: `Anda setuju untuk tidak menggunakan layanan untuk:`,
                    list: [
                        "Melanggar hukum atau peraturan apa pun",
                        "Melanggar hak orang lain",
                        "Mengunggah atau mengirimkan virus atau kode berbahaya",
                        "Spam, phishing, atau terlibat dalam aktivitas penipuan lainnya",
                        "Menyamar sebagai orang atau entitas apa pun",
                        "Mengganggu atau mengacaukan layanan atau server",
                        "Mencoba mendapatkan akses tidak sah ke bagian mana pun dari layanan",
                        "Membuat konten yang ilegal, berbahaya, mengancam, kasar, melecehkan, memfitnah, vulgar, cabul, atau tidak menyenangkan"
                    ]
                },
                {
                    heading: "6. Moderasi Konten",
                    content: `Kami berhak untuk meninjau, memantau, dan menghapus konten apa pun atas kebijakan kami sendiri. Kami dapat menangguhkan atau menghentikan akun yang melanggar ketentuan ini atau terlibat dalam aktivitas yang dilarang.`
                },
                {
                    heading: "7. Kekayaan Intelektual",
                    content: `Layanan dan konten asli, fitur, dan fungsionalitasnya dimiliki oleh JChatAI dan dilindungi oleh undang-undang hak cipta internasional, merek dagang, paten, rahasia dagang, dan kekayaan intelektual lainnya.`
                },
                {
                    heading: "8. Konten yang Dihasilkan AI",
                    content: `Anda memahami dan mengakui bahwa:`,
                    list: [
                        "Respons yang dihasilkan AI mungkin tidak selalu akurat atau sesuai",
                        "Kami tidak menjamin kualitas, akurasi, atau keandalan konten yang dihasilkan AI",
                        "Anda menggunakan konten yang dihasilkan AI dengan risiko Anda sendiri",
                        "Kami tidak bertanggung jawab atas keputusan apa pun yang Anda buat berdasarkan konten yang dihasilkan AI"
                    ]
                },
                {
                    heading: "9. Batasan Usia",
                    content: `Anda harus berusia minimal 13 tahun untuk menggunakan layanan ini. Jika Anda berusia antara 13 dan 18 tahun, Anda harus mendapat izin dari orang tua atau wali hukum. Dengan menggunakan layanan, Anda menyatakan dan menjamin bahwa Anda memenuhi persyaratan usia ini.`
                },
                {
                    heading: "10. Penghentian",
                    content: `Kami dapat menghentikan atau menangguhkan akun Anda dan akses ke layanan segera, tanpa pemberitahuan atau kewajiban sebelumnya, untuk alasan apa pun, termasuk jika Anda melanggar Ketentuan Layanan ini.`
                },
                {
                    heading: "11. Batasan Tanggung Jawab",
                    content: `Sejauh diizinkan oleh hukum, JChatAI tidak bertanggung jawab atas kerusakan tidak langsung, insidental, khusus, konsekuensial, atau hukuman, atau kehilangan keuntungan atau pendapatan, baik yang terjadi secara langsung atau tidak langsung, atau kehilangan data, penggunaan, niat baik, atau kerugian tidak berwujud lainnya.`
                },
                {
                    heading: "12. Penafian Jaminan",
                    content: `Layanan ini disediakan "sebagaimana adanya" dan "sebagaimana tersedia" tanpa jaminan apa pun, baik tersurat maupun tersirat. Kami tidak menjamin bahwa layanan akan tidak terputus, aman, atau bebas kesalahan.`
                },
                {
                    heading: "13. Perubahan pada Ketentuan",
                    content: `Kami berhak untuk memodifikasi atau mengganti ketentuan ini kapan saja atas kebijakan kami sendiri. Jika revisi bersifat material, kami akan memberikan pemberitahuan setidaknya 30 hari sebelum ketentuan baru berlaku.`
                },
                {
                    heading: "14. Hukum yang Berlaku",
                    content: `Ketentuan ini akan diatur dan ditafsirkan sesuai dengan hukum Indonesia, tanpa memperhatikan ketentuan konflik hukumnya.`
                },
                {
                    heading: "15. Informasi Kontak",
                    content: `Jika Anda memiliki pertanyaan tentang Ketentuan Layanan ini, silakan hubungi kami di: support@jchatai.space`
                }
            ]
        }
    };

    const currentContent = content[language];

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black pt-24 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            {currentContent.title}
                        </h1>

                        {/* Language Switcher */}
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
                            <button
                                onClick={() => setLanguage("en")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${language === "en"
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-white/40 hover:text-white/60"
                                    }`}
                            >
                                🇬🇧 EN
                            </button>
                            <button
                                onClick={() => setLanguage("id")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${language === "id"
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-white/40 hover:text-white/60"
                                    }`}
                            >
                                🇮🇩 ID
                            </button>
                        </div>
                    </div>
                    <p className="text-white/40 text-sm font-medium">
                        {currentContent.lastUpdated}
                    </p>
                </div>

                {/* Important Notice */}
                <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <div className="flex items-start gap-3">
                        <FiAlertCircle className="text-amber-500 mt-1 flex-shrink-0" size={20} />
                        <div>
                            <h3 className="text-amber-500 font-bold mb-2">
                                {language === "en" ? "Important Notice" : "Pemberitahuan Penting"}
                            </h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                {language === "en"
                                    ? "Please read these Terms of Service carefully before using JChatAI. By using our service, you agree to be bound by these terms."
                                    : "Harap baca Ketentuan Layanan ini dengan cermat sebelum menggunakan JChatAI. Dengan menggunakan layanan kami, Anda setuju untuk terikat oleh ketentuan ini."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    {currentContent.sections.map((section, index) => (
                        <div
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl hover:border-white/20 transition-all"
                        >
                            <h2 className="text-2xl font-bold text-white mb-4">
                                {section.heading}
                            </h2>
                            <p className="text-white/70 leading-relaxed mb-4">
                                {section.content}
                            </p>
                            {section.list && (
                                <ul className="space-y-2 mt-4">
                                    {section.list.map((item, i) => (
                                        <li
                                            key={i}
                                            className="text-white/60 flex items-start gap-3"
                                        >
                                            <span className="text-primary mt-1">•</span>
                                            <span className="flex-1">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer Note */}
                <div className="mt-12 p-6 bg-primary/10 border border-primary/20 rounded-2xl">
                    <p className="text-white/60 text-sm leading-relaxed">
                        {language === "en"
                            ? "By clicking \"I Accept\" or by accessing or using the service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service."
                            : "Dengan mengklik \"Saya Setuju\" atau dengan mengakses atau menggunakan layanan, Anda mengakui bahwa Anda telah membaca, memahami, dan setuju untuk terikat oleh Ketentuan Layanan ini."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
