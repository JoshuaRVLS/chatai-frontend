import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "JChatAI - Premium AI Conversations & Roleplay",
  description: "Experience the next level of AI interaction with JChatAI. Chat with unique AI personalities, create your own characters, and enjoy high-quality, secure AI roleplay.",
  keywords: ["AI chat", "AI roleplay", "character AI", "virtual companion", "JChatAI", "AI conversations"],
  openGraph: {
    title: "JChatAI - Premium AI Conversations & Roleplay",
    description: "Experience the next level of AI interaction. Chat with unique AI personalities and create your own characters.",
    url: "https://jchatai.space",
    siteName: "JChatAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JChatAI - Premium AI Conversations",
      },
    ],
    locale: "en_US",
    type: "website",
  },

};

import { getServerSession } from "next-auth";
import { authOptions } from "../utils/auth";
import LoginLanding from "./components/Auth/LoginLanding";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LoginLanding />;
  }

  return <HomeClient />;
}
