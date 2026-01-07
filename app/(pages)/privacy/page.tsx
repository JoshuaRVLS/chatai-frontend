"use client";

import React, { useState } from "react";
import { FiGlobe } from "react-icons/fi";

const PrivacyPolicy: React.FC = () => {
    const [language, setLanguage] = useState<"en" | "id">("en");

    const content = {
        en: {
            title: "Privacy Policy",
            lastUpdated: "Last Updated: January 7, 2026",
            sections: [
                {
                    heading: "1. Introduction",
                    content: `Welcome to JChatAI. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our platform and tell you about your privacy rights and how the law protects you.`
                },
                {
                    heading: "2. Information We Collect",
                    content: `We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:`,
                    list: [
                        "Identity Data: includes username, email address, and profile information",
                        "Technical Data: includes internet protocol (IP) address, browser type and version, time zone setting, browser plug-in types and versions, operating system and platform",
                        "Usage Data: includes information about how you use our platform, products and services",
                        "Content Data: includes characters you create, chat histories, and other content you generate on our platform"
                    ]
                },
                {
                    heading: "3. How We Use Your Information",
                    content: `We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:`,
                    list: [
                        "To provide and maintain our service",
                        "To notify you about changes to our service",
                        "To allow you to participate in interactive features of our service when you choose to do so",
                        "To provide customer support",
                        "To gather analysis or valuable information so that we can improve our service",
                        "To monitor the usage of our service",
                        "To detect, prevent and address technical issues"
                    ]
                },
                {
                    heading: "4. Data Security",
                    content: `We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.`
                },
                {
                    heading: "5. Data Retention",
                    content: `We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.`
                },
                {
                    heading: "6. Your Legal Rights",
                    content: `Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:`,
                    list: [
                        "Request access to your personal data",
                        "Request correction of your personal data",
                        "Request erasure of your personal data",
                        "Object to processing of your personal data",
                        "Request restriction of processing your personal data",
                        "Request transfer of your personal data",
                        "Right to withdraw consent"
                    ]
                },
                {
                    heading: "7. Third-Party Links",
                    content: `Our platform may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.`
                },
                {
                    heading: "8. Cookies",
                    content: `We use cookies and similar tracking technologies to track the activity on our service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.`
                },
                {
                    heading: "9. Children's Privacy",
                    content: `Our service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us.`
                },
                {
                    heading: "10. Changes to This Privacy Policy",
                    content: `We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date at the top of this privacy policy.`
                },
                {
                    heading: "11. Contact Us",
                    content: `If you have any questions about this privacy policy, please contact us at: support@jchatai.space`
                }
            ]
        },
        id: {
            title: "Kebijakan Privasi",
            lastUpdated: "Terakhir Diperbarui: 7 Januari 2026",
            sections: [
                {
                    heading: "1. Pendahuluan",
                    content: `Selamat datang di JChatAI. Kami menghormati privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan privasi ini akan memberi tahu Anda tentang bagaimana kami menjaga data pribadi Anda saat Anda mengunjungi platform kami dan memberi tahu Anda tentang hak privasi Anda dan bagaimana hukum melindungi Anda.`
                },
                {
                    heading: "2. Informasi yang Kami Kumpulkan",
                    content: `Kami dapat mengumpulkan, menggunakan, menyimpan, dan mentransfer berbagai jenis data pribadi tentang Anda yang telah kami kelompokkan sebagai berikut:`,
                    list: [
                        "Data Identitas: termasuk nama pengguna, alamat email, dan informasi profil",
                        "Data Teknis: termasuk alamat protokol internet (IP), jenis dan versi browser, pengaturan zona waktu, jenis dan versi plug-in browser, sistem operasi dan platform",
                        "Data Penggunaan: termasuk informasi tentang bagaimana Anda menggunakan platform, produk, dan layanan kami",
                        "Data Konten: termasuk karakter yang Anda buat, riwayat obrolan, dan konten lain yang Anda hasilkan di platform kami"
                    ]
                },
                {
                    heading: "3. Bagaimana Kami Menggunakan Informasi Anda",
                    content: `Kami hanya akan menggunakan data pribadi Anda ketika hukum mengizinkan kami. Paling umum, kami akan menggunakan data pribadi Anda dalam keadaan berikut:`,
                    list: [
                        "Untuk menyediakan dan memelihara layanan kami",
                        "Untuk memberi tahu Anda tentang perubahan pada layanan kami",
                        "Untuk memungkinkan Anda berpartisipasi dalam fitur interaktif layanan kami saat Anda memilih untuk melakukannya",
                        "Untuk memberikan dukungan pelanggan",
                        "Untuk mengumpulkan analisis atau informasi berharga sehingga kami dapat meningkatkan layanan kami",
                        "Untuk memantau penggunaan layanan kami",
                        "Untuk mendeteksi, mencegah, dan mengatasi masalah teknis"
                    ]
                },
                {
                    heading: "4. Keamanan Data",
                    content: `Kami telah menerapkan langkah-langkah keamanan yang sesuai untuk mencegah data pribadi Anda hilang secara tidak sengaja, digunakan atau diakses dengan cara yang tidak sah, diubah atau diungkapkan. Selain itu, kami membatasi akses ke data pribadi Anda kepada karyawan, agen, kontraktor, dan pihak ketiga lainnya yang memiliki kebutuhan bisnis untuk mengetahui.`
                },
                {
                    heading: "5. Retensi Data",
                    content: `Kami hanya akan menyimpan data pribadi Anda selama diperlukan untuk memenuhi tujuan kami mengumpulkannya, termasuk untuk tujuan memenuhi persyaratan hukum, akuntansi, atau pelaporan.`
                },
                {
                    heading: "6. Hak Hukum Anda",
                    content: `Dalam keadaan tertentu, Anda memiliki hak berdasarkan undang-undang perlindungan data sehubungan dengan data pribadi Anda, termasuk hak untuk:`,
                    list: [
                        "Meminta akses ke data pribadi Anda",
                        "Meminta koreksi data pribadi Anda",
                        "Meminta penghapusan data pribadi Anda",
                        "Menolak pemrosesan data pribadi Anda",
                        "Meminta pembatasan pemrosesan data pribadi Anda",
                        "Meminta transfer data pribadi Anda",
                        "Hak untuk menarik persetujuan"
                    ]
                },
                {
                    heading: "7. Tautan Pihak Ketiga",
                    content: `Platform kami mungkin menyertakan tautan ke situs web, plug-in, dan aplikasi pihak ketiga. Mengklik tautan tersebut atau mengaktifkan koneksi tersebut dapat memungkinkan pihak ketiga untuk mengumpulkan atau berbagi data tentang Anda. Kami tidak mengontrol situs web pihak ketiga ini dan tidak bertanggung jawab atas pernyataan privasi mereka.`
                },
                {
                    heading: "8. Cookie",
                    content: `Kami menggunakan cookie dan teknologi pelacakan serupa untuk melacak aktivitas pada layanan kami dan menyimpan informasi tertentu. Cookie adalah file dengan sejumlah kecil data yang mungkin menyertakan pengenal unik anonim. Anda dapat menginstruksikan browser Anda untuk menolak semua cookie atau untuk menunjukkan saat cookie dikirim.`
                },
                {
                    heading: "9. Privasi Anak-anak",
                    content: `Layanan kami tidak dimaksudkan untuk digunakan oleh anak-anak di bawah usia 13 tahun. Kami tidak dengan sengaja mengumpulkan informasi yang dapat diidentifikasi secara pribadi dari anak-anak di bawah 13 tahun. Jika Anda adalah orang tua atau wali dan Anda menyadari bahwa anak Anda telah memberikan data pribadi kepada kami, silakan hubungi kami.`
                },
                {
                    heading: "10. Perubahan pada Kebijakan Privasi Ini",
                    content: `Kami dapat memperbarui kebijakan privasi kami dari waktu ke waktu. Kami akan memberi tahu Anda tentang perubahan apa pun dengan memposting kebijakan privasi baru di halaman ini dan memperbarui tanggal "Terakhir Diperbarui" di bagian atas kebijakan privasi ini.`
                },
                {
                    heading: "11. Hubungi Kami",
                    content: `Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di: support@jchatai.space`
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
                    <div className="flex items-start gap-3">
                        <FiGlobe className="text-primary mt-1 flex-shrink-0" size={20} />
                        <p className="text-white/60 text-sm leading-relaxed">
                            {language === "en"
                                ? "By using JChatAI, you acknowledge that you have read and understood this Privacy Policy and agree to its terms."
                                : "Dengan menggunakan JChatAI, Anda mengakui bahwa Anda telah membaca dan memahami Kebijakan Privasi ini dan setuju dengan ketentuannya."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
