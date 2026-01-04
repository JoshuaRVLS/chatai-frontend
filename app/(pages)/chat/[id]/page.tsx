import Chat from "@/app/(pages)/components/Chat/Chat";
import { Metadata } from "next";
import React from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { data } = await fetch(
      `${process.env.NEXTAUTH_URL}/api/chats/${(await params).id}`
    ).then((res) => res.json());

    if (!data?.character) {
      return { title: "Chat | Character AI" };
    }

    return {
      title: `${data.character.name} | Character Chat`,
      description: data.character.bio,
    };
  } catch (err) {
    return { title: "Chat | Character AI" };
  }
}


const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  return <Chat chatId={id} />;
};

export default page;
